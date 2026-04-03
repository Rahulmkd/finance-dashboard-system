import express from "express";
import {
  getSummary,
  getByCategory,
  getMonthlyTrends,
  getRecentTransactions,
} from "../controllers/dashboard.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/rbac.middleware.js";
import { CAN_VIEW, CAN_ANALYZE } from "../constants/roles.js";

const router = express.Router();

router.use(protect); // all dashboard routes require auth

// All roles can see summary and recent activity
router.get("/summary", authorize(...CAN_VIEW), getSummary);
router.get("/recent", authorize(...CAN_VIEW), getRecentTransactions);

// Only analyst and admin can access deep analytics
router.get("/by-category", authorize(...CAN_ANALYZE), getByCategory);
router.get("/trends", authorize(...CAN_ANALYZE), getMonthlyTrends);

export default router;
