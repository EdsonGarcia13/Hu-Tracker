// src/AppRouter.jsx
import React, { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import ProtectedRoute from "./components/ProtectedRoute";

const HUTrackerPage = lazy(() => import("./pages/HUTrackerPage"));
const InitiativesOverviewPage = lazy(() => import("./pages/InitiativesOverviewPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/login", element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <InitiativesOverviewPage /> },
          { path: "initiatives", element: <InitiativesOverviewPage /> },
          { path: "initiatives/:id", element: <HUTrackerPage /> },
        ],
      },
    ],
  },
]);

export default function AppRouter() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
