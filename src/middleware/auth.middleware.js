import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Verifies JWT and attaches user to req
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provide" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    req.user = user; // attach to request
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ── NEW: Block admin from acting on themselves ──────────────
// Prevents self-deactivation or self-role-change
export const blockSelfAction = (req, res, next) => {
  if (req.user._id.toString() === req.params.id) {
    return res.status(403).json({
      message:
        "You cannot modify your own account via this endpoint. Use /api/auth/me",
    });
  }
  next();
};

// ── NEW: Ensure at least one active admin remains ───────────
export const guardLastAdmin = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return next(); // 404 handled in controller

    const isDowngrading =
      req.body.role && req.body.role !== "admin" && targetUser.role === "admin";
    const isDeactivating =
      req.body.isActive === false && targetUser.isActive === true;

    if (isDowngrading || isDeactivating) {
      const activeAdminCount = await User.countDocuments({
        role: "admin",
        isActive: true,
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          message:
            "Cannot perform this action. At least one active admin must remain.",
        });
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};
