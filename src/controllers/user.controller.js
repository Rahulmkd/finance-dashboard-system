import User from "../models/user.model.js";

// ─── GET ALL USERS ───────────────────────────────────────
// GET /api/users?role=viewer&isActive=true&page=1&limit=10
// Access: Admin only
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (role) filter.role = role;

    // query param comes as string — convert to boolean
    if (isActive !== undefined) {
      filter.isActive = isActive == "true";
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      total,
      page: pageNum,
      totalPage: Math.ceil(total / limitNum),
      users,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET SINGLE USER ─────────────────────────────────────
// GET /api/users/:id
// Access: Admin only
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

// ─── CREATE USER ─────────────────────────────────────────
// POST /api/users
// Access: Admin only
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE USER ─────────────────────────────────────────
// PATCH /api/users/:id
// Access: Admin only (cannot target self — blockSelfAction)
export const updateUser = async (req, res, next) => {
  try {
    const allowedFields = ["name", "role", "isActive"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided for update" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (err) {
    next(err);
  }
};

// ─── DEACTIVATE USER (soft delete) ───────────────────────
// DELETE /api/users/:id
// Access: Admin only (cannot target self)
export const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: `User ${user.name} has been deactivated` });
  } catch (err) {
    next(err);
  }
};

// ─── CHANGE OWN PASSWORD ─────────────────────────────────
// PATCH /api/auth/change-password
// Access: Any authenticated user (for themselves only)
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Both currentPassword and newPassword are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};
