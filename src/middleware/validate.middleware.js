import { body, param, validationResult } from "express-validator";

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((e) => ({
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

// Validation rules for registering a user (Admin creating users)
export const createUserRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 60 })
    .withMessage("Name cannot exceed 60 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("role")
    .optional()
    .isIn(["viewer", "analyst", "admin"])
    .withMessage("Role must be viewer, analyst, or admin"),
];

// Validation rules for updating a user
export const updateUserRules = [
  body("name")
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage("Name cannot exceed 60 characters"),

  body("role")
    .optional()
    .isIn(["viewer", "analyst", "admin"])
    .withMessage("Role must be viewer, analyst, or admin"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),

  body("email").not().exists().withMessage("Email cannot be updated"),

  body("password")
    .not()
    .exists()
    .withMessage("Use /api/auth/change-password to update password"),
];

// Validate MongoDB ObjectId in params
export const objectIdRule = (paramName) => [
  param(paramName).isMongoId().withMessage(`${paramName} must be a valid ID`),
];
