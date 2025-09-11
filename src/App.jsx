// src/App.jsx
import React from "react";
import { Outlet, Link } from "react-router-dom";

export default function App() {
  return (
    <div>
      {/* Navbar global */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">HU Tracker</Link>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/">Historias</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/initiatives-overview">Iniciativas</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/login">Login</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Aquí se renderizan las páginas */}
      <main className="container py-4">
        <Outlet />
      </main>
    </div>
  );
}
