import Transaction from "../models/transaction.model.js";

// ─── HELPER ──────────────────────────────────────────────
// Builds a reusable date filter from query params
const buildDateFilter = (startDate, endDate) => {
  const filter = { isDeleted: false };
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  return filter;
};

// ─── 1. OVERALL SUMMARY ──────────────────────────────────
// GET /api/dashboard/summary?startDate=&endDate=
// Access: Viewer, Analyst, Admin
export const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const matchFilter = buildDateFilter(startDate, endDate);

    const result = await Transaction.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$type", // group by "income" or "expense"
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
        },
      },
    ]);

    // Shape the result into a clean object
    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      incomeCount: 0,
      expenseCount: 0,
      avgIncome: 0,
      avgExpense: 0,
      netBalance: 0,
    };

    result.forEach((item) => {
      if (item._id === "income") {
        summary.totalIncome = item.total;
        summary.incomeCount = item.count;
        summary.avgIncome = parseFloat(item.avgAmount.toFixed(2));
      } else if (item._id === "expense") {
        summary.totalExpenses = item.total;
        summary.expenseCount = item.count;
        summary.avgExpense = parseFloat(item.avgAmount.toFixed(2));
      }
    });

    summary.netBalance = parseFloat(
      (summary.totalIncome - summary.totalExpenses).toFixed(2),
    );

    res.status(200).json({ summary });
  } catch (err) {
    next(err);
  }
};

// ─── 2. BREAKDOWN BY CATEGORY ────────────────────────────
// GET /api/dashboard/by-category?type=expense&startDate=&endDate=
// Access: Analyst, Admin
export const getByCategory = async (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;
    const matchFilter = buildDateFilter(startDate, endDate);

    // optionally filter by type
    if (type) {
      if (!["income", "expense"].includes(type)) {
        return res
          .status(400)
          .json({ message: "type must be income or expense" });
      }
      matchFilter.type = type;
    }

    const result = await Transaction.aggregate([
      { $match: matchFilter },

      {
        $group: {
          _id: {
            category: "$category",
            type: "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
          maxAmount: { $max: "$amount" },
          minAmount: { $min: "$amount" },
        },
      },

      {
        $project: {
          _id: 0,
          category: "$_id.category",
          type: "$_id.type",
          total: { $round: ["$total", 2] },
          count: 1,
          avgAmount: { $round: ["$avgAmount", 2] },
          maxAmount: 1,
          minAmount: 1,
        },
      },
      { $sort: { total: -1 } }, // highest total first
    ]);

    res.status(200).json({
      count: result.length,
      breakdown: result,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 3. MONTHLY TRENDS ───────────────────────────────────
// GET /api/dashboard/trends?year=2024
// Access: Analyst, Admin

export const getMonthlyTrends = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const result = await Transaction.aggregate([
      {
        $match: {
          isDeleted: false,
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.month",
          data: {
            $push: {
              type: "$_id.type",
              total: "$total",
              count: "$count",
            },
          },
        },
      },
      { $sort: { _id: 1 } }, // sort by month 1-12
    ]);

    // Shape into clean monthly array with all 12 months

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const trends = monthNames.map((month, idx) => {
      const monthNum = idx + 1;
      const found = result.find((r) => r._id === monthNum);
      const income = found?.data.find((d) => d.type === "income");
      const expense = found?.data.find((d) => d.type === "expense");

      return {
        month,
        monthNumber: monthNum,
        income: income?.total ?? 0,
        incomeCount: income?.count ?? 0,
        expenses: expense?.total ?? 0,
        expenseCount: expense?.count ?? 0,
        net: parseFloat(
          (income?.total ?? 0) - (expense?.total ?? 0).toFixed(2),
        ),
      };
    });
    // Overall year stats
    const yearSummary = trends.reduce(
      (acc, m) => {
        acc.totalIncome += m.income;
        acc.totalExpenses += m.expenses;
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0 },
    );

    yearSummary.netBalance = parseFloat(
      (yearSummary.totalIncome - yearSummary.totalExpenses).toFixed(2),
    );

    res.status(200).json({ year, yearSummary, trends });
  } catch (err) {
    next(err);
  }
};

// ─── 4. RECENT TRANSACTIONS ──────────────────────────────
// GET /api/dashboard/recent?limit=5
// Access: Viewer, Analyst, Admin
export const getRecentTransactions = async (req, res, next) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 5));

    const transactions = await Transaction.find({ isDeleted: false })
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      count: transactions.length,
      transactions,
    });
  } catch (err) {
    next(err);
  }
};
