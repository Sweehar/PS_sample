import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "manager", "member"],
      default: "member",
    },
    verifyOtp: { type: String, default: "" },
    verifyOtpExpireAt: { type: Number, default: 0 },
    isAccountVerified: { type: Boolean, default: false },
    resetOtp: { type: String, default: "" },
    resetOtpExpireAt: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      feedbackAlerts: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
      marketingEmails: { type: Boolean, default: false },
    },
    platformRating: {
      rating: { type: Number, min: 1, max: 5 },
      message: { type: String, default: "" },
      createdAt: { type: Date },
      updatedAt: { type: Date },
    },
  },
  { timestamps: true }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
