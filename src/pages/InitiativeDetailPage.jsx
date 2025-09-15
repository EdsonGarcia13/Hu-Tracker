import React from "react";
import { useParams, Link } from "react-router-dom";
import { initiativesMock } from "../mocks/initiativesMock";

export default function InitiativeDetailPage() {
  const { id } = useParams();
  const initiative = initiativesMock.find((ini) => ini.id === id);

  if (!initiative) return <p>Iniciativa no encontrada</p>;

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">📊 {initiative.name}</h2>
      <div className="card bg-dark text-light">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-dark table-striped table-sm align-middle">
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
                {initiative.stories.map((hu) => (
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
          </div>
          <Link to="/initiatives-overview" className="btn btn-outline-secondary mt-4">
            Volver
          </Link>
        </div>
      </div>
    </div>
  );
}
