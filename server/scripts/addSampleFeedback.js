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
    // Try to get token from response headers
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

async function addSampleFeedback() {
  console.log("🚀 Adding Sample Feedback Data...\n");

  const feedbackTexts = [
    "Great service! Very satisfied with the product.",
    "Excellent experience, would recommend to others.",
    "Best purchase I've made, highly impressed!",
    "Amazing quality and fast delivery.",
    "Very happy with my purchase, great value!",
    "Product is okay, meets expectations.",
    "Decent service, nothing special.",
    "Average experience overall.",
    "It's what I expected.",
    "Neither good nor bad.",
    "Poor quality, disappointed with the product.",
    "Terrible service, would not recommend.",
    "Very unhappy with this purchase.",
    "Waste of money, very frustrated.",
    "Unacceptable quality, returning immediately.",
  ];

  try {
    // First, login
    console.log("📝 Logging in...");
    const loginRes = await api.post("/auth/login", {
      email: "team.808.test@gmail.com",
      password: "team@808",
    });

    if (!loginRes.data.success) {
      console.error("❌ Login failed:", loginRes.data.message);
      return;
    }

    console.log("✅ Logged in successfully\n");

    // Submit feedback
    console.log("📊 Submitting feedback samples...");
    for (let i = 0; i < feedbackTexts.length; i++) {
      try {
        const response = await api.post("/feedback/submit", {
          text: feedbackTexts[i],
          metadata: { source: "sample" },
        });

        if (response.data.success) {
          console.log(`   ✅ [${i + 1}/${feedbackTexts.length}] ${feedbackTexts[i].substring(0, 40)}...`);
        } else {
          console.log(`   ⚠️  [${i + 1}/${feedbackTexts.length}] Failed: ${response.data.message}`);
        }
      } catch (err) {
        console.log(`   ⚠️  [${i + 1}/${feedbackTexts.length}] Error: ${err.message}`);
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("\n✅ Sample feedback added successfully!");
    console.log("\n💡 Tip: Go back to your dashboard and refresh to see the updated stats!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

addSampleFeedback();
