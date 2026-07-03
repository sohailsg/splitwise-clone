import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Error signing out:", err);
      navigate("/login");
    }
  };

  const isActive = (path) => location.pathname === path;

  const primaryItems = [
    { to: "/", label: "Dashboard", icon: "📊" },
    { to: "/friends", label: "Friends", icon: "👥" },
    { to: "/groups", label: "Groups", icon: "🏠" },
    { to: "/settlements", label: "Settle", icon: "💰" },
  ];

  const toolItems = [
    { to: "/history", label: "History", icon: "📋" },
    { to: "/minimizer", label: "Minimizer", icon: "⚡" },
    { to: "/scan", label: "Scan", icon: "📷" },
    { to: "/charts", label: "Charts", icon: "📈" },
    { to: "/ai", label: "AI", icon: "🤖" },
    { to: "/feedback", label: "Feedback", icon: "💬" },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-3">
        <div className="flex justify-between h-12">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-base font-bold text-green-600">
              Splitwise
            </Link>
            <div className="hidden md:flex items-center space-x-0.5 overflow-x-auto">
              {primaryItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                    isActive(item.to)
                      ? "bg-green-50 text-green-700"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="mr-0.5">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <span className="text-gray-200 mx-1">|</span>
              {toolItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                    isActive(item.to)
                      ? "bg-green-50 text-green-700"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="mr-0.5">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-gray-400 hidden sm:block max-w-[120px] truncate">
              {currentUser?.email}
            </span>
            <button
              onClick={handleLogout}
              className="bg-green-500 text-white px-2.5 py-1 rounded text-[11px] font-medium hover:bg-green-600 transition-colors"
            >
              Logout
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1 rounded text-gray-500 hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-3 pb-2 pt-1">
          <p className="text-[10px] text-gray-400 px-2 py-1 uppercase">Main</p>
          {primaryItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium ${
                isActive(item.to)
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <p className="text-[10px] text-gray-400 px-2 py-1 mt-1 uppercase">Tools</p>
          {toolItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium ${
                isActive(item.to)
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
