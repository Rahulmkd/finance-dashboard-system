import express from "express";
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transaction.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/rbac.middleware.js";
import {
  validate,
  transactionRules,
  transactionUpdateRules,
} from "../middleware/validate.middleware.js";
import { CAN_VIEW, CAN_MANAGE } from "../constants/roles.js";

const router = express.Router();

// All transaction routes require authentication
router.use(protect);

router.get("/", authorize(...CAN_VIEW), getTransactions);
router.get("/:id", authorize(...CAN_VIEW), getTransactionById);

router.post(
  "/",
  authorize(...CAN_MANAGE),
  transactionRules,
  validate,
  createTransaction,
);
router.patch(
  "/:id",
  authorize(...CAN_MANAGE),
  transactionUpdateRules,
  validate,
  updateTransaction,
);
router.delete("/:id", authorize(...CAN_MANAGE), deleteTransaction);

export default router;
