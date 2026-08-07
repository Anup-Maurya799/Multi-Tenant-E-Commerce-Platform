import { jest, describe, test, expect, beforeEach } from "@jest/globals";

const mockOrderAggregate = jest.fn();
const mockStoreCountDocuments = jest.fn();
const mockUserCountDocuments = jest.fn();

jest.unstable_mockModule("../../src/models/Order.js", () => ({
  default: { aggregate: mockOrderAggregate },
}));
jest.unstable_mockModule("../../src/models/Store.js", () => ({
  default: { countDocuments: mockStoreCountDocuments },
}));
jest.unstable_mockModule("../../src/models/User.js", () => ({
  default: { countDocuments: mockUserCountDocuments },
}));

const analyticsService =
  await import("../../src/services/analytics.service.js");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getVendorAnalytics", () => {
  test("throws 400 if the vendor has no store yet", async () => {
    await expect(
      analyticsService.getVendorAnalytics({ storeId: null }),
    ).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(mockOrderAggregate).not.toHaveBeenCalled();
  });

  test("returns zeroed defaults when there are no paid orders at all", async () => {
    mockOrderAggregate
      .mockResolvedValueOnce([]) // summary
      .mockResolvedValueOnce([]) // revenueByDay
      .mockResolvedValueOnce([]); // topProducts

    const result = await analyticsService.getVendorAnalytics({
      storeId: "507f1f77bcf86cd799439011",
    });

    expect(result.totalRevenue).toBe(0);
    expect(result.orderCount).toBe(0);
    expect(result.topProducts).toEqual([]);
  });

  test("backfills revenueByDay to a continuous 30-day series with $0 on days with no orders", async () => {
    mockOrderAggregate
      .mockResolvedValueOnce([{ totalRevenue: 150, orderCount: 3 }])
      .mockResolvedValueOnce([
        { _id: new Date().toISOString().slice(0, 10), revenue: 50 },
      ])
      .mockResolvedValueOnce([]);

    const result = await analyticsService.getVendorAnalytics({
      storeId: "507f1f77bcf86cd799439011",
    });

    expect(result.revenueByDay).toHaveLength(30);
    const todayEntry = result.revenueByDay[result.revenueByDay.length - 1];
    expect(todayEntry.revenue).toBe(50);
    const zeroDays = result.revenueByDay.filter((d) => d.revenue === 0);
    expect(zeroDays.length).toBe(29);
  });

  test("maps topProducts aggregation output to a clean shape", async () => {
    mockOrderAggregate
      .mockResolvedValueOnce([{ totalRevenue: 100, orderCount: 2 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { _id: "Lavender Candle", unitsSold: 12, revenue: 240 },
      ]);

    const result = await analyticsService.getVendorAnalytics({
      storeId: "507f1f77bcf86cd799439011",
    });

    expect(result.topProducts).toEqual([
      { name: "Lavender Candle", unitsSold: 12, revenue: 240 },
    ]);
  });

  test("passes the vendor's own storeId into the $match stage, not an arbitrary one", async () => {
    mockOrderAggregate.mockResolvedValue([]);
    const storeId = "507f1f77bcf86cd799439099";

    await analyticsService.getVendorAnalytics({ storeId });

    const firstCallPipeline = mockOrderAggregate.mock.calls[0][0];
    const matchStage = firstCallPipeline.find((stage) => stage.$match);
    expect(matchStage.$match.storeId.toString()).toBe(storeId);
  });
});

describe("getSuperAdminAnalytics", () => {
  test("aggregates platform-wide with no store filter, and includes counts", async () => {
    mockOrderAggregate
      .mockResolvedValueOnce([{ totalRevenue: 5000, orderCount: 40 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          _id: "store1",
          revenue: 3000,
          orderCount: 20,
          store: { name: "Top Shop" },
        },
      ]);

    mockStoreCountDocuments.mockResolvedValueOnce(12);
    mockUserCountDocuments.mockResolvedValueOnce(8).mockResolvedValueOnce(150);

    const result = await analyticsService.getSuperAdminAnalytics();

    expect(result.totalRevenue).toBe(5000);
    expect(result.storeCount).toBe(12);
    expect(result.vendorCount).toBe(8);
    expect(result.customerCount).toBe(150);
    expect(result.topStores[0].storeName).toBe("Top Shop");

    const summaryPipeline = mockOrderAggregate.mock.calls[0][0];
    const matchStage = summaryPipeline.find((stage) => stage.$match);
    expect(matchStage.$match.storeId).toBeUndefined();
  });

  test("labels a deleted store gracefully instead of crashing the $lookup join", async () => {
    mockOrderAggregate
      .mockResolvedValueOnce([{ totalRevenue: 100, orderCount: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { _id: "orphan_store", revenue: 100, orderCount: 1, store: undefined },
      ]);
    mockStoreCountDocuments.mockResolvedValueOnce(0);
    mockUserCountDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const result = await analyticsService.getSuperAdminAnalytics();
    expect(result.topStores[0].storeName).toBe("Deleted store");
  });
});
