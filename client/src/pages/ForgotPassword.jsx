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
        darkMode ? "bg-red-600" : "bg-red-400"
      }`}
      style={{ animationDelay: "1s" }}
    />
    <div
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse ${
        darkMode ? "bg-yellow-600" : "bg-yellow-400"
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

// Step Indicator Component
const StepIndicator = ({ step, currentStep, icon, label, darkMode }) => (
  <div className="flex flex-col items-center">
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-500 ${
        currentStep >= step
          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30"
          : darkMode
          ? "bg-gray-700 text-gray-400"
          : "bg-gray-200 text-gray-500"
      }`}
    >
      {currentStep > step ? "✓" : icon}
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

// OTP Input Component
const OTPInput = ({ value, onChange, darkMode }) => {
  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 1) {
      const newOtp = value.split("");
      newOtp[index] = val;
      onChange(newOtp.join(""));

      // Auto-focus next input
      if (val && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
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
    <div className="flex justify-center gap-2">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          id={`otp-${index}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all duration-300 ${
            darkMode
              ? "bg-gray-900 border-gray-700 text-white focus:border-orange-500"
              : "bg-white border-gray-200 text-gray-800 focus:border-orange-400"
          } focus:scale-110 focus:shadow-lg`}
        />
      ))}
    </div>
  );
};

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

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authAPI.sendResetOtp(formData.email);
      if (response.data.success) {
        setSuccessMessage("OTP sent to your email! 📧");
        setTimeout(() => {
          setSuccessMessage("");
          setStep(2);
        }, 1500);
      } else {
        setError(response.data.message || "Failed to send OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (formData.otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.resetPassword(
        formData.email,
        formData.otp,
        formData.newPassword
      );
      if (response.data.success) {
        setSuccessMessage("Password reset successful! 🎉");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(response.data.message || "Failed to reset password");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8 ${
        darkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50"
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
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
              <div
                className={`relative w-20 h-20 ${
                  darkMode ? "bg-gray-900" : "bg-white"
                } rounded-2xl shadow-lg flex items-center justify-center`}
              >
                <span className="text-4xl">
                  {step === 1 ? "🔑" : step === 2 ? "📱" : "🔒"}
                </span>
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
              {step === 1
                ? "Forgot Password?"
                : step === 2
                ? "Enter OTP"
                : "New Password"}
            </h2>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {step === 1
                ? "No worries, we'll help you reset it"
                : step === 2
                ? "Check your email for the code"
                : "Create a strong password"}
            </p>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between items-center mb-8 px-4">
            <StepIndicator
              step={1}
              currentStep={step}
              icon="📧"
              label="Email"
              darkMode={darkMode}
            />
            <div
              className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${
                step > 1
                  ? "bg-gradient-to-r from-orange-500 to-red-500"
                  : darkMode
                  ? "bg-gray-700"
                  : "bg-gray-200"
              }`}
            />
            <StepIndicator
              step={2}
              currentStep={step}
              icon="📱"
              label="Verify"
              darkMode={darkMode}
            />
            <div
              className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${
                step > 2
                  ? "bg-gradient-to-r from-orange-500 to-red-500"
                  : darkMode
                  ? "bg-gray-700"
                  : "bg-gray-200"
              }`}
            />
            <StepIndicator
              step={3}
              currentStep={step}
              icon="🔒"
              label="Reset"
              darkMode={darkMode}
            />
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 text-green-500 rounded-xl flex items-center gap-3 justify-center">
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

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
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
                    className={`absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity ${
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

              <button
                type="submit"
                disabled={loading}
                className="relative w-full group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 rounded-xl"></div>
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
                      <span>Send Reset Code</span>
                      <span className="text-lg group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </>
                  )}
                </div>
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <label
                  className={`block text-sm font-semibold text-center ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Enter 6-digit OTP
                </label>
                <OTPInput
                  value={formData.otp}
                  onChange={(otp) => setFormData((prev) => ({ ...prev, otp }))}
                  darkMode={darkMode}
                />
                <p
                  className={`text-center text-sm ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Sent to {formData.email}
                </p>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={formData.otp.length !== 6}
                className="relative w-full group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 rounded-xl"></div>
                <div
                  className={`relative flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                    formData.otp.length !== 6
                      ? "opacity-70"
                      : "hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5"
                  }`}
                >
                  <span>Verify OTP</span>
                  <span className="text-lg group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </button>

              <button
                onClick={() => setStep(1)}
                className={`w-full py-2 font-medium transition-colors ${
                  darkMode
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                ← Back to Email
              </button>
            </div>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
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
                    focusedField === "newPassword" ? "scale-[1.02]" : ""
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity ${
                      focusedField === "newPassword" ? "opacity-40" : ""
                    }`}
                  ></div>
                  <div
                    className={`relative flex items-center border-2 rounded-xl px-4 py-3 transition-all duration-300 ${
                      darkMode
                        ? "bg-gray-900 border-gray-700"
                        : "bg-white border-gray-200"
                    } ${
                      focusedField === "newPassword"
                        ? darkMode
                          ? "border-orange-500"
                          : "border-orange-400"
                        : ""
                    }`}
                  >
                    <span className="text-xl mr-3">🔒</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("newPassword")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter new password"
                      className={`flex-1 outline-none bg-transparent ${
                        darkMode
                          ? "text-white placeholder-gray-500"
                          : "text-gray-800 placeholder-gray-400"
                      }`}
                      required
                    />
                  </div>
                </div>
                <PasswordStrength
                  password={formData.newPassword}
                  darkMode={darkMode}
                />
              </div>

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
                    focusedField === "confirmPassword" ? "scale-[1.02]" : ""
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity ${
                      focusedField === "confirmPassword" ? "opacity-40" : ""
                    }`}
                  ></div>
                  <div
                    className={`relative flex items-center border-2 rounded-xl px-4 py-3 transition-all duration-300 ${
                      darkMode
                        ? "bg-gray-900 border-gray-700"
                        : "bg-white border-gray-200"
                    } ${
                      focusedField === "confirmPassword"
                        ? darkMode
                          ? "border-orange-500"
                          : "border-orange-400"
                        : ""
                    }`}
                  >
                    <span className="text-xl mr-3">🔐</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Confirm your password"
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
                {formData.confirmPassword &&
                  formData.newPassword !== formData.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      Passwords do not match
                    </p>
                  )}
                {formData.confirmPassword &&
                  formData.newPassword === formData.confirmPassword && (
                    <p className="text-green-500 text-xs mt-1 flex items-center gap-1">
                      ✓ Passwords match
                    </p>
                  )}
              </div>

              <button
                type="submit"
                disabled={
                  loading || formData.newPassword !== formData.confirmPassword
                }
                className="relative w-full group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 rounded-xl"></div>
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
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <span className="text-lg">🔐</span>
                    </>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className={`w-full py-2 font-medium transition-colors ${
                  darkMode
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                ← Back to OTP
              </button>
            </form>
          )}

          {/* Login Link */}
          <div className="flex items-center gap-4 mt-6">
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

          <p
            className={`text-center mt-4 ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Remember your password?{" "}
            <button
              onClick={() => navigate("/login")}
              className="font-semibold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent hover:from-orange-400 hover:to-red-400 transition-all"
            >
              Sign In 👋
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
