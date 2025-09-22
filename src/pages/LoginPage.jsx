// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAuthError, setSession } from "../store/authSlice";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!email || !password) {
      setFormError("Ingresa tu correo y contraseña.");
      return;
    }

    if (!supabase || !isSupabaseConfigured) {
      const message =
        "Supabase no está configurado. Solicita al administrador las claves de acceso.";
      setFormError(message);
      dispatch(setAuthError(message));
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setFormError(error.message);
        dispatch(setAuthError(error.message));
        return;
      }

      dispatch(setAuthError(null));

      if (data?.user) {
        dispatch(setSession(data.user));
      }

      navigate("/", { replace: true });
    } catch (err) {
      setFormError(err.message);
      dispatch(setAuthError(err.message));
    } finally {
      setLoading(false);
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
                autoComplete="username"
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
                autoComplete="current-password"
              />
            </div>
            {formError && (
              <div className="alert alert-danger" role="alert">
                {formError}
              </div>
            )}
            <button className="btn btn-primary w-100" type="submit" disabled={loading}>
              {loading ? "Ingresando..." : "Entrar"}
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
