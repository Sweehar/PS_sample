import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import transporter from "../config/nodemailer.js";

export const getUserData = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not Found!" });
    }
    res.json({
      success: true,
      userData: {
        _id: user._id,
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAccountVerified: user.isAccountVerified,
        notifications: user.notifications,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get all users - Only accessible by admins
export const getAllUsers = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await userModel.findById(userId);

    // Check if user is an admin
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can view all users.",
      });
    }

    const users = await userModel
      .find({})
      .select(
        "-password -verifyOtp -resetOtp -verifyOtpExpireAt -resetOtpExpireAt"
      )
      .sort({ createdAt: -1 });

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters",
      });
    }

    const user = await userModel
      .findByIdAndUpdate(userId, { name: name.trim() }, { new: true })
      .select(
        "-password -verifyOtp -resetOtp -verifyOtpExpireAt -resetOtpExpireAt"
      );

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAccountVerified: user.isAccountVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Both passwords are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 8);
    await userModel.findByIdAndUpdate(userId, { password: hashedPassword });

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update notification preferences
export const updateNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { notifications } = req.body;

    await userModel.findByIdAndUpdate(userId, { notifications });

    res.json({ success: true, message: "Notification preferences updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Invite user (send invitation email) - Only accessible by admins
export const inviteUser = async (req, res) => {
  try {
    const { email, role } = req.body;
    const requestingUserId = req.userId;

    // Check if requesting user is an admin
    const requestingUser = await userModel.findById(requestingUserId);
    if (!requestingUser || requestingUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can invite users.",
      });
    }

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // Send invitation email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Invitation to Join AI CRM Feedback",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">You're Invited! 🎉</h2>
          <p>You've been invited to join AI CRM Feedback as a <strong>${
            role || "member"
          }</strong>.</p>
          <p>Click the button below to create your account:</p>
          <a href="${
            process.env.CLIENT_URL
          }/register?invited=true&email=${encodeURIComponent(
        email
      )}&role=${role}" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            Create Account
          </a>
          <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Invitation sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user role - Only accessible by admins
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const requestingUserId = req.userId;

    // Check if requesting user is an admin
    const requestingUser = await userModel.findById(requestingUserId);
    if (!requestingUser || requestingUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can change user roles.",
      });
    }

    // Can't change own role
    if (userId === requestingUserId) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot change your own role" });
    }

    if (!["admin", "manager", "member"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    await userModel.findByIdAndUpdate(userId, { role });

    res.json({ success: true, message: "Role updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Heartbeat - Update user's online status and last active time
 * POST /api/user/heartbeat
 */
export const heartbeat = async (req, res) => {
  try {
    const userId = req.userId;

    await userModel.findByIdAndUpdate(userId, {
      lastActive: new Date(),
      isOnline: true,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Submit or update user rating
 * POST /api/user/rating
 */
export const submitRating = async (req, res) => {
  try {
    const userId = req.userId;
    const { rating, message } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user's rating
    user.platformRating = {
      rating: rating,
      message: message?.trim() || "",
      createdAt: user.platformRating?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    await user.save();

    res.json({
      success: true,
      message: "Rating submitted successfully",
      rating: user.platformRating,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get user's own rating
 * GET /api/user/rating
 */
export const getMyRating = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await userModel.findById(userId).select("platformRating");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      rating: user.platformRating || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
