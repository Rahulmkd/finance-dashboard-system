import express from "express";
import { register, login, getMe } from "../controllers/auth.controller.js";
import { changePassword } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/rbac.middleware.js";
import { CAN_ANALYZE, CAN_MANAGE } from "../constants/roles.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", protect, getMe); 

router.patch("/change-password", protect, changePassword);

// RBAC test routes
router.get("/admin-only", protect, authorize(...CAN_MANAGE), (req, res) => {
  res.json({ message: `Welcome Admin ${req.user.name}` });
});
router.get("/analyst-up", protect, authorize(...CAN_ANALYZE), (req, res) => {
  res.json({ message: `Welcome ${req.user.role} ${req.user.name}` });
});

export default router;
