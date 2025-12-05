/**
 * Debug Script - Check User Roles
 * Lists all users and their roles to debug the count issue
 *
 * Run with: node scripts/debugUsers.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

// User schema
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
  },
  { timestamps: true }
);

const User = mongoose.model("user", userSchema);

async function debugUsers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    console.log("Connecting to MongoDB...");
    console.log(`Connection URI: ${mongoUri}`);
    
    await mongoose.connect(mongoUri, { dbName: "mern-auth" });

    console.log("Connected successfully!");

    // Get total count
    const totalCount = await User.countDocuments();
    console.log(`\nTotal Users: ${totalCount}`);

    // Get all users with their roles
    const users = await User.find({}).select("name email role").lean();
    console.log("\nAll Users:");
    users.forEach((u) => {
      console.log(
        `  - ${u.name} (${u.email}): role="${u.role || "UNDEFINED"}"`
      );
    });

    // Count by role
    const roleCounts = {};
    users.forEach((u) => {
      const role = u.role || "UNDEFINED";
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    console.log("\nCount by Role (from manual loop):");
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`  - ${role}: ${count}`);
    });

    const totalByRole = Object.values(roleCounts).reduce((a, b) => a + b, 0);
    console.log(`\nTotal from role counts: ${totalByRole}`);
    console.log(`Match: ${totalCount === totalByRole ? "✓ YES" : "✗ NO (MISMATCH!)"}`);

    // Aggregate test
    console.log("\nAggregation Test (with $ifNull):");
    const aggregated = await User.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$role", "member"] },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log("Aggregation Results:");
    aggregated.forEach((item) => {
      console.log(`  - ${item._id}: ${item.count}`);
    });

    const aggregateTotal = aggregated.reduce((sum, item) => sum + item.count, 0);
    console.log(`Total from aggregation: ${aggregateTotal}`);
    console.log(`Match with total: ${totalCount === aggregateTotal ? "✓ YES" : "✗ NO (MISMATCH!)"}`);

    // Count individual roles directly
    console.log("\nDirect counts by role:");
    const adminCount = await User.countDocuments({ role: "admin" });
    const managerCount = await User.countDocuments({ role: "manager" });
    const memberCount = await User.countDocuments({ role: "member" });
    const nullRoleCount = await User.countDocuments({ role: null });
    const undefinedRoleCount = await User.countDocuments({ role: undefined });

    console.log(`  - admin: ${adminCount}`);
    console.log(`  - manager: ${managerCount}`);
    console.log(`  - member: ${memberCount}`);
    console.log(`  - null role: ${nullRoleCount}`);
    console.log(`  - undefined role: ${undefinedRoleCount}`);
    console.log(`  - Total: ${adminCount + managerCount + memberCount + nullRoleCount + undefinedRoleCount}`);

    await mongoose.connection.close();
    console.log("\nDone!");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

debugUsers();
