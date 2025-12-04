import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authAPI, userAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { assets } from "../assets";
import Cookie from "js-cookie";

// Floating Particle Component
const FloatingParticle = ({ delay, duration, size, left, top }) => (
  <div
    className="absolute rounded-full opacity-20 animate-float pointer-events-none"
    style={{
      width: size,
      height: size,
      left: left,
      top: top,
      background: "linear-gradient(135deg, #10B981, #3B82F6)",
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
        darkMode ? "bg-green-600" : "bg-green-400"
      }`}
    />
    <div
      className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-30 animate-pulse ${
        darkMode ? "bg-blue-600" : "bg-blue-400"
      }`}
      style={{ animationDelay: "1s" }}
    />
    <div
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse ${
        darkMode ? "bg-teal-600" : "bg-teal-400"
      }`}
      style={{ animationDelay: "2s" }}
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
  </div>
);

// OTP Input Component
const OTPInput = ({ value, onChange, darkMode }) => {
  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 1) {
      const newOtp = value.split("");
      newOtp[index] = val;
      onChange(newOtp.join(""));

      if (val && index < 5) {
        const nextInput = document.getElementById(`verify-otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      const prevInput = document.getElementById(`verify-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    onChange(pastedData);
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          id={`verify-otp-${index}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 outline-none transition-all duration-300 ${
            darkMode
              ? "bg-gray-900 border-gray-700 text-white focus:border-green-500"
              : "bg-white border-gray-200 text-gray-800 focus:border-green-400"
          } focus:scale-110 focus:shadow-lg focus:shadow-green-500/20`}
        />
      ))}
    </div>
  );
};

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { darkMode } = useTheme();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const userId = location.state?.userId;

  useEffect(() => {
    setMounted(true);
    if (!userId) {
      navigate("/register");
    }
  }, [userId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authAPI.verifyEmail(userId, otp);
      if (response.data.success) {
        setSuccessMessage("Email verified successfully! 🎉");
        Cookie.set("userId", userId, { expires: 7 });
        const userData = await userAPI.getUserData(userId);
        if (userData.data.success) {
          updateUser(userData.data.userData);
        }
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        setError(response.data.message || "Verification failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    setTimer(60);

    try {
      const response = await authAPI.sendVerifyOtp(userId);
      if (response.data.success) {
        setSuccessMessage("OTP resent successfully! 📧");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(response.data.message || "Failed to resend OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  return (
    <div
      className={`min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8 ${
        darkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-green-50 via-teal-50 to-blue-50"
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
        @keyframes bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
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
          {/* Animated Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
              <div
                className={`relative w-24 h-24 ${
                  darkMode ? "bg-gray-900" : "bg-white"
                } rounded-2xl shadow-lg flex items-center justify-center animate-bounce-in`}
              >
                <span className="text-5xl">📧</span>
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
              Verify Your Email ✉️
            </h2>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              We've sent a 6-digit code to your email
            </p>
            <p
              className={`mt-2 text-sm font-medium ${
                darkMode ? "text-green-400" : "text-green-600"
              }`}
            >
              Check your inbox and spam folder
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 text-green-500 rounded-xl flex items-center gap-3 justify-center animate-bounce-in">
              <span className="text-xl">✨</span>
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-xl flex items-center gap-3 animate-shake">
              <span className="text-xl">⚠️</span>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div className="space-y-4">
              <label
                className={`block text-sm font-semibold text-center ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Enter Verification Code
              </label>
              <OTPInput value={otp} onChange={setOtp} darkMode={darkMode} />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="relative w-full group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-teal-500 to-green-500 rounded-xl"></div>
              <div
                className={`relative flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                  loading || otp.length !== 6
                    ? "opacity-70"
                    : "hover:shadow-lg hover:shadow-green-500/30 hover:-translate-y-0.5"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Email</span>
                    <span className="text-lg group-hover:scale-110 transition-transform">
                      ✓
                    </span>
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Resend OTP Section */}
          <div
            className={`mt-8 p-4 rounded-xl text-center ${
              darkMode ? "bg-gray-900/50" : "bg-gray-50"
            }`}
          >
            <p
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendOtp}
              disabled={timer > 0 || loading}
              className={`mt-2 font-semibold transition-all ${
                timer > 0 || loading
                  ? darkMode
                    ? "text-gray-600"
                    : "text-gray-400"
                  : "bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent hover:from-green-400 hover:to-teal-400"
              }`}
            >
              {timer > 0 ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                    {timer}
                  </span>
                  <span>seconds to resend</span>
                </span>
              ) : (
                "Resend Code 📨"
              )}
            </button>
          </div>

          {/* Help Text */}
          <div
            className={`mt-6 text-center text-sm ${
              darkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            <p>
              Having trouble?{" "}
              <span className="text-green-500 cursor-pointer hover:underline">
                Contact Support
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
