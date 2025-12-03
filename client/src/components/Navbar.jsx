import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { assets } from "../assets/index.js";

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`${darkMode ? "bg-gray-800 shadow-lg" : "bg-white shadow-md"}`}>
      <div className={`max-w-7xl mx-auto px-6 py-4 flex items-center justify-between ${darkMode ? "text-white" : ""}`}>
        <div
          className="flex items-center cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <img src={assets.logo} alt="Logo" className="h-10" />
          <span className="ml-3 text-xl font-bold text-gray-800">
            AI CRM Feedback
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1">
            <NavButton
              to="/dashboard"
              label="Dashboard"
              isActive={isActive("/dashboard")}
              navigate={navigate}
              darkMode={darkMode}
            />
            <NavButton
              to="/analytics"
              label="Analytics"
              isActive={isActive("/analytics")}
              navigate={navigate}
              darkMode={darkMode}
            />
            <NavButton
              to="/feedback"
              label="Feedback"
              isActive={isActive("/feedback")}
              navigate={navigate}
              darkMode={darkMode}
            />
            {user?.role === "admin" && (
              <NavButton
                to="/users"
                label="Users"
                isActive={isActive("/users")}
                navigate={navigate}
                darkMode={darkMode}
              />
            )}
            <NavButton
              to="/settings"
              label="Settings"
              isActive={isActive("/settings")}
              navigate={navigate}
              darkMode={darkMode}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className={`px-3 py-2 rounded-lg transition ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <div className="hidden sm:flex items-center">
              <div className={`w-8 h-8 ${darkMode ? "bg-blue-500" : "bg-blue-600"} rounded-full flex items-center justify-center`}>
                <span className="text-sm font-semibold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className={`ml-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                {user?.name}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-200 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavButton = ({ to, label, isActive, navigate, darkMode }) => (
  <button
    onClick={() => navigate(to)}
    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? darkMode
          ? "bg-blue-900 text-blue-300"
          : "bg-blue-100 text-blue-700"
        : darkMode
        ? "text-gray-400 hover:bg-gray-700"
        : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    {label}
  </button>
);

export default Navbar;
