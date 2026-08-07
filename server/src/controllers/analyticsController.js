import { asyncHandler } from "../middleware/errorHandler.js";
import * as analyticsService from "../services/analytics.service.js";

export const getVendorAnalytics = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getVendorAnalytics(req.user);
  res.json({ analytics });
});

export const getSuperAdminAnalytics = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getSuperAdminAnalytics();
  res.json({ analytics });
});
