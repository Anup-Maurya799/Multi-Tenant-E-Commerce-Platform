import mongoose from "mongoose";
import Order from "../models/Order.js";
import Store from "../models/Store.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

const DAYS_OF_HISTORY = 30;

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Revenue-by-day is computed with $dateToString so days with zero paid
 * orders simply don't appear in the aggregation result — we backfill those
 * as $0 afterward so the chart always shows a continuous 30-day line
 * instead of gaps.
 */
function fillMissingDays(revenueByDay) {
  const map = new Map(revenueByDay.map((d) => [d._id, d.revenue]));
  const filled = [];
  for (let i = DAYS_OF_HISTORY - 1; i >= 0; i--) {
    const date = daysAgo(i);
    const key = date.toISOString().slice(0, 10);
    filled.push({ date: key, revenue: map.get(key) || 0 });
  }
  return filled;
}

/**
 * Vendor analytics — scoped strictly to the requesting vendor's own store.
 * Every aggregation below filters on storeId first, which is what keeps
 * one vendor from ever seeing another's revenue numbers.
 */
export async function getVendorAnalytics(vendorUser) {
  if (!vendorUser.storeId) {
    throw new ApiError(400, "You don't have a store yet.");
  }

  const storeId = new mongoose.Types.ObjectId(vendorUser.storeId);
  const since = daysAgo(DAYS_OF_HISTORY - 1);

  const [summary] = await Order.aggregate([
    { $match: { storeId, status: "paid" } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        orderCount: { $sum: 1 },
      },
    },
  ]);

  const revenueByDayRaw = await Order.aggregate([
    { $match: { storeId, status: "paid", createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const topProducts = await Order.aggregate([
    { $match: { storeId, status: "paid" } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        unitsSold: { $sum: "$items.quantity" },
        revenue: {
          $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] },
        },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);

  return {
    totalRevenue: summary?.totalRevenue || 0,
    orderCount: summary?.orderCount || 0,
    revenueByDay: fillMissingDays(revenueByDayRaw),
    topProducts: topProducts.map((p) => ({
      name: p._id,
      unitsSold: p.unitsSold,
      revenue: p.revenue,
    })),
  };
}

/**
 * Super Admin analytics — platform-wide, across every store. No storeId
 * filter here on purpose: this is the one role allowed to see everything.
 */
export async function getSuperAdminAnalytics() {
  const since = daysAgo(DAYS_OF_HISTORY - 1);

  const [summary] = await Order.aggregate([
    { $match: { status: "paid" } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        orderCount: { $sum: 1 },
      },
    },
  ]);

  const revenueByDayRaw = await Order.aggregate([
    { $match: { status: "paid", createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const topStores = await Order.aggregate([
    { $match: { status: "paid" } },
    {
      $group: {
        _id: "$storeId",
        revenue: { $sum: "$totalAmount" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "stores",
        localField: "_id",
        foreignField: "_id",
        as: "store",
      },
    },
    { $unwind: { path: "$store", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        storeName: { $ifNull: ["$store.name", "Deleted store"] },
        revenue: 1,
        orderCount: 1,
      },
    },
  ]);

  const [storeCount, vendorCount, customerCount] = await Promise.all([
    Store.countDocuments({}),
    User.countDocuments({ role: "vendor" }),
    User.countDocuments({ role: "customer" }),
  ]);

  return {
    totalRevenue: summary?.totalRevenue || 0,
    orderCount: summary?.orderCount || 0,
    revenueByDay: fillMissingDays(revenueByDayRaw),
    topStores: topStores.map((s) => ({
      storeName: s.storeName,
      revenue: s.revenue,
      orderCount: s.orderCount,
    })),
    storeCount,
    vendorCount,
    customerCount,
  };
}
