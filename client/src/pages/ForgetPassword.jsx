import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { useTheme } from "../context/ThemeContext";

// Floating Particle Component
const FloatingParticle = ({ delay, duration, size, left, top }) => (
  <div
    className="absolute rounded-full opacity-20 animate-float pointer-events-none"
    style={{
      width: size,
      height: size,
      left: left,
      top: top,
      background: "linear-gradient(135deg, #F59E0B, #EF4444)",
      animationDelay: delay,
      animationDuration: duration,
    }}
  />
);

// Animated Background Component
const AnimatedBackground = ({ darkMode }) => (
  <div className="absolute inset-0 overflow-hidden">
    <div
      className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-30 animate-pulse ${
        darkMode ? "bg-orange-600" : "bg-orange-400"
      }`}
    />
    <div
      className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-30 animate-pulse ${
        darkMode ? "bg-amber-600" : "bg-amber-400"
      }`}
      style={{ animationDelay: "1s" }}
    />
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
      left="80%"
      top="30%"
    />
    <FloatingParticle
      delay="2s"
      duration="7s"
      size="10px"
      left="20%"
      top="70%"
    />
  </div>
);

const ForgetPassword = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await authAPI.sendResetOtp(email);
      if (response.data.success) {
        setMessage("OTP sent successfully! Check your email 📧");
        setSuccess(true);
        setTimeout(
          () => navigate("/reset-password", { state: { email } }),
          2000
        );
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8 ${
        darkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50"
      }`}
    >
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
      `}</style>

      <AnimatedBackground darkMode={darkMode} />

      <div
        className={`w-full max-w-md mx-auto relative z-10 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div
          className={`${
            darkMode ? "bg-gray-800/80" : "bg-white/80"
          } backdrop-blur-xl rounded-3xl shadow-2xl p-8 border ${
            darkMode ? "border-gray-700" : "border-white/50"
          }`}
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
              <div
                className={`relative w-20 h-20 ${
                  darkMode ? "bg-gray-900" : "bg-white"
                } rounded-2xl shadow-lg flex items-center justify-center`}
              >
                <span className="text-4xl">🔐</span>
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
              Forgot Password?
            </h2>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Enter your email to receive a password reset OTP
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                success
                  ? "bg-green-500/10 border border-green-500/50 text-green-500"
                  : "bg-red-500/10 border border-red-500/50 text-red-500 animate-shake"
              }`}
            >
              <span className="text-xl">{success ? "✨" : "⚠️"}</span>
              <span className="font-medium">{message}</span>
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
                  className={`absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity ${
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
                        ? "border-orange-500"
                        : "border-orange-400"
                      : ""
                  }`}
                >
                  <span className="text-xl mr-3">📧</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  {email && email.includes("@") && (
                    <span className="text-green-500 text-lg">✓</span>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 rounded-xl"></div>
              <div
                className={`relative flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                  loading
                    ? "opacity-70"
                    : "hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send OTP</span>
                    <span className="text-lg group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 space-y-3 text-center">
            <Link
              to="/reset-password"
              className={`block font-medium transition-colors ${
                darkMode
                  ? "text-orange-400 hover:text-orange-300"
                  : "text-orange-600 hover:text-orange-700"
              }`}
            >
              I already have an OTP 🔑
            </Link>
            <div className="flex items-center gap-4">
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
            <Link
              to="/login"
              className="font-semibold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent hover:from-orange-400 hover:to-amber-400 transition-all"
            >
              Back to Login 👋
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;
