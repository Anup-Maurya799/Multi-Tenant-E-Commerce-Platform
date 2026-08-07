export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to do this." });
    }
    next();
  };
}

/**
 * Tenant-isolation gate — ensures a vendor can only act on resources that
 * belong to their own store. Compares req.user.storeId against the
 * storeId found on the resource (attached earlier in the route handler,
 * e.g. req.resourceStoreId = product.storeId).
 */
export function enforceTenantOwnership(req, res, next) {
  if (req.user.role === "superadmin") return next(); // admins bypass tenant scoping

  const resourceStoreId = req.resourceStoreId?.toString();
  const userStoreId = req.user.storeId?.toString();

  if (!resourceStoreId || !userStoreId || resourceStoreId !== userStoreId) {
    return res
      .status(403)
      .json({ message: "You cannot access another store's data." });
  }
  next();
}
