import axios from "axios";

const API_URL = "http://localhost:4000/api";

let authToken = null;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Intercept responses to capture the token
api.interceptors.response.use(
  (response) => {
    const setCookie = response.headers["set-cookie"];
    if (setCookie) {
      const tokenMatch = setCookie.find((c) => c.startsWith("token="));
      if (tokenMatch) {
        authToken = tokenMatch.split(";")[0].replace("token=", "");
      }
    }
    return response;
  },
  (error) => Promise.reject(error)
);

// Interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      if (!config.headers.Cookie) {
        config.headers.Cookie = "";
      }
      config.headers.Cookie += `token=${authToken};`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

async function checkStats() {
  console.log("🔍 Checking Feedback and Admin Stats...\n");

  try {
    // Login
    console.log("📝 Logging in...");
    const loginRes = await api.post("/auth/login", {
      email: "team.808.test@gmail.com",
      password: "team@808",
    });

    if (!loginRes.data.success) {
      console.error("❌ Login failed");
      return;
    }

    console.log("✅ Logged in\n");

    // Get feedback stats (user's personal data)
    console.log("📊 Fetching Personal Feedback Stats (/feedback/stats)...");
    const feedbackRes = await api.get("/feedback/stats");
    console.log("Response:", JSON.stringify(feedbackRes.data, null, 2));

    console.log("\n" + "=".repeat(60) + "\n");

    // Get admin stats (all system data)
    console.log("📊 Fetching Admin Stats (/admin/stats)...");
    const adminRes = await api.get("/admin/stats");
    const adminFeedback = adminRes.data?.stats?.feedback;
    console.log("Admin Feedback Stats:", JSON.stringify(adminFeedback, null, 2));

    console.log("\n" + "=".repeat(60) + "\n");
    console.log("📈 Comparison:\n");

    const userStats = feedbackRes.data.stats;
    const userTotal = userStats.total;
    const userBreakdown = userStats.breakdown;

    console.log("USER FEEDBACK (Personal):");
    console.log(`  Total: ${userTotal}`);
    console.log(`  Positive: ${userBreakdown.positive?.count} (${userBreakdown.positive?.percentage}%)`);
    console.log(`  Neutral: ${userBreakdown.neutral?.count} (${userBreakdown.neutral?.percentage}%)`);
    console.log(`  Negative: ${userBreakdown.negative?.count} (${userBreakdown.negative?.percentage}%)`);
    console.log("\n  Growth (Week over Week):");
    console.log(`    Total: ${userStats.growth?.total || 'N/A'}%`);
    console.log(`    Positive: ${userBreakdown.positive?.weekGrowth || 'N/A'}%`);
    console.log(`    Neutral: ${userBreakdown.neutral?.weekGrowth || 'N/A'}%`);
    console.log(`    Negative: ${userBreakdown.negative?.weekGrowth || 'N/A'}%`);

    console.log("\nADMIN FEEDBACK (System-wide):");
    console.log(`  Total: ${adminFeedback.total}`);
    const posCount = adminFeedback.bySentiment.positive || 0;
    const neuCount = adminFeedback.bySentiment.neutral || 0;
    const negCount = adminFeedback.bySentiment.negative || 0;
    const adminTotal = adminFeedback.total || 1;
    console.log(
      `  Positive: ${posCount} (${((posCount / adminTotal) * 100).toFixed(1)}%)`
    );
    console.log(
      `  Neutral: ${neuCount} (${((neuCount / adminTotal) * 100).toFixed(1)}%)`
    );
    console.log(
      `  Negative: ${negCount} (${((negCount / adminTotal) * 100).toFixed(1)}%)`
    );

    console.log("\n✅ Stats comparison complete!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkStats();
