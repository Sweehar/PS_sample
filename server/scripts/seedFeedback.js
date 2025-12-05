import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://team808:1234PS4321@cluster0.0djdx0n.mongodb.net";

async function seedFeedback() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("CRM_Sentiment");
    const usersCollection = db.collection("users");
    const feedbackCollection = db.collection("feedback_results");

    // Get all users
    const users = await usersCollection.find({}).toArray();
    console.log(`📊 Found ${users.length} users`);

    if (users.length === 0) {
      console.log("❌ No users found. Please create a user first.");
      return;
    }

    // Sample feedback data
    const sentiments = ["positive", "neutral", "negative"];
    const feedbackTexts = {
      positive: [
        "Great service! Very satisfied with the product.",
        "Excellent experience, would recommend to others.",
        "Best purchase I've made, highly impressed!",
        "Amazing quality and fast delivery.",
        "Very happy with my purchase, great value!",
      ],
      neutral: [
        "Product is okay, meets expectations.",
        "Decent service, nothing special.",
        "Average experience overall.",
        "It's what I expected.",
        "Neither good nor bad.",
      ],
      negative: [
        "Poor quality, disappointed with the product.",
        "Terrible service, would not recommend.",
        "Very unhappy with this purchase.",
        "Waste of money, very frustrated.",
        "Unacceptable quality, returning immediately.",
      ],
    };

    // Create feedback for each user
    for (const user of users) {
      const feedbackCount = Math.floor(Math.random() * 20) + 5; // 5-25 feedback items per user
      const feedbackDocs = [];

      for (let i = 0; i < feedbackCount; i++) {
        const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
        const texts = feedbackTexts[sentiment];
        const text = texts[Math.floor(Math.random() * texts.length)];

        feedbackDocs.push({
          userId: user._id,
          text,
          sentiment,
          confidence: parseFloat((Math.random() * 0.3 + 0.7).toFixed(3)), // 0.7 - 1.0
          jobId: `job_${Math.random().toString(36).substr(2, 9)}`,
          processedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
          createdAt: new Date(),
        });
      }

      if (feedbackDocs.length > 0) {
        await feedbackCollection.insertMany(feedbackDocs);
        console.log(
          `✅ Seeded ${feedbackDocs.length} feedback items for user: ${user.email}`
        );
      }
    }

    console.log("\n✅ Feedback data seeded successfully!");

    // Show stats
    const totalFeedback = await feedbackCollection.countDocuments({});
    console.log(`📈 Total feedback items in database: ${totalFeedback}`);

    const stats = await feedbackCollection
      .aggregate([
        {
          $group: {
            _id: "$sentiment",
            count: { $sum: 1 },
            avgConfidence: { $avg: "$confidence" },
          },
        },
      ])
      .toArray();

    console.log("\n📊 Feedback breakdown:");
    stats.forEach((s) => {
      console.log(
        `   ${s._id}: ${s.count} (avg confidence: ${(s.avgConfidence * 100).toFixed(1)}%)`
      );
    });
  } catch (error) {
    console.error("❌ Error seeding feedback:", error.message);
  } finally {
    await client.close();
  }
}

seedFeedback();
