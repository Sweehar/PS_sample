import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { assets } from "../assets";

// Floating Particle Component
const FloatingParticle = ({ delay, duration, size, left, top }) => (
  <div
    className="absolute rounded-full opacity-20 animate-float pointer-events-none"
    style={{
      width: size,
      height: size,
      left: left,
      top: top,
      background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
      animationDelay: delay,
      animationDuration: duration,
    }}
  />
);

// Animated Background Component
const AnimatedBackground = ({ darkMode }) => (
  <div className="absolute inset-0 overflow-hidden">
    {/* Gradient Orbs */}
    <div
      className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-30 animate-pulse ${
        darkMode ? "bg-blue-600" : "bg-blue-400"
      }`}
    />
    <div
      className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-30 animate-pulse ${
        darkMode ? "bg-purple-600" : "bg-purple-400"
      }`}
      style={{ animationDelay: "1s" }}
    />
    <div
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse ${
        darkMode ? "bg-indigo-600" : "bg-indigo-400"
      }`}
      style={{ animationDelay: "2s" }}
    />

    {/* Floating Particles */}
    <FloatingParticle
      delay="0s"
      duration="6s"
      size="12px"
      left="10%"
      top="20%"
    />
    <FloatingParticle
      delay="1s"
      duration="8s"
      size="8px"
      left="20%"
      top="60%"
    />
    <FloatingParticle
      delay="2s"
      duration="7s"
      size="10px"
      left="80%"
      top="30%"
    />
    <FloatingParticle
      delay="0.5s"
      duration="9s"
      size="6px"
      left="70%"
      top="70%"
    />
    <FloatingParticle
      delay="1.5s"
      duration="6s"
      size="14px"
      left="90%"
      top="10%"
    />
    <FloatingParticle delay="3s" duration="8s" size="8px" left="5%" top="80%" />
  </div>
);

// Feature Card Component
const FeatureCard = ({ icon, text, darkMode }) => (
  <div
    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
      darkMode
        ? "bg-gray-800/50 hover:bg-gray-700/50"
        : "bg-white/50 hover:bg-white/80"
    } backdrop-blur-sm`}
  >
    <span className="text-2xl">{icon}</span>
    <span
      className={`text-sm font-medium ${
        darkMode ? "text-gray-300" : "text-gray-700"
      }`}
    >
      {text}
    </span>
  </div>
);

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await login(formData.email, formData.password);
      if (response.success) {
        if (response.isAdmin || response.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8 ${
        darkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      }`}
    >
      {/* Add custom styles for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.4; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.6s ease-out forwards; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>

      <AnimatedBackground darkMode={darkMode} />

      <div
        className={`w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center relative z-10 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Left Side - Branding & Features */}
        <div
          className={`hidden lg:flex flex-col space-y-8 p-8 ${
            darkMode ? "text-white" : "text-gray-800"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <span className="text-3xl">🤖</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI CRM Feedback
              </h1>
            </div>
            <p
              className={`text-lg ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Transform customer feedback into actionable insights with
              AI-powered sentiment analysis.
            </p>
          </div>

          <div className="space-y-4">
            <h3
              className={`text-xl font-semibold ${
                darkMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Why choose us?
            </h3>
            <div className="grid gap-3">
              <FeatureCard
                icon="🎯"
                text="Real-time sentiment analysis"
                darkMode={darkMode}
              />
              <FeatureCard
                icon="📊"
                text="Advanced analytics dashboard"
                darkMode={darkMode}
              />
              <FeatureCard
                icon="🔒"
                text="Enterprise-grade security"
                darkMode={darkMode}
              />
              <FeatureCard
                icon="⚡"
                text="Lightning-fast processing"
                darkMode={darkMode}
              />
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl ${
              darkMode ? "bg-gray-800/50" : "bg-white/50"
            } backdrop-blur-sm`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  JD
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  MK
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
                  AS
                </div>
              </div>
              <span
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Join 1,000+ happy users
              </span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className="text-yellow-400 text-lg">
                  ★
                </span>
              ))}
              <span
                className={`ml-2 text-sm font-medium ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                4.9/5 rating
              </span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div
          className={`w-full max-w-md mx-auto ${
            darkMode ? "bg-gray-800/80" : "bg-white/80"
          } backdrop-blur-xl rounded-3xl shadow-2xl p-8 border ${
            darkMode ? "border-gray-700" : "border-white/50"
          }`}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
              <div
                className={`relative p-4 ${
                  darkMode ? "bg-gray-900" : "bg-white"
                } rounded-2xl shadow-lg`}
              >
                <img src={assets.logo} alt="Logo" className="h-10" />
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2
              className={`text-3xl font-bold mb-2 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Welcome Back! 👋
            </h2>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Sign in to continue your journey
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-xl flex items-center gap-3 animate-shake">
              <span className="text-xl">⚠️</span>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label
                className={`block text-sm font-semibold ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Email Address
              </label>
              <div
                className={`relative group transition-all duration-300 ${
                  focusedField === "email" ? "scale-[1.02]" : ""
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity ${
                    focusedField === "email" ? "opacity-40" : ""
                  }`}
                ></div>
                <div
                  className={`relative flex items-center border-2 rounded-xl px-4 py-3 transition-all duration-300 ${
                    darkMode
                      ? "bg-gray-900 border-gray-700"
                      : "bg-white border-gray-200"
                  } ${
                    focusedField === "email"
                      ? darkMode
                        ? "border-blue-500"
                        : "border-blue-400"
                      : ""
                  }`}
                >
                  <span className="text-xl mr-3">📧</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your email"
                    className={`flex-1 outline-none bg-transparent ${
                      darkMode
                        ? "text-white placeholder-gray-500"
                        : "text-gray-800 placeholder-gray-400"
                    }`}
                    required
                  />
                  {formData.email && (
                    <span className="text-green-500 text-lg">✓</span>
                  )}
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label
                className={`block text-sm font-semibold ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Password
              </label>
              <div
                className={`relative group transition-all duration-300 ${
                  focusedField === "password" ? "scale-[1.02]" : ""
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity ${
                    focusedField === "password" ? "opacity-40" : ""
                  }`}
                ></div>
                <div
                  className={`relative flex items-center border-2 rounded-xl px-4 py-3 transition-all duration-300 ${
                    darkMode
                      ? "bg-gray-900 border-gray-700"
                      : "bg-white border-gray-200"
                  } ${
                    focusedField === "password"
                      ? darkMode
                        ? "border-blue-500"
                        : "border-blue-400"
                      : ""
                  }`}
                >
                  <span className="text-xl mr-3">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your password"
                    className={`flex-1 outline-none bg-transparent ${
                      darkMode
                        ? "text-white placeholder-gray-500"
                        : "text-gray-800 placeholder-gray-400"
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`text-xl transition-transform hover:scale-110 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className={`text-sm font-medium transition-colors ${
                  darkMode
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-600 hover:text-blue-700"
                }`}
              >
                Forgot Password? 🔑
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-size-200 animate-gradient-x rounded-xl"></div>
              <div
                className={`relative flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                  loading
                    ? "opacity-70"
                    : "hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="text-lg group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div
              className={`flex-1 h-px ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            ></div>
            <span
              className={`text-sm ${
                darkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              or
            </span>
            <div
              className={`flex-1 h-px ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            ></div>
          </div>

          {/* Register Link */}
          <p
            className={`text-center ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-500 hover:to-purple-500 transition-all"
            >
              Create Account ✨
            </button>
          </p>

          {/* Mobile Features */}
          <div className="lg:hidden mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-3">
              <FeatureCard icon="🎯" text="AI Analysis" darkMode={darkMode} />
              <FeatureCard icon="📊" text="Analytics" darkMode={darkMode} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
