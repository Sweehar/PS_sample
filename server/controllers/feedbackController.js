import { Queue } from "bullmq";
import IORedis from "ioredis";
import { MongoClient } from "mongodb";
import crypto from "crypto";
import axios from "axios";

// AI Client Configuration
const HUGGINGFACE_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest";
const AI_API_URL = `https://router.huggingface.co/hf-inference/models/${HUGGINGFACE_MODEL}`;
const AI_API_KEY = process.env.AI_API_KEY;
const AI_TIMEOUT_MS = 30000;

// Create AI client
const aiClient = axios.create({
  baseURL: AI_API_URL,
  timeout: AI_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    ...(AI_API_KEY && { Authorization: `Bearer ${AI_API_KEY}` }),
  },
});

// Lazy initialization - connections created on first use
let connection = null;
let feedbackQueue = null;
let mongoClient = null;
let feedbackDb = null;
let redisAvailable = null; // null = not checked, true/false = checked

// Check if Redis is available
async function checkRedisConnection() {
  if (redisAvailable !== null) return redisAvailable;

  try {
    const testConn = new IORedis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Don't retry
    });

    await testConn.ping();
    await testConn.quit();
    redisAvailable = true;
    console.log("✅ Redis connection successful");
  } catch (err) {
    redisAvailable = false;
    console.warn(
      "⚠️ Redis not available - feedback queue features disabled:",
      err.message
    );
  }

  return redisAvailable;
}

// Get Redis connection (lazy init)
function getRedisConnection() {
  if (!connection) {
    const redisConfig = {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      lazyConnect: true, // Don't connect immediately
    };
    connection = new IORedis(redisConfig);

    connection.on("error", (err) => {
      console.error("Redis connection error:", err.message);
      redisAvailable = false;
    });
  }
  return connection;
}

// Get BullMQ queue (lazy init)
function getQueue() {
  if (!feedbackQueue) {
    feedbackQueue = new Queue("feedback-processing", {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: parseInt(process.env.MAX_RETRIES) || 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: { age: 86400 },
        removeOnFail: { age: 604800 },
      },
    });
  }
  return feedbackQueue;
}

// Get MongoDB connection (lazy init)
async function getMongoDb() {
  if (!feedbackDb) {
    mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();
    feedbackDb = mongoClient.db(process.env.MONGO_DB || "feedback_pipeline");
  }
  return feedbackDb;
}

/**
 * Analyze sentiment using Hugging Face AI
 */
async function analyzeWithAI(text) {
  try {
    const response = await aiClient.post("", {
      inputs: text,
      options: { wait_for_model: true },
    });

    const raw = response.data;

    // Handle Hugging Face format: [[{label, score}, ...]]
    if (Array.isArray(raw) && Array.isArray(raw[0])) {
      const results = raw[0];
      const top = results.reduce(
        (a, b) => (a.score > b.score ? a : b),
        results[0]
      );

      const labelMap = {
        POSITIVE: "positive",
        NEGATIVE: "negative",
        NEUTRAL: "neutral",
        positive: "positive",
        negative: "negative",
        neutral: "neutral",
        LABEL_0: "negative",
        LABEL_1: "neutral",
        LABEL_2: "positive",
      };

      // Normalize all scores to sum to 1.0 and create proper allScores array
      const totalScore = results.reduce((sum, r) => sum + r.score, 0);
      const normalizedResults = results.map((r) => {
        const normalizedScore = r.score / totalScore;
        const mappedLabel = labelMap[r.label] || r.label.toLowerCase();
        return {
          label: mappedLabel,
          score: Math.round(normalizedScore * 1000) / 1000,
          percentage: `${(normalizedScore * 100).toFixed(1)}%`,
        };
      });

      // Sort to always have consistent order: negative, neutral, positive
      const labelOrder = { negative: 0, neutral: 1, positive: 2 };
      normalizedResults.sort(
        (a, b) => labelOrder[a.label] - labelOrder[b.label]
      );

      return {
        sentiment: labelMap[top.label] || top.label.toLowerCase(),
        confidence: Math.round((top.score / totalScore) * 1000) / 1000,
        allScores: normalizedResults,
        intents: extractIntents(text),
        raw,
        aiProcessed: true,
      };
    }
    return null;
  } catch (error) {
    // Only log once - 401 means invalid API key
    if (error.response?.status === 401) {
      if (!analyzeWithAI.loggedAuthError) {
        console.warn(
          "⚠️ AI API: Invalid or expired API key - using fallback sentiment analysis"
        );
        analyzeWithAI.loggedAuthError = true;
      }
    } else {
      console.error("AI API error:", error.message);
    }
    return null;
  }
}

/**
 * Extract intents from text
 */
function extractIntents(text) {
  const intents = [];
  const lower = text.toLowerCase();

  if (lower.includes("help") || lower.includes("support"))
    intents.push("support_request");
  if (
    lower.includes("bug") ||
    lower.includes("error") ||
    lower.includes("broken")
  )
    intents.push("bug_report");
  if (
    lower.includes("feature") ||
    lower.includes("suggest") ||
    lower.includes("wish")
  )
    intents.push("feature_request");
  if (lower.includes("cancel") || lower.includes("refund"))
    intents.push("churn_risk");
  if (
    lower.includes("love") ||
    lower.includes("great") ||
    lower.includes("amazing")
  )
    intents.push("positive_feedback");
  if (
    lower.includes("hate") ||
    lower.includes("terrible") ||
    lower.includes("worst")
  )
    intents.push("negative_feedback");
  if (
    lower.includes("price") ||
    lower.includes("cost") ||
    lower.includes("expensive")
  )
    intents.push("pricing_concern");

  return intents.length ? intents : ["general_feedback"];
}

/**
 * Submit feedback for sentiment analysis
 * POST /api/feedback/submit
 *
 * Tries AI analysis first with a timeout, falls back to simple sentiment if AI is slow
 */
export const submitFeedback = async (req, res) => {
  try {
    const { text, metadata = {} } = req.body;
    const userId = req.userId;
    const rating = metadata.rating || 0;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Feedback text is required",
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Feedback text exceeds maximum length of 5000 characters",
      });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const jobId = crypto.randomUUID();
    const submittedAt = new Date();
    const trimmedText = text.trim();

    // Try AI analysis first with 10 second timeout
    let analysisResult = null;
    let usedAI = false;

    try {
      const aiPromise = analyzeWithAI(trimmedText);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI timeout")), 10000)
      );

      analysisResult = await Promise.race([aiPromise, timeoutPromise]);
      usedAI = analysisResult !== null && analysisResult.aiProcessed;
    } catch (aiError) {
      // AI failed or timed out, use fallback
      console.warn(
        `⚠️ AI analysis not available (${aiError.message}), using fallback`
      );
    }

    // If AI didn't work, use fallback analysis
    if (!analysisResult) {
      const sentiment = analyzeSimpleSentiment(trimmedText);
      const scores = getSimpleSentimentScores(trimmedText);

      analysisResult = {
        sentiment,
        confidence: scores[sentiment] || 0.6,
        allScores: [
          {
            label: "positive",
            score: scores.positive,
            percentage: `${(scores.positive * 100).toFixed(1)}%`,
          },
          {
            label: "neutral",
            score: scores.neutral,
            percentage: `${(scores.neutral * 100).toFixed(1)}%`,
          },
          {
            label: "negative",
            score: scores.negative,
            percentage: `${(scores.negative * 100).toFixed(1)}%`,
          },
        ],
        intents: extractIntents(trimmedText),
        aiProcessed: false,
      };
    }

    // Store feedback document immediately
    const db = await getMongoDb();
    const feedbackDoc = {
      jobId,
      userId,
      text: trimmedText,
      rating: rating || 0,
      sentiment: analysisResult.sentiment,
      confidence: analysisResult.confidence,
      allScores: analysisResult.allScores,
      intents: analysisResult.intents,
      raw: analysisResult.raw || null,
      aiProcessed: analysisResult.aiProcessed,
      submittedAt,
      processedAt: new Date(),
      metadata: {
        ...metadata,
        source: analysisResult.aiProcessed
          ? "ai-analysis"
          : "fallback-analysis",
        wordCount: trimmedText.split(/\s+/).length,
        charCount: trimmedText.length,
      },
    };

    await db
      .collection("feedback_results")
      .updateOne({ jobId }, { $set: feedbackDoc }, { upsert: true });

    // Return complete analysis immediately
    res.status(200).json({
      success: true,
      message: "Feedback analyzed successfully",
      jobId,
      analysis: {
        sentiment: analysisResult.sentiment,
        confidence: analysisResult.confidence,
        confidencePercent: `${(analysisResult.confidence * 100).toFixed(1)}%`,
        allScores: analysisResult.allScores,
        intents: analysisResult.intents,
        aiProcessed: analysisResult.aiProcessed,
      },
      metrics: {
        wordCount: trimmedText.split(/\s+/).length,
        charCount: trimmedText.length,
        submittedAt: submittedAt.toISOString(),
      },
    });

    console.log(
      `✅ Feedback ${jobId} analyzed with ${
        analysisResult.aiProcessed ? "AI" : "fallback"
      } method`
    );
  } catch (error) {
    console.error("Submit feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
    });
  }
};

/**
 * Simple keyword-based sentiment analysis (fallback when AI unavailable)
 */
function analyzeSimpleSentiment(text) {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "wonderful",
    "fantastic",
    "love",
    "best",
    "happy",
    "satisfied",
    "awesome",
    "perfect",
    "helpful",
    "friendly",
    "thank",
    "thanks",
    "appreciate",
    "appreciate",
    "wonderful",
    "brilliant",
    "outstanding",
    "superb",
    "impressed",
    "impressed",
  ];
  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "hate",
    "worst",
    "disappointed",
    "angry",
    "frustrated",
    "poor",
    "slow",
    "broken",
    "useless",
    "annoying",
    "problem",
    "issue",
    "fail",
    "failure",
    "disappointed",
    "sad",
    "unhappy",
    "disappointing",
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    const matches = lowerText.match(regex);
    if (matches) positiveCount += matches.length;
  });

  negativeWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    const matches = lowerText.match(regex);
    if (matches) negativeCount += matches.length;
  });

  if (positiveCount > negativeCount && positiveCount > 0) return "positive";
  if (negativeCount > positiveCount && negativeCount > 0) return "negative";
  return "neutral";
}

/**
 * Calculate all three sentiment scores (positive, neutral, negative) with normalized percentages
 */
function getSimpleSentimentScores(text) {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "wonderful",
    "fantastic",
    "love",
    "best",
    "happy",
    "satisfied",
    "awesome",
    "perfect",
    "helpful",
    "friendly",
    "thank",
    "thanks",
    "appreciate",
    "brilliant",
    "outstanding",
    "superb",
    "impressed",
  ];
  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "hate",
    "worst",
    "disappointed",
    "angry",
    "frustrated",
    "poor",
    "slow",
    "broken",
    "useless",
    "annoying",
    "problem",
    "issue",
    "fail",
    "failure",
    "sad",
    "unhappy",
    "disappointing",
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    const matches = lowerText.match(regex);
    if (matches) positiveCount += matches.length;
  });

  negativeWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    const matches = lowerText.match(regex);
    if (matches) negativeCount += matches.length;
  });

  let positiveScore, negativeScore, neutralScore;

  if (positiveCount === 0 && negativeCount === 0) {
    // No sentiment words found - equal distribution (neutral)
    positiveScore = 0.33;
    negativeScore = 0.33;
    neutralScore = 0.34;
  } else {
    // Scale scores based on detected words
    // More words detected = higher confidence in that sentiment
    const maxCount = Math.max(positiveCount, negativeCount, 1);

    positiveScore = (positiveCount / maxCount) * 0.8; // Max 80% confidence
    negativeScore = (negativeCount / maxCount) * 0.8; // Max 80% confidence

    // Neutral gets the remaining percentage (min 10%)
    neutralScore = Math.max(0.1, 1 - positiveScore - negativeScore);

    // Renormalize to ensure they sum to 1.0
    const total = positiveScore + negativeScore + neutralScore;
    positiveScore = positiveScore / total;
    negativeScore = negativeScore / total;
    neutralScore = neutralScore / total;
  }

  return {
    positive: Math.round(positiveScore * 1000) / 1000, // Round to 3 decimals
    neutral: Math.round(neutralScore * 1000) / 1000,
    negative: Math.round(negativeScore * 1000) / 1000,
  };
}

/**
 * Get feedback analysis result by job ID
 * GET /api/feedback/result/:jobId
 */
export const getFeedbackResult = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required",
      });
    }

    // Check Redis availability for queue status
    const isRedisAvailable = await checkRedisConnection();

    if (isRedisAvailable) {
      // Check job status in queue first
      const job = await getQueue().getJob(jobId);

      if (job) {
        const state = await job.getState();

        if (state === "completed") {
          // Job completed, get result from MongoDB
          const db = await getMongoDb();
          const result = await db
            .collection("feedback_results")
            .findOne({ jobId });

          if (result) {
            return res.json({
              success: true,
              status: "completed",
              result: {
                sentiment: result.sentiment,
                confidence: result.confidence,
                processedAt: result.processedAt,
              },
            });
          }
        } else if (state === "failed") {
          return res.json({
            success: true,
            status: "failed",
            message: "Analysis failed",
            failedReason: job.failedReason,
          });
        } else {
          // Still processing (waiting, active, delayed)
          return res.json({
            success: true,
            status: state,
            message: `Job is ${state}`,
          });
        }
      }
    }

    // Job not in queue or Redis unavailable, check MongoDB directly
    const db = await getMongoDb();
    const result = await db.collection("feedback_results").findOne({ jobId });

    if (result) {
      return res.json({
        success: true,
        status: "completed",
        result: {
          sentiment: result.sentiment,
          confidence: result.confidence,
          processedAt: result.processedAt,
        },
      });
    }

    res.status(404).json({
      success: false,
      message: "Job not found",
    });
  } catch (error) {
    console.error("Get feedback result error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get feedback result",
    });
  }
};

/**
 * Get all feedback history for authenticated user
 * GET /api/feedback/history
 *
 * Returns complete feedback data with all metrics
 */
export const getFeedbackHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit), 50);

    const db = await getMongoDb();

    // Get feedback from feedback_results collection
    const results = await db
      .collection("feedback_results")
      .find({ userId })
      .sort({ processedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db
      .collection("feedback_results")
      .countDocuments({ userId });

    res.json({
      success: true,
      data: results.map((r) => ({
        jobId: r.jobId,
        text: r.text,
        sentiment: r.sentiment,
        confidence: r.confidence,
        confidencePercent: `${(r.confidence * 100).toFixed(1)}%`,
        allScores: r.allScores || [],
        intents: r.intents || [],
        aiProcessed: r.aiProcessed || false,
        submittedAt: r.submittedAt,
        processedAt: r.processedAt,
        metadata: {
          source: r.metadata?.source || "unknown",
          wordCount: r.metadata?.wordCount || 0,
          charCount: r.metadata?.charCount || 0,
        },
      })),
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get feedback history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get feedback history",
    });
  }
};

/**
 * Get sentiment statistics for authenticated user
 * GET /api/feedback/stats
 */
export const getFeedbackStats = async (req, res) => {
  try {
    const userId = req.userId;

    const db = await getMongoDb();

    const stats = await db
      .collection("feedback_results")
      .aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$sentiment",
            count: { $sum: 1 },
            avgConfidence: { $avg: "$confidence" },
          },
        },
      ])
      .toArray();

    const total = await db
      .collection("feedback_results")
      .countDocuments({ userId });

    const sentimentBreakdown = {};
    stats.forEach((s) => {
      sentimentBreakdown[s._id] = {
        count: s.count,
        percentage: total > 0 ? ((s.count / total) * 100).toFixed(1) : 0,
        avgConfidence: s.avgConfidence?.toFixed(3) || 0,
      };
    });

    res.json({
      success: true,
      stats: {
        total,
        breakdown: sentimentBreakdown,
      },
    });
  } catch (error) {
    console.error("Get feedback stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get feedback statistics",
    });
  }
};

/**
 * Get rating statistics for authenticated user
 * GET /api/feedback/rating-stats
 */
export const getRatingStats = async (req, res) => {
  try {
    const userId = req.userId;
    const db = await getMongoDb();

    // Get all feedback with ratings for this user
    const feedbackWithRatings = await db
      .collection("feedback_results")
      .find({ userId, rating: { $gt: 0 } })
      .toArray();

    if (feedbackWithRatings.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalRatings: 0,
          averageRating: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      });
    }

    // Calculate statistics
    const totalRatings = feedbackWithRatings.length;
    const sumRatings = feedbackWithRatings.reduce(
      (sum, fb) => sum + fb.rating,
      0
    );
    const averageRating = sumRatings / totalRatings;

    // Calculate distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbackWithRatings.forEach((fb) => {
      if (fb.rating >= 1 && fb.rating <= 5) {
        distribution[fb.rating]++;
      }
    });

    res.json({
      success: true,
      stats: {
        totalRatings,
        averageRating,
        distribution,
      },
    });
  } catch (error) {
    console.error("Get rating stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get rating statistics",
    });
  }
};

/**
 * Clear all feedback history for authenticated user
 * DELETE /api/feedback/clear
 */
export const clearFeedbackHistory = async (req, res) => {
  try {
    const userId = req.userId;

    const db = await getMongoDb();
    const result = await db
      .collection("feedback_results")
      .deleteMany({ userId });

    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} feedback entries`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Clear feedback history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear feedback history",
    });
  }
};

/**
 * Get queue health status (admin only or authenticated users)
 * GET /api/feedback/health
 */
export const getQueueHealth = async (req, res) => {
  try {
    // Check Redis availability
    const isRedisAvailable = await checkRedisConnection();

    if (!isRedisAvailable) {
      return res.json({
        success: true,
        queue: {
          name: "feedback-processing",
          status: "disconnected",
          message:
            "Redis not available. Configure REDIS_HOST/REDIS_PORT in .env or use Upstash.",
          counts: null,
        },
      });
    }

    const queue = getQueue();
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    res.json({
      success: true,
      queue: {
        name: "feedback-processing",
        status: "connected",
        counts: {
          waiting,
          active,
          completed,
          failed,
          delayed,
        },
      },
    });
  } catch (error) {
    console.error("Get queue health error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get queue health",
      queue: { status: "disconnected" },
    });
  }
};
