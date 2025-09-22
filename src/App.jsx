// src/App.jsx
import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  clearSession,
  setAuthError,
  setSession,
  startAuthChecking,
} from "./store/authSlice";
import { supabase, isSupabaseConfigured } from "./lib/supabaseClient";

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, status, error, user } = useSelector((s) => s.auth);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!supabase || !isSupabaseConfigured) {
      dispatch(clearSession());
      if (!isSupabaseConfigured) {
        dispatch(
          setAuthError(
            "Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para habilitar el backend."
          )
        );
      }
      return () => {
        isMounted = false;
      };
    }

    dispatch(startAuthChecking());

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!isMounted) return;
        if (sessionError) {
          dispatch(setAuthError(sessionError.message));
          dispatch(clearSession());
          return;
        }
        if (data?.session?.user) {
          dispatch(setSession(data.session.user));
        } else {
          dispatch(clearSession());
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        dispatch(setAuthError(err.message));
        dispatch(clearSession());
      });

    const {
      data: listener,
      error: listenerError,
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        dispatch(setSession(session.user));
      } else {
        dispatch(clearSession());
      }
    });

    if (listenerError) {
      dispatch(setAuthError(listenerError.message));
    }

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [dispatch]);

  const handleLogout = async () => {
    if (supabase && isSupabaseConfigured) {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        dispatch(setAuthError(signOutError.message));
        return;
      }
    }
    dispatch(clearSession());
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="bg-light text-dark min-vh-100">
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
          <div className="ms-auto d-flex align-items-center gap-3">
            {user?.email && (
              <span className="text-muted small d-none d-md-inline">
                {user.email}
              </span>
            )}
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
        {status === "checking" && (
          <div className="alert alert-info" role="status">
            Verificando sesión...
          </div>
        )}
        {error && (
          <div className="alert alert-warning" role="alert">
            {error}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
