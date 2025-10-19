// apps/landing/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Results from "./pages/Results";
import "./index.css";

function Dashboard() {
  // Si el login luego guarda algo (p. ej., localStorage.setItem("session","ok"))
  const sesion = typeof window !== "undefined" ? localStorage.getItem("session") : null;
  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Sesión: {sesion ?? "no iniciada (demo)"} </p>
    </main>
  );
}

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/resultados", element: <Results /> },
  { path: "/dashboard", element: <Dashboard /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
