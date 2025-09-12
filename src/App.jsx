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
    <div>
      {/* Top navbar */}
      <nav className="navbar navbar-expand bg-white shadow-sm fixed-top">
        <div className="container-fluid">
          {isAuthenticated && (
            <button
              className="btn btn-outline-primary d-md-none"
              onClick={toggleSidebar}
            >
              ☰
            </button>
          )}
          <Link className="navbar-brand ms-2" to="/">
            HU Tracker
          </Link>
          <div className="ms-auto">
            {isAuthenticated ? (
              <button className="btn btn-outline-secondary" onClick={handleLogout}>
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
        <aside className={`sidebar ${sidebarOpen ? "show" : ""}`}>
          <ul className="nav flex-column px-3">
            <li className="nav-item">
              <Link
                to="/"
                className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
              >
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/initiatives"
                className={`nav-link ${
                  location.pathname.startsWith("/initiatives") ? "active" : ""
                }`}
              >
                Iniciativas
              </Link>
            </li>
          </ul>
        </aside>
      )}

      {/* Main content */}
      <main
        className={`content-wrapper ${isAuthenticated ? "sidebar-active" : ""}`}
      >
        <Outlet />
      </main>
    </div>
  );
}
