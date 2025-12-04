import React, { useState, useEffect, useRef } from "react";
import { authAPI } from "../services/api";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
      background: "linear-gradient(135deg, #8B5CF6, #6366F1)",
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
        darkMode ? "bg-violet-600" : "bg-violet-400"
      }`}
    />
    <div
      className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-30 animate-pulse ${
        darkMode ? "bg-indigo-600" : "bg-indigo-400"
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

// OTP Input Box Component
const OTPInput = ({ value, onChange, darkMode }) => {
  const inputRefs = useRef([]);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);

  useEffect(() => {
    onChange(digits.join(""));
  }, [digits, onChange]);

  const handleChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...digits];
    newDigits[index] = val.slice(-1);
    setDigits(newDigits);
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newDigits = pastedData
        .split("")
        .concat(Array(6).fill(""))
        .slice(0, 6);
      setDigits(newDigits);
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={`w-10 h-12 sm:w-11 sm:h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-300 focus:outline-none ${
            darkMode
              ? "bg-gray-900 border-gray-700 text-white focus:border-violet-500 focus:shadow-lg focus:shadow-violet-500/20"
              : "bg-white border-gray-200 text-gray-800 focus:border-violet-500 focus:shadow-lg focus:shadow-violet-500/20"
          } ${
            digit ? (darkMode ? "border-violet-500" : "border-violet-400") : ""
          }`}
        />
      ))}
    </div>
  );
};

// Password Strength Indicator
const PasswordStrength = ({ password, darkMode }) => {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
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
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= strength
                ? colors[strength - 1]
                : darkMode
                ? "bg-gray-700"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        Strength:{" "}
        <span
          className={
            strength >= 4
              ? "text-green-500"
              : strength >= 2
              ? "text-yellow-500"
              : "text-red-500"
          }
        >
          {labels[strength - 1] || "Very Weak"}
        </span>
      </p>
    </div>
  );
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword({ email, otp, newPassword });
      if (response.data.success) {
        setSuccess(true);
        setMessage("Password reset successful! 🎉");
        setTimeout(() => navigate("/login"), 2500);
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8 ${
        darkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50"
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
        @keyframes success-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-success { animation: success-scale 0.5s ease-in-out; }
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
              <div
                className={`absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-2xl blur-lg opacity-50 ${
                  success ? "animate-pulse" : ""
                }`}
              ></div>
              <div
                className={`relative w-20 h-20 ${
                  darkMode ? "bg-gray-900" : "bg-white"
                } rounded-2xl shadow-lg flex items-center justify-center ${
                  success ? "animate-success" : ""
                }`}
              >
                <span className="text-4xl">{success ? "🎉" : "🔑"}</span>
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
              {success ? "Password Reset!" : "Reset Password"}
            </h2>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {success
                ? "Redirecting to login..."
                : "Enter your OTP and create a new password"}
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

          {success ? (
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                  <svg
                    className="w-8 h-8 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p
                  className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Your password has been updated successfully.
                </p>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 animate-[progress_2.5s_linear]"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>
          ) : (
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
                    className={`absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity ${
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
                          ? "border-violet-500"
                          : "border-violet-400"
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
                  </div>
                </div>
              </div>

              {/* OTP Input */}
              <div className="space-y-2">
                <label
                  className={`block text-sm font-semibold text-center ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Enter 6-Digit OTP
                </label>
                <OTPInput value={otp} onChange={setOtp} darkMode={darkMode} />
              </div>

              {/* New Password Input */}
              <div className="space-y-2">
                <label
                  className={`block text-sm font-semibold ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  New Password
                </label>
                <div
                  className={`relative group transition-all duration-300 ${
                    focusedField === "password" ? "scale-[1.02]" : ""
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity ${
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
                          ? "border-violet-500"
                          : "border-violet-400"
                        : ""
                    }`}
                  >
                    <span className="text-xl mr-3">🔒</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Create new password"
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
                      className={`ml-2 text-lg transition-transform hover:scale-110 ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <PasswordStrength password={newPassword} darkMode={darkMode} />
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label
                  className={`block text-sm font-semibold ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Confirm Password
                </label>
                <div
                  className={`relative group transition-all duration-300 ${
                    focusedField === "confirm" ? "scale-[1.02]" : ""
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity ${
                      focusedField === "confirm" ? "opacity-40" : ""
                    }`}
                  ></div>
                  <div
                    className={`relative flex items-center border-2 rounded-xl px-4 py-3 transition-all duration-300 ${
                      darkMode
                        ? "bg-gray-900 border-gray-700"
                        : "bg-white border-gray-200"
                    } ${
                      focusedField === "confirm"
                        ? darkMode
                          ? "border-violet-500"
                          : "border-violet-400"
                        : ""
                    }`}
                  >
                    <span className="text-xl mr-3">🔐</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField("confirm")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Confirm new password"
                      className={`flex-1 outline-none bg-transparent ${
                        darkMode
                          ? "text-white placeholder-gray-500"
                          : "text-gray-800 placeholder-gray-400"
                      }`}
                      required
                    />
                    {confirmPassword && (
                      <span
                        className={`text-lg ${
                          confirmPassword === newPassword && newPassword
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {confirmPassword === newPassword && newPassword
                          ? "✓"
                          : "✗"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="relative w-full group overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-xl ${
                    otp.length !== 6 ? "opacity-50" : ""
                  }`}
                ></div>
                <div
                  className={`relative flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                    loading || otp.length !== 6
                      ? "opacity-70"
                      : "hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Resetting Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <span className="text-lg group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </>
                  )}
                </div>
              </button>
            </form>
          )}

          {/* Links */}
          {!success && (
            <div className="mt-6 space-y-3 text-center">
              <Link
                to="/forget-password"
                className={`block font-medium transition-colors ${
                  darkMode
                    ? "text-violet-400 hover:text-violet-300"
                    : "text-violet-600 hover:text-violet-700"
                }`}
              >
                Need a new OTP? 🔑
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
                className="font-semibold bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent hover:from-violet-400 hover:to-indigo-400 transition-all"
              >
                Back to Login 👋
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
