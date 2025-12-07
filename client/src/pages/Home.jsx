import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { assets } from "../assets";
import { publicAPI } from "../services/api";
import AnimatedGauge from "../components/AnimatedGauge";

// Static data - defined outside component to avoid recreation
const testimonials = [
  {
    name: "Sweehar",
    role: "Student of KMIT",
    content:
      "This platform transformed how we handle customer feedback. The AI insights are incredibly accurate!",
    avatar: "S",
    rating: 5,
  },
  {
    name: "Amrutha",
    role: "Student of KMIT",
    content:
      "We've seen a 40% improvement in customer satisfaction since implementing this solution.",
    avatar: "A",
    rating: 5,
  },
  {
    name: "Abhishek",
    role: "Student of KMIT",
    content:
      "The sentiment analysis helps us prioritize issues before they escalate. Game changer!",
    avatar: "A",
    rating: 5,
  },
  {
    name: "Abhinav",
    role: "Student of KMIT",
    content:
      "Amazing AI-powered feedback system! It made our project management so much easier.",
    avatar: "A",
    rating: 5,
  },
  {
    name: "Koushik",
    role: "Student of KMIT",
    content:
      "The best feedback management tool I've used. Highly recommend it for any team!",
    avatar: "K",
    rating: 5,
  },
];

const features = [
  {
    icon: "🤖",
    title: "AI-Powered Analysis",
    description:
      "Advanced machine learning algorithms analyze sentiment, intent, and emotions in real-time",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: "📊",
    title: "Rich Analytics",
    description:
      "Beautiful dashboards with actionable insights, trends, and performance metrics",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: "⚡",
    title: "Real-time Processing",
    description:
      "Instant feedback processing with live updates and notifications",
    gradient: "from-orange-500 to-yellow-500",
  },
  {
    icon: "🔐",
    title: "Enterprise Security",
    description:
      "Bank-grade encryption, role-based access, and compliance-ready infrastructure",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: "🔗",
    title: "Easy Integration",
    description:
      "RESTful APIs and webhooks for seamless integration with your existing tools",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: "📱",
    title: "Multi-platform",
    description:
      "Access from anywhere - responsive design works on desktop, tablet, and mobile",
    gradient: "from-rose-500 to-red-500",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const { darkMode } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [animatedStats, setAnimatedStats] = useState({
    users: 0,
    feedback: 0,
    accuracy: 0,
  });
  const [realStats, setRealStats] = useState({
    users: 0,
    feedback: 0,
    accuracy: 95,
  });

  // Fetch real stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await publicAPI.getStats();
        if (response.data.success) {
          setRealStats({
            users: response.data.stats.users || 0,
            feedback: response.data.stats.feedback || 0,
            accuracy: response.data.stats.accuracy || 95,
          });
        }
      } catch (error) {
        console.log("Could not fetch public stats:", error.message);
        // Keep default values if API fails
      }
    };
    fetchStats();
  }, []);

  // Handle scroll for navbar effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animate stats on mount (animate to real values)
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setAnimatedStats({
        users: Math.floor(realStats.users * progress),
        feedback: Math.floor(realStats.feedback * progress),
        accuracy: Math.floor(realStats.accuracy * progress),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [realStats]);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode
            ? "dark bg-gray-900"
            : "bg-gradient-to-br from-blue-50 to-indigo-100"
        }`}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${darkMode ? "dark bg-gray-900" : "bg-white"}`}
    >
      {/* Floating Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? `${
                darkMode ? "bg-gray-900/95" : "bg-white/95"
              } backdrop-blur-md shadow-lg`
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center group cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img
              src={assets.logo}
              alt="Logo"
              className="h-10 transition-transform group-hover:scale-110"
            />
            <span
              className={`ml-2 text-xl font-bold ${
                darkMode ? "text-white" : "text-gray-800"
              } transition-colors`}
            >
              AI CRM <span className="text-blue-600">Feedback</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className={`${
                darkMode
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              } transition font-medium`}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className={`${
                darkMode
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              } transition font-medium`}
            >
              How it Works
            </a>
            <a
              href="#testimonials"
              className={`${
                darkMode
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              } transition font-medium`}
            >
              Testimonials
            </a>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/login")}
              className={`font-semibold px-5 py-2.5 rounded-lg transition-all hover:scale-105 ${
                darkMode
                  ? "text-white hover:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className={`relative pt-32 pb-20 overflow-hidden ${
          darkMode
            ? "bg-gray-900"
            : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
        }`}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-bounce-slow">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                New: AI-Powered Intent Detection
              </div>

              <h1
                className={`text-5xl lg:text-6xl font-bold mb-6 leading-tight ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Transform Feedback into{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient">
                  Actionable Insights
                </span>
              </h1>

              <p
                className={`text-xl mb-8 leading-relaxed ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Harness the power of AI to understand your customers better.
                Analyze sentiment, detect intent, and make data-driven decisions
                that boost satisfaction and drive growth.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => navigate("/register")}
                  className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-8 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className={`group font-semibold py-4 px-8 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2 ${
                    darkMode
                      ? "bg-gray-800 text-white hover:bg-gray-700"
                      : "bg-white text-gray-700 hover:bg-gray-50 shadow-lg"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Sign In
                </button>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6">
                <div
                  className={`flex items-center gap-2 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    No credit card required
                  </span>
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">14-day free trial</span>
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Hero Gauge Animation */}
            <div className="relative">
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8">
                <AnimatedGauge />
              </div>

              {/* Floating Cards */}
              <div className="absolute -left-4 top-1/4 bg-white rounded-xl shadow-xl p-4 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">😊</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Sentiment</p>
                    <p className="font-bold text-green-600">Positive 94%</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 top-1/2 bg-white rounded-xl shadow-xl p-4 animate-float animation-delay-2000">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">📈</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Insights</p>
                    <p className="font-bold text-blue-600">+127 today</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 left-1/4 bg-white rounded-xl shadow-xl p-4 animate-float animation-delay-4000">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">🎯</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Accuracy</p>
                    <p className="font-bold text-purple-600">99.2%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`py-16 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard
              value={`${animatedStats.users.toLocaleString()}+`}
              label="Active Users"
              icon="👥"
              darkMode={darkMode}
            />
            <StatCard
              value={`${animatedStats.feedback.toLocaleString()}+`}
              label="Feedback Analyzed"
              icon="💬"
              darkMode={darkMode}
            />
            <StatCard
              value={`${animatedStats.accuracy}%`}
              label="AI Accuracy"
              icon="🎯"
              darkMode={darkMode}
            />
            <StatCard
              value="24/7"
              label="Support Available"
              icon="🛡️"
              darkMode={darkMode}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className={`py-20 ${
          darkMode ? "bg-gray-900" : "bg-gradient-to-b from-gray-50 to-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              FEATURES
            </span>
            <h2
              className={`text-4xl md:text-5xl font-bold mb-6 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Everything you need to understand your customers
            </h2>
            <p
              className={`text-xl max-w-3xl mx-auto ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Powerful tools designed to help you collect, analyze, and act on
              customer feedback effectively.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                {...feature}
                darkMode={darkMode}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className={`py-20 ${darkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
              HOW IT WORKS
            </span>
            <h2
              className={`text-4xl md:text-5xl font-bold mb-6 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Simple steps to get started
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              step={1}
              title="Collect Feedback"
              description="Gather customer feedback through multiple channels - email, web forms, or API integration"
              icon="📥"
              darkMode={darkMode}
            />
            <StepCard
              step={2}
              title="AI Analysis"
              description="Our AI automatically analyzes sentiment, detects intent, and categorizes feedback"
              icon="🧠"
              darkMode={darkMode}
            />
            <StepCard
              step={3}
              title="Take Action"
              description="Get actionable insights and recommendations to improve customer satisfaction"
              icon="🚀"
              darkMode={darkMode}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonials"
        className={`py-20 ${
          darkMode ? "bg-gray-900" : "bg-gradient-to-b from-blue-50 to-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-4">
              TESTIMONIALS
            </span>
            <h2
              className={`text-4xl md:text-5xl font-bold mb-6 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Loved by businesses worldwide
            </h2>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div
              className={`rounded-2xl p-8 md:p-12 ${
                darkMode ? "bg-gray-800" : "bg-white"
              } shadow-xl`}
            >
              <div className="flex justify-center mb-6">
                {[...Array(testimonials[activeTestimonial].rating)].map(
                  (_, i) => (
                    <svg
                      key={i}
                      className="w-6 h-6 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )
                )}
              </div>

              <p
                className={`text-xl md:text-2xl text-center mb-8 italic ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                "{testimonials[activeTestimonial].content}"
              </p>

              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {testimonials[activeTestimonial].avatar}
                </div>
                <div className="text-center">
                  <p
                    className={`font-semibold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {testimonials[activeTestimonial].name}
                  </p>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {testimonials[activeTestimonial].role}
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonial Navigation */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === activeTestimonial
                      ? "bg-blue-600 w-8"
                      : darkMode
                      ? "bg-gray-600 hover:bg-gray-500"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-12 md:p-20 text-center">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-10 left-10 w-20 h-20 border-4 border-white rounded-full"></div>
              <div className="absolute bottom-10 right-10 w-32 h-32 border-4 border-white rounded-full"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 border-4 border-white rotate-45"></div>
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to transform your feedback?
              </h2>
              <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                Join thousands of companies using AI CRM Feedback to understand
                their customers better and drive growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/register")}
                  className="bg-white text-blue-600 font-bold py-4 px-10 rounded-xl hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="border-2 border-white text-white font-bold py-4 px-10 rounded-xl hover:bg-white/10 transition-all hover:scale-105"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`${
          darkMode ? "bg-gray-900 border-t border-gray-800" : "bg-gray-900"
        } text-white py-16`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center mb-6">
                <img
                  src={assets.logo}
                  alt="Logo"
                  className="h-10 brightness-0 invert"
                />
                <span className="ml-2 text-xl font-bold">AI CRM Feedback</span>
              </div>
              <p className="text-gray-400 mb-6">
                Transform customer feedback into actionable insights with
                AI-powered analysis.
              </p>
              <div className="flex gap-4">
                <SocialIcon icon="twitter" />
                <SocialIcon icon="linkedin" />
                <SocialIcon icon="github" />
              </div>
            </div>

            <FooterColumn
              title="Product"
              links={["Features", "Pricing", "Integrations", "API Docs"]}
            />
            <FooterColumn
              title="Company"
              links={["About", "Blog", "Careers", "Contact"]}
            />
            <FooterColumn
              title="Legal"
              links={["Privacy", "Terms", "Security", "Compliance"]}
            />
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} AI CRM Feedback. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

// Component: Stat Card
const StatCard = ({ value, label, icon, darkMode }) => (
  <div className="text-center group">
    <div className="text-4xl mb-2 transform group-hover:scale-125 transition-transform">
      {icon}
    </div>
    <div
      className={`text-3xl md:text-4xl font-bold mb-1 ${
        darkMode ? "text-white" : "text-gray-900"
      }`}
    >
      {value}
    </div>
    <div className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
      {label}
    </div>
  </div>
);

// Component: Feature Card
const FeatureCard = ({
  icon,
  title,
  description,
  gradient,
  darkMode,
  index,
}) => (
  <div
    className={`group p-8 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
      darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"
    } border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div
      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform`}
    >
      {icon}
    </div>
    <h3
      className={`text-xl font-bold mb-3 ${
        darkMode ? "text-white" : "text-gray-900"
      }`}
    >
      {title}
    </h3>
    <p
      className={`${
        darkMode ? "text-gray-400" : "text-gray-600"
      } leading-relaxed`}
    >
      {description}
    </p>
  </div>
);

// Component: Step Card
const StepCard = ({ step, title, description, icon, darkMode }) => (
  <div className="relative text-center">
    <div
      className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 text-4xl ${
        darkMode
          ? "bg-gray-700"
          : "bg-gradient-to-br from-blue-100 to-purple-100"
      }`}
    >
      {icon}
    </div>
    <div
      className={`absolute top-8 left-1/2 w-full h-0.5 ${
        darkMode ? "bg-gray-700" : "bg-gray-200"
      } -z-10 hidden md:block`}
      style={{ transform: "translateX(50%)" }}
    ></div>
    <div className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full mb-4">
      Step {step}
    </div>
    <h3
      className={`text-xl font-bold mb-3 ${
        darkMode ? "text-white" : "text-gray-900"
      }`}
    >
      {title}
    </h3>
    <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
      {description}
    </p>
  </div>
);

// Component: Social Icon
const SocialIcon = ({ icon }) => (
  <a
    href="#"
    className="w-10 h-10 rounded-full bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition-colors"
  >
    {icon === "twitter" && (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
      </svg>
    )}
    {icon === "linkedin" && (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    )}
    {icon === "github" && (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    )}
  </a>
);

// Component: Footer Column
const FooterColumn = ({ title, links }) => (
  <div>
    <h4 className="font-semibold text-lg mb-4">{title}</h4>
    <ul className="space-y-3">
      {links.map((link, index) => (
        <li key={index}>
          <a
            href="#"
            className="text-gray-400 hover:text-white transition-colors"
          >
            {link}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

export default Home;
