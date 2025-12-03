import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { assets } from "../assets";

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const { darkMode } = useTheme();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-blue-50 to-indigo-100"}`}>
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-blue-50 to-indigo-100"}`}>
      {/* Navigation */}
      <nav className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white"} shadow-md sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img src={assets.logo} alt="Logo" className="h-10" />
            <span className="ml-2 text-xl font-bold text-gray-800">
              AI CRM Feedback
            </span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/login")}
              className="text-gray-700 font-semibold hover:text-blue-600 transition"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition"
            >
              Register
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold text-gray-800 mb-6">
              Enterprise Feedback Management
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Collect, analyze, and act on customer feedback with AI-powered
              insights. Transform customer feedback into actionable business
              intelligence.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate("/register")}
                className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Get Started
              </button>
              <button
                onClick={() => navigate("/login")}
                className="border-2 border-blue-600 text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-blue-50 transition duration-200"
              >
                Login
              </button>
            </div>
          </div>
          <div className="flex justify-center">
            <img
              src={assets.header_img}
              alt="Header"
              className="max-w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
            Powerful Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureHighlight
              icon="🔐"
              title="Secure Authentication"
              description="Industry-leading security with JWT tokens and encrypted passwords"
            />
            <FeatureHighlight
              icon="📧"
              title="Email Verification"
              description="Confirm user identity with OTP-based email verification"
            />
            <FeatureHighlight
              icon="🔑"
              title="Password Management"
              description="Secure password reset with email OTP verification"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-lg mb-8">
            Join thousands of businesses managing feedback effectively
          </p>
          <button
            onClick={() => navigate("/register")}
            className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition duration-200"
          >
            Create Account Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>&copy; 2025 AI CRM Feedback. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureHighlight = ({ icon, title, description }) => (
  <div className="text-center">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default Home;
