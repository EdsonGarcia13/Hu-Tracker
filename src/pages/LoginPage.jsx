// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../store/authSlice";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí podrías validar credenciales contra un backend
    if (email && password) {
      dispatch(login());
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100">
      <div className="w-100" style={{ maxWidth: 420 }}>
        <div className="card p-4 shadow-sm">
          <h3 className="mb-4 text-center">Login</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                className="form-control"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="btn btn-primary w-100" type="submit">
              Entrar
            </button>
          </form>
          <div className="text-center mt-3">
            <Link to="/">Volver</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
