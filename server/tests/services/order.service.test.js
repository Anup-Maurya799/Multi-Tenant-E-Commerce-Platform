import { jest, describe, test, expect, beforeEach } from "@jest/globals";

const mockOrderCreate = jest.fn();
const mockOrderFindOne = jest.fn();
const mockOrderFind = jest.fn();
const mockProductFindById = jest.fn();

jest.unstable_mockModule("../../src/models/Order.js", () => ({
  default: {
    create: mockOrderCreate,
    findOne: mockOrderFindOne,
    find: mockOrderFind,
  },
}));

jest.unstable_mockModule("../../src/models/Product.js", () => ({
  default: {
    findById: mockProductFindById,
  },
}));

const mockUserFindById = jest.fn();
jest.unstable_mockModule("../../src/models/User.js", () => ({
  default: { findById: mockUserFindById },
}));

const mockSendEmail = jest.fn().mockResolvedValue(undefined);
jest.unstable_mockModule("../../src/utils/sendEmail.js", () => ({
  sendEmail: mockSendEmail,
  orderConfirmationEmailTemplate: () => "<html>order confirmation</html>",
}));

const mockPaymentIntentsCreate = jest.fn();
jest.unstable_mockModule("../../src/config/stripe.js", () => ({
  default: {
    paymentIntents: { create: mockPaymentIntentsCreate },
  },
}));

const orderService = await import("../../src/services/order.service.js");

const customer = { _id: "cust1" };

function makeProduct(overrides = {}) {
  return {
    _id: "prod1",
    storeId: { toString: () => "store1" },
    name: "Lavender Candle",
    price: 20,
    stock: 10,
    isPublished: true,
    variants: [],
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createOrderWithPaymentIntent", () => {
  test("throws 404 if a product doesn't exist", async () => {
    mockProductFindById.mockResolvedValueOnce(null);

    await expect(
      orderService.createOrderWithPaymentIntent(customer, {
        storeId: "store1",
        items: [{ productId: "ghost", quantity: 1 }],
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(mockOrderCreate).not.toHaveBeenCalled();
  });

  test("throws 400 if items span more than one store", async () => {
    mockProductFindById.mockResolvedValueOnce(
      makeProduct({ storeId: { toString: () => "store_OTHER" } }),
    );

    await expect(
      orderService.createOrderWithPaymentIntent(customer, {
        storeId: "store1", // claims store1, but the product actually belongs to store_OTHER
        items: [{ productId: "prod1", quantity: 1 }],
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("throws 400 if requested quantity exceeds available stock", async () => {
    mockProductFindById.mockResolvedValueOnce(makeProduct({ stock: 2 }));

    await expect(
      orderService.createOrderWithPaymentIntent(customer, {
        storeId: "store1",
        items: [{ productId: "prod1", quantity: 5 }],
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("throws 400 for an unpublished product", async () => {
    mockProductFindById.mockResolvedValueOnce(
      makeProduct({ isPublished: false }),
    );

    await expect(
      orderService.createOrderWithPaymentIntent(customer, {
        storeId: "store1",
        items: [{ productId: "prod1", quantity: 1 }],
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("computes totalAmount server-side from the product's real price, ignoring any client-supplied price", async () => {
    mockProductFindById.mockResolvedValueOnce(makeProduct({ price: 20 }));
    mockOrderCreate.mockImplementationOnce((doc) =>
      Promise.resolve({
        ...doc,
        _id: "order1",
        save: jest.fn().mockResolvedValue(undefined),
      }),
    );
    mockPaymentIntentsCreate.mockResolvedValueOnce({
      id: "pi_123",
      client_secret: "secret_123",
    });

    const { order, clientSecret } =
      await orderService.createOrderWithPaymentIntent(customer, {
        storeId: "store1",
        items: [{ productId: "prod1", quantity: 3, price: 0.01 }], // malicious/irrelevant client price, must be ignored
      });

    expect(order.totalAmount).toBe(60); // 20 * 3, NOT 0.01 * 3
    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 6000, currency: "usd" }), // in cents
    );
    expect(clientSecret).toBe("secret_123");
  });

  test("uses a variant's priceOverride and checks the variant's own stock, not the product's base stock", async () => {
    const product = makeProduct({
      price: 20,
      stock: 100, // plenty at the base level — the variant is what should be checked
      variants: [{ size: "Large", color: "", stock: 2, priceOverride: 26 }],
    });
    mockProductFindById.mockResolvedValueOnce(product);
    mockOrderCreate.mockImplementationOnce((doc) =>
      Promise.resolve({
        ...doc,
        _id: "order1",
        save: jest.fn().mockResolvedValue(undefined),
      }),
    );
    mockPaymentIntentsCreate.mockResolvedValueOnce({
      id: "pi_1",
      client_secret: "sec",
    });

    const { order } = await orderService.createOrderWithPaymentIntent(
      customer,
      {
        storeId: "store1",
        items: [{ productId: "prod1", quantity: 2, variantLabel: "Large" }],
      },
    );

    expect(order.totalAmount).toBe(52); // 26 * 2, the override price
  });
});

describe("handleStripeWebhookEvent — payment_intent.succeeded", () => {
  test("is idempotent: a second delivery of the same event does not double-decrement stock", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const alreadyPaidOrder = {
      _id: "order1",
      status: "paid", // already processed by an earlier delivery of this event
      items: [{ product: "prod1", quantity: 1, variantLabel: null }],
      save,
    };
    mockOrderFindOne.mockResolvedValueOnce(alreadyPaidOrder);

    await orderService.handleStripeWebhookEvent({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_123" } },
    });

    expect(save).not.toHaveBeenCalled(); // returned early — no double-processing
    expect(mockProductFindById).not.toHaveBeenCalled();
  });

  test("marks the order paid, decrements product stock, and sends a confirmation email on first delivery", async () => {
    const orderSave = jest.fn().mockResolvedValue(undefined);
    const order = {
      _id: "order1",
      customer: "cust1",
      totalAmount: 40,
      status: "pending",
      items: [
        {
          product: "prod1",
          quantity: 2,
          variantLabel: null,
          name: "Lavender Candle",
          unitPrice: 20,
        },
      ],
      save: orderSave,
    };
    mockOrderFindOne.mockResolvedValueOnce(order);

    const product = makeProduct({ stock: 10 });
    mockProductFindById.mockResolvedValueOnce(product);
    mockUserFindById.mockResolvedValueOnce({
      name: "Jane",
      email: "jane@test.dev",
    });

    await orderService.handleStripeWebhookEvent({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_123" } },
    });

    expect(order.status).toBe("paid");
    expect(orderSave).toHaveBeenCalledTimes(1);
    expect(product.stock).toBe(8); // 10 - 2
    expect(product.save).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "jane@test.dev" }),
    );
  });

  test("a failed confirmation email does not undo the order status or stock decrement", async () => {
    const orderSave = jest.fn().mockResolvedValue(undefined);
    const order = {
      _id: "order1",
      customer: "cust1",
      totalAmount: 20,
      status: "pending",
      items: [
        {
          product: "prod1",
          quantity: 1,
          variantLabel: null,
          name: "Candle",
          unitPrice: 20,
        },
      ],
      save: orderSave,
    };
    mockOrderFindOne.mockResolvedValueOnce(order);

    const product = makeProduct({ stock: 5 });
    mockProductFindById.mockResolvedValueOnce(product);
    mockUserFindById.mockResolvedValueOnce({
      name: "Jane",
      email: "jane@test.dev",
    });
    mockSendEmail.mockRejectedValueOnce(new Error("SMTP is down"));

    await expect(
      orderService.handleStripeWebhookEvent({
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_123" } },
      }),
    ).resolves.toBeUndefined(); // does not throw despite the email failure

    expect(order.status).toBe("paid"); // still paid
    expect(product.stock).toBe(4); // still decremented
  });

  test("decrements the matching variant's stock, not the base product stock, when the order item has a variant", async () => {
    const orderSave = jest.fn().mockResolvedValue(undefined);
    const order = {
      _id: "order1",
      status: "pending",
      items: [{ product: "prod1", quantity: 1, variantLabel: "Large" }],
      save: orderSave,
    };
    mockOrderFindOne.mockResolvedValueOnce(order);

    const product = makeProduct({
      stock: 50,
      variants: [{ size: "Large", color: "", stock: 5, priceOverride: null }],
    });
    mockProductFindById.mockResolvedValueOnce(product);

    await orderService.handleStripeWebhookEvent({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_123" } },
    });

    expect(product.variants[0].stock).toBe(4); // 5 - 1
    expect(product.stock).toBe(50); // base stock untouched
  });

  test("does nothing (no error) if no matching order is found for the PaymentIntent", async () => {
    mockOrderFindOne.mockResolvedValueOnce(null);
    await expect(
      orderService.handleStripeWebhookEvent({
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_unknown" } },
      }),
    ).resolves.toBeUndefined();
  });
});

describe("handleStripeWebhookEvent — payment_intent.payment_failed", () => {
  test("cancels a pending order", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const order = { status: "pending", save };
    mockOrderFindOne.mockResolvedValueOnce(order);

    await orderService.handleStripeWebhookEvent({
      type: "payment_intent.payment_failed",
      data: { object: { id: "pi_123" } },
    });

    expect(order.status).toBe("cancelled");
    expect(save).toHaveBeenCalledTimes(1);
  });

  test("does not touch an order that's already paid (shouldn't happen, but must not regress it)", async () => {
    const save = jest.fn();
    const order = { status: "paid", save };
    mockOrderFindOne.mockResolvedValueOnce(order);

    await orderService.handleStripeWebhookEvent({
      type: "payment_intent.payment_failed",
      data: { object: { id: "pi_123" } },
    });

    expect(order.status).toBe("paid");
    expect(save).not.toHaveBeenCalled();
  });
});

describe("unhandled event types", () => {
  test("does not throw for an event type this app doesn't act on", async () => {
    await expect(
      orderService.handleStripeWebhookEvent({
        type: "charge.refunded",
        data: { object: {} },
      }),
    ).resolves.toBeUndefined();
  });
});
