import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { initiativesMock } from "../mocks/initiativesMock";

export default function InitiativeDetailPage() {
  const { id } = useParams();
  const initiative = initiativesMock.find((ini) => ini.id === id);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const stories = initiative?.stories || [];
  const totalPages = Math.ceil(stories.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const paginated = stories.slice(start, start + itemsPerPage);

  if (!initiative) return <p>Iniciativa no encontrada</p>;

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">📊 {initiative.name}</h2>
      <div className="card bg-white text-dark">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-sm align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Original Estimate</th>
                  <th>Completed</th>
                  <th>Remaining</th>
                  <th>Start Date</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((hu) => (
                  <tr key={hu.id}>
                    <td>{hu.Title}</td>
                    <td>{hu.State}</td>
                    <td>{hu["Original Estimate"]}</td>
                    <td>{hu["Completed Work"]}</td>
                    <td>{hu["Remaining Work"]}</td>
                    <td>{hu["Start Date"]}</td>
                    <td>{hu["Due Date"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <nav className="mt-3">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Anterior
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <li
                      key={i}
                      className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li
                    className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
          <Link to="/initiatives-overview" className="btn btn-outline-secondary mt-4">
            Volver
          </Link>
        </div>
      </div>
    </div>
  );
}
