import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import {
  getAdminStats,
  getAllUsersAdmin,
  getAllFeedbackAdmin,
  deleteUser,
  updateUserRoleAdmin,
  getSystemHealth,
  controlDockerMonitoring,
  getUserRatings,
} from "../controllers/adminController.js";

const adminRouter = express.Router();

// All routes require admin authentication
adminRouter.use(adminAuth);

// Dashboard stats
adminRouter.get("/stats", getAdminStats);

// User management
adminRouter.get("/users", getAllUsersAdmin);
adminRouter.delete("/users/:userId", deleteUser);
adminRouter.put("/users/:userId/role", updateUserRoleAdmin);

// Feedback management
adminRouter.get("/feedback", getAllFeedbackAdmin);

// User ratings
adminRouter.get("/user-ratings", getUserRatings);

// System health
adminRouter.get("/health", getSystemHealth);

// Docker monitoring control
adminRouter.post("/docker/:action", controlDockerMonitoring);

export default adminRouter;
