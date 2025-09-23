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
    <div className="app-background text-dark min-vh-100">
      {/* Top navbar */}
      <nav className="navbar navbar-light bg-white border-bottom shadow fixed-top">
        <div className="container-fluid">
          {isAuthenticated && (
            <button
              className="btn btn-outline-secondary d-md-none me-2"
              onClick={toggleSidebar}
            >
              ☰
            </button>
          )}
          <Link to="/" className="navbar-brand fw-semibold">
            HU Tracker
          </Link>
          <div className="ms-auto">
            {isAuthenticated ? (
              <button
                className="btn btn-outline-secondary"
                onClick={handleLogout}
              >
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
          className={`sidebar ${sidebarOpen ? "" : "d-none"} d-md-block bg-white`}
        >
          <nav className="nav flex-column">
            <Link
              to="/"
              className={`nav-link text-dark ${
                location.pathname === "/" ||
                location.pathname.startsWith("/initiatives")
                  ? "active"
                  : ""
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              Iniciativas
            </Link>
            <Link
              to="/contacts"
              className={`nav-link text-dark ${
                location.pathname.startsWith("/contacts") ? "active" : ""
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              Contactos
            </Link>
          </nav>
        </aside>
      )}

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
