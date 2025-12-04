import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  submitFeedback,
  getFeedbackResult,
  getFeedbackHistory,
  getFeedbackStats,
  getRatingStats,
  getQueueHealth,
  clearFeedbackHistory,
} from "../controllers/feedbackController.js";

const feedbackRouter = express.Router();

// All routes require authentication
feedbackRouter.use(userAuth);

// Submit feedback for sentiment analysis
// POST /api/feedback/submit
// Body: { text: string, metadata?: object }
feedbackRouter.post("/submit", submitFeedback);

// Get analysis result by job ID
// GET /api/feedback/result/:jobId
feedbackRouter.get("/result/:jobId", getFeedbackResult);

// Get user's feedback history
// GET /api/feedback/history?page=1&limit=10
feedbackRouter.get("/history", getFeedbackHistory);

// Get user's sentiment statistics
// GET /api/feedback/stats
feedbackRouter.get("/stats", getFeedbackStats);

// Get user's rating statistics
// GET /api/feedback/rating-stats
feedbackRouter.get("/rating-stats", getRatingStats);

// Clear user's feedback history
// DELETE /api/feedback/clear
feedbackRouter.delete("/clear", clearFeedbackHistory);

// Get queue health status
// GET /api/feedback/health
feedbackRouter.get("/health", getQueueHealth);

export default feedbackRouter;
