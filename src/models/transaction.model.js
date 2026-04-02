import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    type: {
      type: String,
      enum: {
        values: ["income", "expense"],
        message: "Type must be either income or expense",
      },
      required: [true, "Type is required"],
    },

    category: {
      type: String,
      enum: {
        values: [
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
        ],
        message: "{VALUE} is not valid category",
      },
      required: [true, "Category is required"],
    },
    date: {
      type: Date,
      default: Date.now,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [300, "Notes cannot exceed 300 characters"],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false, // soft delete
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster filtering queries
transactionSchema.index({ type: 1, category: 1, date: -1 });
transactionSchema.index({ createdBy: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
