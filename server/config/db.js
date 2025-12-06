import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("✓ Database Connected Successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("✗ Database Connection Error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠ Database Disconnected");
    });

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
  } catch (error) {
    console.error("✗ Failed to connect to MongoDB:", error.message);
    console.error("\n💡 Troubleshooting tips:");
    console.error("   1. Check if your IP is whitelisted in MongoDB Atlas");
    console.error("   2. Verify your MongoDB credentials are correct");
    console.error("   3. Ensure your MongoDB cluster is running (not paused)");
    console.error("   4. Check your internet connection\n");
    throw error;
  }
};

export default connectDB;
