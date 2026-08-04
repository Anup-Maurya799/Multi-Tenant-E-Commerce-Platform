import { jest, describe, test, expect, beforeEach } from "@jest/globals";

const mockStoreFindOne = jest.fn();
const mockStoreFindById = jest.fn();
const mockStoreCreate = jest.fn();

jest.unstable_mockModule("../../src/models/Store.js", () => ({
  default: {
    findOne: mockStoreFindOne,
    findById: mockStoreFindById,
    create: mockStoreCreate,
  },
}));

jest.unstable_mockModule("../../src/models/User.js", () => ({
  default: {}, // store.service.js imports User but doesn't call it directly in these paths
}));

const storeService = await import("../../src/services/store.service.js");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createStore", () => {
  test("throws 409 if the vendor already owns a store", async () => {
    const vendorUser = { _id: "vendor1", storeId: "existing_store" };

    await expect(
      storeService.createStore(vendorUser, { name: "New Shop" }),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(mockStoreCreate).not.toHaveBeenCalled();
  });

  test("creates a store, generates a slug, and links it back to the vendor", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const vendorUser = { _id: "vendor1", storeId: null, save };

    mockStoreFindOne.mockResolvedValueOnce(null); // slug is unique on first try
    mockStoreCreate.mockImplementationOnce((doc) =>
      Promise.resolve({ _id: "store1", ...doc }),
    );

    const store = await storeService.createStore(vendorUser, {
      name: "Priya's Handmade Candles",
      description: "Soy candles",
    });

    expect(store.slug).toBe("priyas-handmade-candles");
    expect(vendorUser.storeId).toBe("store1"); // tenant-isolation key set on the user
    expect(save).toHaveBeenCalledTimes(1);
  });

  test("retries slug generation on collision", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const vendorUser = { _id: "vendor2", storeId: null, save };

    // First slug check finds a collision, second check (with suffix) is free.
    mockStoreFindOne
      .mockResolvedValueOnce({ _id: "other_store", slug: "cool-shop" })
      .mockResolvedValueOnce(null);
    mockStoreCreate.mockImplementationOnce((doc) =>
      Promise.resolve({ _id: "store2", ...doc }),
    );

    const store = await storeService.createStore(vendorUser, {
      name: "Cool Shop",
    });

    expect(mockStoreFindOne).toHaveBeenCalledTimes(2);
    expect(store.slug).not.toBe("cool-shop"); // got a suffixed variant instead
    expect(store.slug.startsWith("cool-shop-")).toBe(true);
  });
});

describe("updateStore (ownership enforcement)", () => {
  test("throws 404 if the store doesn't exist", async () => {
    mockStoreFindById.mockResolvedValueOnce(null);
    await expect(
      storeService.updateStore(
        { _id: "vendor1", role: "vendor" },
        "nonexistent",
        { name: "X" },
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test("throws 403 when a different vendor tries to update someone else's store", async () => {
    const save = jest.fn();
    mockStoreFindById.mockResolvedValueOnce({
      _id: "store1",
      owner: "vendor_A",
      save,
    });

    await expect(
      storeService.updateStore({ _id: "vendor_B", role: "vendor" }, "store1", {
        name: "Hijacked",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(save).not.toHaveBeenCalled();
  });

  test("allows the owning vendor to update their own store", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const storeDoc = {
      _id: "store1",
      owner: "vendor_A",
      name: "Old Name",
      save,
    };
    mockStoreFindById.mockResolvedValueOnce(storeDoc);

    const updated = await storeService.updateStore(
      { _id: "vendor_A", role: "vendor" },
      "store1",
      { name: "New Name" },
    );

    expect(updated.name).toBe("New Name");
    expect(save).toHaveBeenCalledTimes(1);
  });

  test("allows a superadmin to update any store regardless of ownership", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    mockStoreFindById.mockResolvedValueOnce({
      _id: "store1",
      owner: "vendor_A",
      name: "Old",
      save,
    });

    const updated = await storeService.updateStore(
      { _id: "admin1", role: "superadmin" },
      "store1",
      { name: "Moderated Name" },
    );

    expect(updated.name).toBe("Moderated Name");
  });
});
