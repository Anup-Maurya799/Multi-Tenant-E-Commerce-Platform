import { jest, describe, test, expect, beforeEach } from "@jest/globals";

const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockFind = jest.fn();
const mockCountDocuments = jest.fn();

jest.unstable_mockModule("../../src/models/Product.js", () => ({
  default: {
    findById: mockFindById,
    create: mockCreate,
    find: mockFind,
    countDocuments: mockCountDocuments,
  },
}));

const mockUploadBuffer = jest.fn();
const mockDeleteFromCloudinary = jest.fn().mockResolvedValue(undefined);
jest.unstable_mockModule("../../src/utils/cloudinaryUpload.js", () => ({
  uploadBufferToCloudinary: mockUploadBuffer,
  deleteFromCloudinary: mockDeleteFromCloudinary,
}));

const productService = await import("../../src/services/product.service.js");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createProduct", () => {
  test("throws 400 if the vendor has no store yet", async () => {
    const vendorUser = { storeId: null };
    await expect(
      productService.createProduct(vendorUser, { name: "Widget", price: 10 }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("stamps the product with the vendor's storeId, ignoring any storeId in the payload", async () => {
    const vendorUser = { storeId: "real_store_1" };
    mockCreate.mockImplementationOnce((doc) =>
      Promise.resolve({ _id: "p1", ...doc }),
    );

    const product = await productService.createProduct(vendorUser, {
      name: "Widget",
      price: 10,
      storeId: "attacker_supplied_store_id", // should be ignored/overwritten
    });

    // storeId came from the authenticated vendor, not the request body
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: "real_store_1" }),
    );
    expect(product.storeId).toBe("real_store_1");
  });
});

describe("tenant isolation on updateProduct", () => {
  test("throws 403 when a vendor tries to edit another store's product", async () => {
    mockFindById.mockResolvedValueOnce({
      _id: "prod1",
      storeId: { toString: () => "store_A" },
    });

    await expect(
      productService.updateProduct(
        { _id: "vendorB", role: "vendor", storeId: "store_B" },
        "prod1",
        { name: "Hacked" },
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test("allows the owning vendor to edit their own product", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    mockFindById.mockResolvedValueOnce({
      _id: "prod1",
      storeId: { toString: () => "store_A" },
      name: "Old Name",
      save,
    });

    const updated = await productService.updateProduct(
      { _id: "vendorA", role: "vendor", storeId: "store_A" },
      "prod1",
      { name: "New Name" },
    );

    expect(updated.name).toBe("New Name");
    expect(save).toHaveBeenCalledTimes(1);
  });

  test("superadmin can edit any store's product", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    mockFindById.mockResolvedValueOnce({
      _id: "prod1",
      storeId: { toString: () => "store_A" },
      name: "Old",
      save,
    });

    const updated = await productService.updateProduct(
      { _id: "admin1", role: "superadmin", storeId: undefined },
      "prod1",
      { name: "Moderated" },
    );

    expect(updated.name).toBe("Moderated");
  });
});

describe("deleteProduct", () => {
  test("throws 403 for a non-owning vendor and does not delete anything", async () => {
    const deleteOne = jest.fn();
    mockFindById.mockResolvedValueOnce({
      _id: "prod1",
      storeId: { toString: () => "store_A" },
      images: [],
      deleteOne,
    });

    await expect(
      productService.deleteProduct(
        { _id: "vendorB", role: "vendor", storeId: "store_B" },
        "prod1",
      ),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(deleteOne).not.toHaveBeenCalled();
  });

  test("cleans up every Cloudinary image before deleting the product record", async () => {
    const deleteOne = jest.fn().mockResolvedValue(undefined);
    mockFindById.mockResolvedValueOnce({
      _id: "prod1",
      storeId: { toString: () => "store_A" },
      images: [{ publicId: "img_1" }, { publicId: "img_2" }],
      deleteOne,
    });

    await productService.deleteProduct(
      { _id: "vendorA", role: "vendor", storeId: "store_A" },
      "prod1",
    );

    expect(mockDeleteFromCloudinary).toHaveBeenCalledWith("img_1");
    expect(mockDeleteFromCloudinary).toHaveBeenCalledWith("img_2");
    expect(mockDeleteFromCloudinary).toHaveBeenCalledTimes(2);
    expect(deleteOne).toHaveBeenCalledTimes(1);
  });
});

describe("addProductImages", () => {
  test("throws 400 if no files were provided", async () => {
    await expect(
      productService.addProductImages({ storeId: "store_A" }, "prod1", []),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("throws 400 when the total would exceed 8 images", async () => {
    mockFindById.mockResolvedValueOnce({
      _id: "prod1",
      storeId: { toString: () => "store_A" },
      images: new Array(6).fill({ url: "x", publicId: "x" }),
    });

    const files = new Array(3).fill({ buffer: Buffer.from("fake") });

    await expect(
      productService.addProductImages(
        { _id: "v1", role: "vendor", storeId: "store_A" },
        "prod1",
        files,
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("uploads each file and appends results to the product's images", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const productDoc = {
      _id: "prod1",
      storeId: { toString: () => "store_A" },
      images: [],
      save,
    };
    mockFindById.mockResolvedValueOnce(productDoc);
    mockUploadBuffer
      .mockResolvedValueOnce({ url: "https://cdn/1.jpg", publicId: "pub1" })
      .mockResolvedValueOnce({ url: "https://cdn/2.jpg", publicId: "pub2" });

    const files = [{ buffer: Buffer.from("a") }, { buffer: Buffer.from("b") }];
    const updated = await productService.addProductImages(
      { _id: "v1", role: "vendor", storeId: "store_A" },
      "prod1",
      files,
    );

    expect(updated.images).toHaveLength(2);
    expect(updated.images[0].publicId).toBe("pub1");
    expect(save).toHaveBeenCalledTimes(1);
  });
});
