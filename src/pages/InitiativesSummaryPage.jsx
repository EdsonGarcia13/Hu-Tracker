// src/pages/InitiativesSummaryPage.jsx
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

export default function InitiativesSummaryPage() {
  const { items } = useSelector((s) => s.hu);

  const summary = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      const key = it.Initiative || "General";
      const acc = map.get(key) || {
        initiative: key,
        original: 0,
        completed: 0,
        remaining: 0,
        stories: 0,
      };
      acc.original += Number(it["Original Estimate"]) || 0;
      acc.completed += Number(it["Completed Work"]) || 0;
      acc.remaining += Number(it["Remaining Work"]) || 0;
      acc.stories += 1;
      map.set(key, acc);
    });
    return Array.from(map.values());
  }, [items]);

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="m-0">📈 Resumen por Iniciativa</h2>
        <nav>
          <Link to="/" className="btn btn-outline-secondary">Volver a HU</Link>
        </nav>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">Totales</h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Initiative</th>
                  <th>Stories</th>
                  <th>Original (hrs)</th>
                  <th>Completed (hrs)</th>
                  <th>Remaining (hrs)</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row) => (
                  <tr key={row.initiative}>
                    <td className="fw-semibold">{row.initiative}</td>
                    <td>{row.stories}</td>
                    <td>{row.original}</td>
                    <td>{row.completed}</td>
                    <td>{row.remaining}</td>
                  </tr>
                ))}
                {summary.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">Sin datos aún. Carga un Excel o crea HU.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
