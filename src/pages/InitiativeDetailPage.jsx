import React from "react";
import { useParams, Link } from "react-router-dom";
import { initiativesMock } from "../mocks/initiativesMock";

export default function InitiativeDetailPage() {
  const { id } = useParams();
  const initiative = initiativesMock.find((ini) => ini.id === id);

  if (!initiative) return <p>Iniciativa no encontrada</p>;

  return (
    <div>
      <h2 className="mb-4">📊 {initiative.name}</h2>
      <div className="card shadow-sm">
        <div className="card-body">
          <table className="table table-striped align-middle">
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
          <Link to="/initiatives-overview" className="btn btn-secondary mt-3">
            Volver
          </Link>
        </div>
      </div>
    </div>
  );
}
