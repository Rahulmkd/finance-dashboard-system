import { body, validationResult } from "express-validator";

// Middleware to check validation results
export const validate = (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({
      message: "validation failed",
      error: error.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

// Validation rules for creating/updating a transaction
export const transactionRules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),

  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number"),

  body("type")
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["income", "expense"])
    .withMessage("Type must be income or expense"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn([
      "salary",
      "freelance",
      "investment",
      "food",
      "transport",
      "utilities",
      "health",
      "entertainment",
      "education",
      "other",
    ])
    .withMessage("Invalid category"),

  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date"),

  body("notes")
    .optional()
    .isLength({ max: 300 })
    .withMessage("Notes cannot exceed 300 characters"),
];

// Lighter rules for partial update (PATCH)
export const transactionUpdateRules = [
  body("title")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),

  body("amount")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number"),

  body("type")
    .optional()
    .isIn(["income", "expense"])
    .withMessage("Type must be income or expense"),

  body("category")
    .optional()
    .isIn([
      "salary",
      "freelance",
      "investment",
      "food",
      "transport",
      "utilities",
      "health",
      "entertainment",
      "education",
      "other",
    ])
    .withMessage("Invalid category"),

  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date"),

  body("notes")
    .optional()
    .isLength({ max: 300 })
    .withMessage("Notes cannot exceed 300 characters"),
];
