// authorize is a higher-order function that returns a middleware
// Usage: authorize('admin') or authorize('analyst', 'admin')

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
   
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const hasPermission = allowedRoles.includes(req.user.role);

    if (!hasPermission) {
      return res.status(403).json({
        message: `Access denied. Required role: [${allowedRoles.join(",")}]. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};
