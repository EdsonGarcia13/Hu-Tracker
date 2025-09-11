// src/AppRouter.jsx
import React, { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";

const HUTrackerPage = lazy(() => import("./pages/HUTrackerPage"));
const InitiativesOverviewPage = lazy(() => import("./pages/InitiativesOverviewPage"));
const InitiativeDetailPage = lazy(() => import("./pages/InitiativeDetailPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <InitiativesOverviewPage /> },
      { path: "/initiatives", element: <InitiativesOverviewPage /> },
      { path: "/initiatives/:id", element: <HUTrackerPage /> },
      { path: "/login", element: <LoginPage /> },
    ],
  },
]);

export default function AppRouter() {
  return (
    <RouterProvider router={router} />
  );
}
