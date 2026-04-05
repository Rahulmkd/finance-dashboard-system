import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },

    role: {
      type: String,
      enum: ["viewer", "analyst", "admin"],
      default: "viewer",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// ─── HASH PASSWORD ─────────────────────────────────────────
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 12);
  } catch (err) {
    next(err);
  }
});

// ─── COMPARE PASSWORD ──────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
