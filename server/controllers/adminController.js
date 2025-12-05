import userModel from "../models/userModel.js";
import { MongoClient } from "mongodb";

// MongoDB connection for feedback stats
let mongoClient = null;
let feedbackDb = null;

async function getMongoDb() {
  if (!feedbackDb) {
    mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();
    feedbackDb = mongoClient.db(process.env.MONGO_DB || "feedback_pipeline");
  }
  return feedbackDb;
}

// Mark users offline if no heartbeat in 2 minutes
const OFFLINE_THRESHOLD_MS = 2 * 60 * 1000;

async function updateOfflineUsers() {
  const threshold = new Date(Date.now() - OFFLINE_THRESHOLD_MS);
  await userModel.updateMany(
    { isOnline: true, lastActive: { $lt: threshold } },
    { isOnline: false }
  );
}

/**
 * Get admin dashboard overview stats
 * GET /api/admin/stats
 */
export const getAdminStats = async (req, res) => {
  try {
    // First, mark inactive users as offline
    await updateOfflineUsers();

    // Get user statistics
    const [
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      onlineUsers,
      usersByRole,
    ] = await Promise.all([
      userModel.countDocuments({}),
      userModel.countDocuments({ isAccountVerified: true }),
      userModel.countDocuments({ isAccountVerified: false }),
      userModel.countDocuments({ isOnline: true }),
      userModel.aggregate([
        { 
          $group: { 
            _id: { $ifNull: ["$role", "member"] }, 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { _id: 1 } }
      ]),
    ]);

    // Verify the counts add up correctly
    const roleCountTotal = usersByRole.reduce((sum, item) => sum + item.count, 0);
    console.log(`User count verification: Total=${totalUsers}, By Role Sum=${roleCountTotal}`, usersByRole);
    
    // Debug: Get individual user roles to find discrepancies
    if (totalUsers !== roleCountTotal) {
      const userRoles = await userModel.find({}).select('name email role').lean();
      console.log('All user roles:', userRoles);
    }

    // Get recent users
    const recentUsers = await userModel
      .find({})
      .select("-password -verifyOtp -resetOtp")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get feedback statistics
    let feedbackStats = {
      total: 0,
      bySentiment: {},
      avgConfidence: 0,
      topIntents: [],
      growth: {},
    };
    try {
      const db = await getMongoDb();

      // Get total feedback from feedback_results collection
      const totalFeedback = await db
        .collection("feedback_results")
        .countDocuments({});

      // Get sentiment breakdown
      const sentimentBreakdown = await db
        .collection("feedback_results")
        .aggregate([{ $group: { _id: "$sentiment", count: { $sum: 1 } } }])
        .toArray();

      // Get average confidence
      const avgConfidenceResult = await db
        .collection("feedback_results")
        .aggregate([
          { $group: { _id: null, avgConfidence: { $avg: "$confidence" } } },
        ])
        .toArray();

      // Get top intents
      const topIntents = await db
        .collection("feedback_results")
        .aggregate([
          { $unwind: "$intents" },
          { $group: { _id: "$intents", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ])
        .toArray();

      // Calculate growth metrics (this week vs last week)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Count this week's feedback
      const thisWeekTotal = await db
        .collection("feedback_results")
        .countDocuments({
          processedAt: { $gte: sevenDaysAgo },
        });

      // Count last week's feedback
      const lastWeekTotal = await db
        .collection("feedback_results")
        .countDocuments({
          processedAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
        });

      // Calculate overall total growth
      const calculateGrowth = (thisWeek, lastWeek) => {
        if (lastWeek === 0) {
          return thisWeek > 0 ? 100 : 0;
        }
        return (((thisWeek - lastWeek) / lastWeek) * 100).toFixed(1);
      };

      feedbackStats = {
        total: totalFeedback,
        bySentiment: sentimentBreakdown.reduce((acc, item) => {
          if (item._id) acc[item._id] = item.count;
          return acc;
        }, {}),
        avgConfidence: avgConfidenceResult[0]?.avgConfidence || 0,
        topIntents,
        growth: {
          total: calculateGrowth(thisWeekTotal, lastWeekTotal),
          thisWeek: thisWeekTotal,
          lastWeek: lastWeekTotal,
        },
      };
    } catch (err) {
      console.log("Feedback DB not available:", err.message);
    }

    // User registration trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const registrationTrend = await userModel.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          unverified: unverifiedUsers,
          online: onlineUsers,
          byRole: usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {
            admin: 0,
            manager: 0,
            member: 0,
          }),
        },
        feedback: feedbackStats,
        registrationTrend,
        recentUsers: recentUsers.map((u) => ({
          _id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          isAccountVerified: u.isAccountVerified,
          isOnline: u.isOnline || false,
          lastActive: u.lastActive,
          createdAt: u.createdAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all users with detailed info (admin only)
 * GET /api/admin/users
 */
export const getAllUsersAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", role = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const [users, total] = await Promise.all([
      userModel
        .find(query)
        .select(
          "-password -verifyOtp -resetOtp -verifyOtpExpireAt -resetOtpExpireAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      userModel.countDocuments(query),
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all feedback across all users (admin only)
 * GET /api/admin/feedback
 *
 * Returns complete feedback data with user info, intents, and metrics
 */
export const getAllFeedbackAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, sentiment = "", userId = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const db = await getMongoDb();

    const query = {};
    if (sentiment) {
      query.sentiment = sentiment;
    }
    if (userId) {
      query.userId = userId;
    }

    const [results, total] = await Promise.all([
      db
        .collection("feedback_results")
        .find(query)
        .sort({ processedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      db.collection("feedback_results").countDocuments(query),
    ]);

    // Get user details for each feedback
    const userIds = [...new Set(results.map((r) => r.userId))];
    const users = await userModel
      .find({ _id: { $in: userIds } })
      .select("name email role isOnline lastActive")
      .lean();
    const userMap = users.reduce((acc, u) => {
      acc[u._id.toString()] = u;
      return acc;
    }, {});

    // Calculate intent statistics
    const intentStats = {};
    results.forEach((r) => {
      (r.intents || []).forEach((intent) => {
        intentStats[intent] = (intentStats[intent] || 0) + 1;
      });
    });

    res.json({
      success: true,
      feedback: results.map((r) => ({
        jobId: r.jobId,
        text: r.text,
        sentiment: r.sentiment,
        confidence: r.confidence,
        confidencePercent: `${((r.confidence || 0) * 100).toFixed(1)}%`,
        allScores: r.allScores || [],
        intents: r.intents || [],
        aiProcessed: r.aiProcessed || false,
        submittedAt: r.submittedAt,
        processedAt: r.processedAt,
        metadata: r.metadata || {},
        user: userMap[r.userId] || { name: "Unknown", email: "N/A" },
      })),
      intentStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a user (admin only)
 * DELETE /api/admin/users/:userId
 */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.userId;

    if (userId === adminId) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete yourself" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete another admin" });
    }

    await userModel.findByIdAndDelete(userId);

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update user role (admin only)
 * PUT /api/admin/users/:userId/role
 */
export const updateUserRoleAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const adminId = req.userId;

    if (userId === adminId) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot change your own role" });
    }

    if (!["admin", "manager", "member"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await userModel.findByIdAndUpdate(userId, { role });

    res.json({ success: true, message: "Role updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get system health status
 * GET /api/admin/health
 */
export const getSystemHealth = async (req, res) => {
  try {
    const health = {
      server: "healthy",
      database: "unknown",
      redis: "unknown",
      prometheus: false,
      grafana: false,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: Math.round(process.cpuUsage().user / 1000000), // Approximate CPU usage
      timestamp: new Date().toISOString(),
    };

    // Check MongoDB
    try {
      await userModel.findOne({}).lean();
      health.database = "healthy";
    } catch (err) {
      health.database = "unhealthy";
    }

    // Check Redis (if available)
    try {
      const { Queue } = await import("bullmq");
      const IORedis = (await import("ioredis")).default;
      const testConn = new IORedis({
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT) || 6379,
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });
      await testConn.ping();
      await testConn.quit();
      health.redis = "healthy";
    } catch (err) {
      health.redis = "unavailable";
    }

    // Check Prometheus (port 9090)
    try {
      const response = await fetch("http://localhost:9090/-/healthy", {
        signal: AbortSignal.timeout(2000),
      });
      health.prometheus = response.ok;
    } catch (err) {
      health.prometheus = false;
    }

    // Check Grafana (port 3001)
    try {
      const response = await fetch("http://localhost:3001/api/health", {
        signal: AbortSignal.timeout(2000),
      });
      health.grafana = response.ok;
    } catch (err) {
      health.grafana = false;
    }

    res.json({ success: true, health });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Start/Stop Docker monitoring services
 * POST /api/admin/docker/:action
 * action: start, stop, restart
 */
export const controlDockerMonitoring = async (req, res) => {
  const { action } = req.params;
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);
  const path = await import("path");

  const validActions = ["start", "stop", "restart"];
  if (!validActions.includes(action)) {
    return res.status(400).json({
      success: false,
      message: "Invalid action. Use: start, stop, or restart",
    });
  }

  try {
    // Get the path to monitoring folder
    const monitoringPath = path.resolve(process.cwd(), "..", "monitoring");

    let command;
    switch (action) {
      case "start":
        command = `docker-compose -f "${monitoringPath}/docker-compose.yml" up -d prometheus grafana`;
        break;
      case "stop":
        command = `docker-compose -f "${monitoringPath}/docker-compose.yml" stop prometheus grafana`;
        break;
      case "restart":
        command = `docker-compose -f "${monitoringPath}/docker-compose.yml" restart prometheus grafana`;
        break;
    }

    const { stdout, stderr } = await execAsync(command);

    res.json({
      success: true,
      message: `Docker monitoring services ${action}ed successfully`,
      output: stdout || stderr,
    });
  } catch (error) {
    const errorMessage = error.message || "";
    let userMessage = `Failed to ${action} monitoring services`;
    let details = error.message;

    // Provide helpful error messages for common issues
    if (
      errorMessage.includes("docker") ||
      errorMessage.includes("Cannot find") ||
      errorMessage.includes("not found")
    ) {
      userMessage = `Docker is not running or not found`;
      details =
        "Please start Docker Desktop before trying to control monitoring services. After starting Docker, try again.";
    } else if (errorMessage.includes("ENOENT")) {
      userMessage = `docker-compose not found`;
      details =
        "Please ensure Docker Desktop is installed with Docker Compose support.";
    } else if (errorMessage.includes("connect")) {
      userMessage = `Cannot connect to Docker daemon`;
      details =
        "Please start Docker Desktop and ensure it is running properly before trying to control monitoring services.";
    } else if (errorMessage.includes("image")) {
      userMessage = `Failed to pull Docker image`;
      details =
        "Check your internet connection and ensure Docker Desktop is running with internet access.";
    }

    console.error(`Docker ${action} error:`, error);

    res.status(500).json({
      success: false,
      message: userMessage,
      details: details,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get all user ratings (admin only)
 * GET /api/admin/user-ratings
 */
export const getUserRatings = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with ratings
    const usersWithRatings = await userModel
      .find({ "platformRating.rating": { $exists: true, $ne: null } })
      .select("name email role isAccountVerified platformRating createdAt")
      .sort({ "platformRating.updatedAt": -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalRatings = await userModel.countDocuments({
      "platformRating.rating": { $exists: true, $ne: null },
    });

    // Calculate stats
    const ratingStats = await userModel.aggregate([
      { $match: { "platformRating.rating": { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$platformRating.rating" },
          totalRatings: { $sum: 1 },
          rating5: {
            $sum: { $cond: [{ $eq: ["$platformRating.rating", 5] }, 1, 0] },
          },
          rating4: {
            $sum: { $cond: [{ $eq: ["$platformRating.rating", 4] }, 1, 0] },
          },
          rating3: {
            $sum: { $cond: [{ $eq: ["$platformRating.rating", 3] }, 1, 0] },
          },
          rating2: {
            $sum: { $cond: [{ $eq: ["$platformRating.rating", 2] }, 1, 0] },
          },
          rating1: {
            $sum: { $cond: [{ $eq: ["$platformRating.rating", 1] }, 1, 0] },
          },
        },
      },
    ]);

    const stats = ratingStats[0] || {
      averageRating: 0,
      totalRatings: 0,
      rating5: 0,
      rating4: 0,
      rating3: 0,
      rating2: 0,
      rating1: 0,
    };

    res.json({
      success: true,
      ratings: usersWithRatings,
      stats: {
        averageRating: stats.averageRating?.toFixed(1) || "0.0",
        totalRatings: stats.totalRatings,
        distribution: {
          5: stats.rating5,
          4: stats.rating4,
          3: stats.rating3,
          2: stats.rating2,
          1: stats.rating1,
        },
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRatings,
        pages: Math.ceil(totalRatings / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
