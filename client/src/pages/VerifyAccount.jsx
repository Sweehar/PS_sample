import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import { Navigate, Link } from "react-router-dom";
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
      background: "linear-gradient(135deg, #10B981, #059669)",
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
        darkMode ? "bg-emerald-600" : "bg-emerald-400"
      }`}
    />
    <div
      className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-30 animate-pulse ${
        darkMode ? "bg-teal-600" : "bg-teal-400"
      }`}
      style={{ animationDelay: "1s" }}
    />
    <div
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 ${
        darkMode ? "bg-green-600" : "bg-green-300"
      }`}
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
    <FloatingParticle
      delay="3s"
      duration="9s"
      size="14px"
      left="75%"
      top="75%"
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
          className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-300 focus:outline-none ${
            darkMode
              ? "bg-gray-900 border-gray-700 text-white focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/20"
              : "bg-white border-gray-200 text-gray-800 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/20"
          } ${
            digit
              ? darkMode
                ? "border-emerald-500"
                : "border-emerald-400"
              : ""
          }`}
        />
      ))}
    </div>
  );
};

const VerifyAccount = () => {
  const { userData, checkAuth } = useAuth();
  const { darkMode } = useTheme();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // If user is already verified in context, redirect to dashboard
  if (userData && userData.isAccountVerified) {
    return <Navigate to="/" />;
  }

  const handleSendOtp = async () => {
    if (!userData?.userId) {
      setMessage("User ID not available. Please log in again.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await authAPI.sendVerifyOtp(userData.userId);
      if (response.data.success) {
        setMessage("Verification OTP sent! Check your email 📧");
        setOtpSent(true);
        setResendTimer(60);
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setMessage("Please enter all 6 digits");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const response = await authAPI.verifyEmail({
        userId: userData.userId,
        otp,
      });
      if (response.data.success) {
        setSuccess(true);
        setMessage("Email Verified Successfully! 🎉");
        await checkAuth();
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8 ${
        darkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50"
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
        @keyframes success-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-success { animation: success-bounce 0.5s ease-in-out; }
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
                className={`absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-lg opacity-50 ${
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
                <span className="text-4xl">
                  {success ? "✅" : otpSent ? "📩" : "✉️"}
                </span>
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
              {success ? "Verified!" : "Verify Your Email"}
            </h2>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {success
                ? "Your account is now verified"
                : otpSent
                ? `Enter the 6-digit code sent to ${userData?.email}`
                : `Verify your account (${userData?.email})`}
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                success
                  ? "bg-green-500/10 border border-green-500/50 text-green-500"
                  : message.includes("sent")
                  ? "bg-blue-500/10 border border-blue-500/50 text-blue-500"
                  : "bg-red-500/10 border border-red-500/50 text-red-500 animate-shake"
              }`}
            >
              <span className="text-xl">
                {success ? "🎉" : message.includes("sent") ? "📧" : "⚠️"}
              </span>
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
              </div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300"
              >
                Go to Dashboard
                <span>→</span>
              </Link>
            </div>
          ) : !otpSent ? (
            <div className="space-y-6">
              {/* Info Card */}
              <div
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-900/50" : "bg-emerald-50"
                } border ${
                  darkMode ? "border-gray-700" : "border-emerald-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h4
                      className={`font-semibold ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      Why verify?
                    </h4>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Verification helps secure your account and enables all
                      features.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="relative w-full group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 rounded-xl"></div>
                <div
                  className={`relative flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                    loading
                      ? "opacity-70"
                      : "hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification OTP</span>
                      <span className="text-lg">📧</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              {/* OTP Input */}
              <OTPInput value={otp} onChange={setOtp} darkMode={darkMode} />

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="relative w-full group overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 rounded-xl ${
                    otp.length !== 6 ? "opacity-50" : ""
                  }`}
                ></div>
                <div
                  className={`relative flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                    loading || otp.length !== 6
                      ? "opacity-70"
                      : "hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5"
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
                      <span className="text-lg">✅</span>
                    </>
                  )}
                </div>
              </button>

              {/* Resend */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p
                    className={`${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Resend OTP in{" "}
                    <span className="font-semibold text-emerald-500">
                      {resendTimer}s
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className={`font-semibold transition-colors ${
                      darkMode
                        ? "text-emerald-400 hover:text-emerald-300"
                        : "text-emerald-600 hover:text-emerald-700"
                    }`}
                  >
                    Resend OTP 🔄
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Back Link */}
          {!success && (
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent hover:from-emerald-400 hover:to-teal-400 transition-all"
              >
                ← Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyAccount;
