import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../services/api";

// Star Rating Display Component
const StarDisplay = ({ rating, size = "text-xl" }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${size} ${
            star <= rating ? "text-yellow-400" : "text-gray-600"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const UserRatings = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!authLoading && user && user.role !== "admin") {
      navigate("/dashboard");
      return;
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchRatings();
    }
  }, [isAuthenticated, user]);

  const fetchRatings = async (page = 1) => {
    try {
      setLoading(true);
      const response = await adminAPI.getUserRatings(page, 10);
      if (response.data.success) {
        setRatings(response.data.ratings);
        setStats(response.data.stats);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch ratings:", err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-300">Loading User Ratings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-2xl font-bold text-yellow-400">
              ⭐ User Ratings
            </span>
            <Link
              to="/admin"
              className="text-gray-400 hover:text-blue-400 transition flex items-center gap-1"
            >
              ← Back to Admin Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Welcome, {user?.name}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {/* Average Rating Card */}
            <div className="bg-gradient-to-br from-yellow-600 to-orange-700 rounded-xl p-6 col-span-1">
              <h3 className="text-yellow-100 text-sm font-medium mb-2">
                Average Rating
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-5xl font-bold">
                  {stats.averageRating}
                </span>
                <div className="flex flex-col">
                  <StarDisplay
                    rating={Math.round(parseFloat(stats.averageRating))}
                    size="text-lg"
                  />
                  <span className="text-yellow-200 text-xs mt-1">
                    {stats.totalRatings} total ratings
                  </span>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="bg-gray-800 rounded-xl p-6 col-span-3">
              <h3 className="text-gray-300 text-sm font-medium mb-4">
                Rating Distribution
              </h3>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.distribution?.[star] || 0;
                  const percentage =
                    stats.totalRatings > 0
                      ? ((count / stats.totalRatings) * 100).toFixed(0)
                      : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-sm w-16 text-gray-400">
                        {star} stars
                      </span>
                      <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-4 rounded-full transition-all duration-500 ${
                            star === 5
                              ? "bg-green-500"
                              : star === 4
                              ? "bg-lime-500"
                              : star === 3
                              ? "bg-yellow-500"
                              : star === 2
                              ? "bg-orange-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm w-20 text-right text-gray-300">
                        {count} ({percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Ratings List */}
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              📋 All User Ratings
              <span className="text-sm font-normal text-gray-400">
                ({pagination.total} total)
              </span>
            </h2>
          </div>

          {ratings.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <span className="text-6xl mb-4 block">⭐</span>
              <p className="text-lg">No ratings yet</p>
              <p className="text-sm mt-2">
                Users haven't submitted any ratings.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {ratings.map((item) => (
                <div
                  key={item._id}
                  className="p-6 hover:bg-gray-750 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg font-bold">
                        {item.name?.charAt(0).toUpperCase()}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">
                            {item.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              item.role === "admin"
                                ? "bg-red-900 text-red-300"
                                : item.role === "manager"
                                ? "bg-blue-900 text-blue-300"
                                : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {item.role}
                          </span>
                          {item.isAccountVerified && (
                            <span className="text-green-400 text-xs">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">{item.email}</p>

                        {/* Rating */}
                        <div className="flex items-center gap-3 mt-2">
                          <StarDisplay
                            rating={item.platformRating?.rating}
                            size="text-xl"
                          />
                          <span className="text-lg font-bold text-yellow-400">
                            {item.platformRating?.rating}/5
                          </span>
                        </div>

                        {/* Message */}
                        {item.platformRating?.message && (
                          <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                            <p className="text-gray-300 text-sm italic">
                              "{item.platformRating.message}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-right text-sm text-gray-500">
                      <p>Submitted</p>
                      <p className="text-gray-400">
                        {new Date(
                          item.platformRating?.updatedAt ||
                            item.platformRating?.createdAt
                        ).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(
                          item.platformRating?.updatedAt ||
                            item.platformRating?.createdAt
                        ).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="p-4 border-t border-gray-700 flex items-center justify-center gap-4">
              <button
                onClick={() => fetchRatings(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Previous
              </button>
              <span className="text-gray-400">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => fetchRatings(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserRatings;
