// src/pages/LoginPage.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function LoginPage() {
  return (
    <div className="container py-5" style={{ maxWidth: 420 }}>
      <h3 className="mb-4">Login</h3>
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" placeholder="you@company.com" />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" placeholder="••••••••" />
          </div>
          <button className="btn btn-primary w-100">Entrar</button>
          <div className="text-center mt-3">
            <Link to="/">Volver</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
