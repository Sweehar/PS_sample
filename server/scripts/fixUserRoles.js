/**
 * Fix Script - Set undefined roles to "member"
 * Finds all users with undefined roles and sets them to "member"
 *
 * Run with: node scripts/fixUserRoles.js
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

async function fixUserRoles() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri, { dbName: "mern-auth" });

    // Find users with undefined/null roles
    const usersWithUndefinedRole = await User.find({
      $or: [{ role: null }, { role: undefined }, { role: { $exists: false } }],
    });

    console.log(`\nFound ${usersWithUndefinedRole.length} users with undefined roles:`);
    usersWithUndefinedRole.forEach((u) => {
      console.log(`  - ${u.name} (${u.email})`);
    });

    if (usersWithUndefinedRole.length === 0) {
      console.log("No users with undefined roles found!");
      await mongoose.connection.close();
      return;
    }

    // Fix the roles
    console.log("\nFixing roles to 'member'...");
    const result = await User.updateMany(
      { $or: [{ role: null }, { role: undefined }, { role: { $exists: false } }] },
      { $set: { role: "member" } }
    );

    console.log(`✓ Updated ${result.modifiedCount} users`);

    // Verify the fix
    console.log("\nVerifying fix...");
    const adminCount = await User.countDocuments({ role: "admin" });
    const managerCount = await User.countDocuments({ role: "manager" });
    const memberCount = await User.countDocuments({ role: "member" });
    const totalCount = await User.countDocuments();

    console.log(`Final counts:`);
    console.log(`  - admin: ${adminCount}`);
    console.log(`  - manager: ${managerCount}`);
    console.log(`  - member: ${memberCount}`);
    console.log(`  - Total: ${totalCount}`);

    const sum = adminCount + managerCount + memberCount;
    console.log(`\n✓ All users accounted for: ${sum === totalCount ? "YES" : "NO"}`);

    await mongoose.connection.close();
    console.log("\nDone!");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

fixUserRoles();
