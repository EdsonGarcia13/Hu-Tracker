// src/App.jsx
import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "./store/authSlice";

export default function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => dispatch(logout());
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Top navbar */}
      <nav className="fixed top-0 inset-x-0 bg-slate-800 shadow z-10">
        <div className="px-4 py-3 flex items-center">
          {isAuthenticated && (
            <button
              className="btn btn-outline md:hidden mr-2"
              onClick={toggleSidebar}
            >
              ☰
            </button>
          )}
          <Link to="/" className="font-semibold text-lg">
            HU Tracker
          </Link>
          <div className="ml-auto">
            {isAuthenticated ? (
              <button className="btn btn-outline" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <Link className="btn btn-primary" to="/login">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      {isAuthenticated && (
        <aside
          className={`fixed inset-y-0 left-0 w-56 bg-slate-800 p-4 transform transition-transform md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:static md:block`}
        >
          <nav className="space-y-2">
            <Link
              to="/"
              className={`block rounded px-3 py-2 hover:bg-slate-700 ${
                location.pathname === "/" ? "bg-slate-700" : ""
              }`}
            >
              Iniciativas
            </Link>
          </nav>
        </aside>
      )}

      {/* Main content */}
      <main className={`pt-16 p-4 ${isAuthenticated ? "md:ml-56" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
