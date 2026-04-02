import Transaction from "../models/transaction.model.js";

// ─── CREATE ──────────────────────────────────────────────
// POST /api/transactions
// Access: Admin only
export const createTransaction = async (req, res, next) => {
  try {
    const { title, amount, type, category, date, notes } = req.body;

    const transaction = await Transaction.create({
      title,
      amount,
      type,
      category,
      date: date || Date.now(),
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Transaction created successfully",
      transaction,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET ALL (with filtering + pagination) ───────────────
// GET /api/transactions
// Access: Viewer, Analyst, Admin
export const getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = "date",
      order = "desc",
    } = req.query;

    // Build filter object dynamically
    const filter = { isDeleted: false };

    if (type) filter.type = type;
    if (category) filter.category = category;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Pagination math
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // cap at 100
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === "asc" ? 1 : -1;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("createdBy", "name email role")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(filter),
    ]);
    res.status(200).json({
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      transactions,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET ONE ─────────────────────────────────────────────
// GET /api/transactions/:id
// Access: Viewer, Analyst, Admin
export const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate("createdBy", "name email role");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ transaction });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE ──────────────────────────────────────────────
// PATCH /api/transactions/:id
// Access: Admin only
export const updateTransaction = async (req, res, next) => {
  try {
    const allowedFields = [
      "title",
      "amount",
      "type",
      "category",
      "date",
      "notes",
    ];

    // Only pick allowed fields to prevent mass assignment
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided for update" });
    }

    const transaction = await Transaction.findOneAndUpdate(
      {
        _id: req.params.id,
        isDeleted: false,
      },

      updates,
      { new: true, runValidators: true },
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(200).json({
      message: "Transaction updated successfully",
      transaction,
    });
  } catch (err) {
    next(err);
  }
};

// ─── SOFT DELETE ─────────────────────────────────────────
// DELETE /api/transactions/:id
// Access: Admin only
export const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true },
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (err) {
    next(err);
  }
};
