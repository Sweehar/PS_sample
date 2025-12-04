import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
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
      background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
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
      className={`absolute -top-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-30 animate-pulse ${
        darkMode ? "bg-purple-600" : "bg-purple-400"
      }`}
    />
    <div
      className={`absolute -bottom-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-30 animate-pulse ${
        darkMode ? "bg-pink-600" : "bg-pink-400"
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
      left="15%"
      top="25%"
    />
    <FloatingParticle
      delay="1s"
      duration="8s"
      size="8px"
      left="25%"
      top="65%"
    />
    <FloatingParticle
      delay="2s"
      duration="7s"
      size="10px"
      left="75%"
      top="35%"
    />
    <FloatingParticle
      delay="0.5s"
      duration="9s"
      size="6px"
      left="65%"
      top="75%"
    />
    <FloatingParticle
      delay="1.5s"
      duration="6s"
      size="14px"
      left="85%"
      top="15%"
    />
    <FloatingParticle delay="3s" duration="8s" size="8px" left="8%" top="85%" />
  </div>
);

// Step Indicator Component
const StepIndicator = ({ step, currentStep, label, darkMode }) => (
  <div className="flex flex-col items-center">
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${
        currentStep >= step
          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
          : darkMode
          ? "bg-gray-700 text-gray-400"
          : "bg-gray-200 text-gray-500"
      }`}
    >
      {currentStep > step ? "✓" : step}
    </div>
    <span
      className={`mt-2 text-xs font-medium ${
        darkMode ? "text-gray-400" : "text-gray-600"
      }`}
    >
      {label}
    </span>
  </div>
);

// Password Strength Component
const PasswordStrength = ({ password, darkMode }) => {
  const getStrength = () => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = getStrength();
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              strength >= level
                ? colors[strength - 1]
                : darkMode
                ? "bg-gray-700"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs ${
          strength <= 2
            ? "text-red-500"
            : strength <= 3
            ? "text-yellow-500"
            : "text-green-500"
        }`}
      >
        Password strength: {labels[strength - 1] || "Very Weak"}
      </p>
    </div>
  );
};

// Benefit Item Component
const BenefitItem = ({ icon, title, description, darkMode }) => (
  <div
    className={`flex gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
      darkMode
        ? "bg-gray-800/50 hover:bg-gray-700/50"
        : "bg-white/50 hover:bg-white/80"
    } backdrop-blur-sm`}
  >
    <div className="text-3xl">{icon}</div>
    <div>
      <h4
        className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
      >
        {title}
      </h4>
      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        {description}
      </p>
    </div>
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate current step based on filled fields
  const getCurrentStep = () => {
    if (!formData.name) return 1;
    if (!formData.email) return 2;
    if (!formData.password) return 3;
    return 4;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptTerms) {
      setError("Please accept the terms and conditions");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await authAPI.register(formData);
      if (response.data.success) {
        navigate("/verify-email", { state: { userId: response.data.userId } });
      } else {
        setError(response.data.message || "Registration failed");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "An error occurred during registration"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8 ${
        darkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50"
      }`}
    >
      {/* Add custom styles for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.4; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <AnimatedBackground darkMode={darkMode} />

      <div
        className={`w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center relative z-10 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Left Side - Branding & Benefits */}
        <div
          className={`hidden lg:flex flex-col space-y-8 p-8 ${
            darkMode ? "text-white" : "text-gray-800"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
                <span className="text-3xl">✨</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Join AI CRM Today
              </h1>
            </div>
            <p
              className={`text-lg ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Create your account and start transforming customer feedback into
              insights.
            </p>
          </div>

          <div className="space-y-4">
            <h3
              className={`text-xl font-semibold ${
                darkMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              What you'll get:
            </h3>
            <div className="grid gap-4">
              <BenefitItem
                icon="🎯"
                title="AI-Powered Analysis"
                description="Get instant sentiment analysis for all feedback"
                darkMode={darkMode}
              />
              <BenefitItem
                icon="📊"
                title="Real-time Dashboard"
                description="Monitor your metrics in beautiful visualizations"
                darkMode={darkMode}
              />
              <BenefitItem
                icon="🚀"
                title="Actionable Insights"
                description="Make data-driven decisions faster"
                darkMode={darkMode}
              />
            </div>
          </div>

          {/* Testimonial */}
          <div
            className={`p-5 rounded-2xl ${
              darkMode ? "bg-gray-800/50" : "bg-white/50"
            } backdrop-blur-sm border-l-4 border-purple-500`}
          >
            <p
              className={`italic ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              "This platform has revolutionized how we handle customer feedback.
              The AI insights are incredibly accurate!"
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                JD
              </div>
              <div>
                <p
                  className={`font-semibold ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Akkala Sweehar
                </p>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Product Manager
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
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
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
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
          <div className="text-center mb-6">
            <h2
              className={`text-3xl font-bold mb-2 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Create Account ✨
            </h2>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Start your journey with us today
            </p>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between items-center mb-8 px-4">
            <StepIndicator
              step={1}
              currentStep={getCurrentStep()}
              label="Name"
              darkMode={darkMode}
            />
            <div
              className={`flex-1 h-0.5 mx-2 ${
                getCurrentStep() > 1
                  ? "bg-gradient-to-r from-purple-500 to-pink-500"
                  : darkMode
                  ? "bg-gray-700"
                  : "bg-gray-200"
              }`}
            />
            <StepIndicator
              step={2}
              currentStep={getCurrentStep()}
              label="Email"
              darkMode={darkMode}
            />
            <div
              className={`flex-1 h-0.5 mx-2 ${
                getCurrentStep() > 2
                  ? "bg-gradient-to-r from-purple-500 to-pink-500"
                  : darkMode
                  ? "bg-gray-700"
                  : "bg-gray-200"
              }`}
            />
            <StepIndicator
              step={3}
              currentStep={getCurrentStep()}
              label="Password"
              darkMode={darkMode}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-xl flex items-center gap-3 animate-shake">
              <span className="text-xl">⚠️</span>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Input */}
            <div className="space-y-2">
              <label
                className={`block text-sm font-semibold ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Full Name
              </label>
              <div
                className={`relative group transition-all duration-300 ${
                  focusedField === "name" ? "scale-[1.02]" : ""
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity ${
                    focusedField === "name" ? "opacity-40" : ""
                  }`}
                ></div>
                <div
                  className={`relative flex items-center border-2 rounded-xl px-4 py-3 transition-all duration-300 ${
                    darkMode
                      ? "bg-gray-900 border-gray-700"
                      : "bg-white border-gray-200"
                  } ${
                    focusedField === "name"
                      ? darkMode
                        ? "border-purple-500"
                        : "border-purple-400"
                      : ""
                  }`}
                >
                  <span className="text-xl mr-3">👤</span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your full name"
                    className={`flex-1 outline-none bg-transparent ${
                      darkMode
                        ? "text-white placeholder-gray-500"
                        : "text-gray-800 placeholder-gray-400"
                    }`}
                    required
                  />
                  {formData.name && (
                    <span className="text-green-500 text-lg">✓</span>
                  )}
                </div>
              </div>
            </div>

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
                  className={`absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity ${
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
                        ? "border-purple-500"
                        : "border-purple-400"
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
                  {formData.email && formData.email.includes("@") && (
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
                  className={`absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity ${
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
                        ? "border-purple-500"
                        : "border-purple-400"
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
                    placeholder="Create a strong password"
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
              <PasswordStrength
                password={formData.password}
                darkMode={darkMode}
              />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setAcceptTerms(!acceptTerms)}
                className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-all ${
                  acceptTerms
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : darkMode
                    ? "bg-gray-700 border-2 border-gray-600"
                    : "bg-gray-100 border-2 border-gray-300"
                }`}
              >
                {acceptTerms && <span className="text-xs">✓</span>}
              </button>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                I agree to the{" "}
                <span className="text-purple-500 hover:underline cursor-pointer">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-purple-500 hover:underline cursor-pointer">
                  Privacy Policy
                </span>
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !acceptTerms}
              className="relative w-full group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-size-200 animate-gradient-x rounded-xl"></div>
              <div
                className={`relative flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                  loading || !acceptTerms
                    ? "opacity-70"
                    : "hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <span className="text-lg group-hover:translate-x-1 transition-transform">
                      🚀
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

          {/* Login Link */}
          <p
            className={`text-center ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-purple-500 hover:to-pink-500 transition-all"
            >
              Sign In 👋
            </button>
          </p>

          {/* Mobile Benefits */}
          <div className="lg:hidden mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid gap-3">
              <BenefitItem
                icon="🎯"
                title="AI Analysis"
                description="Instant insights"
                darkMode={darkMode}
              />
              <BenefitItem
                icon="📊"
                title="Dashboard"
                description="Visual metrics"
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
