import React from "react";
import { useParams, Link } from "react-router-dom";
import { initiativesMock } from "../mocks/initiativesMock";

export default function InitiativeDetailPage() {
  const { id } = useParams();
  const initiative = initiativesMock.find((ini) => ini.id === id);

  if (!initiative) return <p>Iniciativa no encontrada</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">📊 {initiative.name}</h2>
      <div className="bg-slate-800 rounded-lg shadow p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-700 text-slate-300">
              <tr>
                <th className="px-2 py-1">Title</th>
                <th className="px-2 py-1">Status</th>
                <th className="px-2 py-1">Original Estimate</th>
                <th className="px-2 py-1">Completed</th>
                <th className="px-2 py-1">Remaining</th>
                <th className="px-2 py-1">Start Date</th>
                <th className="px-2 py-1">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {initiative.stories.map((hu) => (
                <tr key={hu.id} className="odd:bg-slate-800 even:bg-slate-900">
                  <td className="px-2 py-1">{hu.Title}</td>
                  <td className="px-2 py-1">{hu.State}</td>
                  <td className="px-2 py-1">{hu["Original Estimate"]}</td>
                  <td className="px-2 py-1">{hu["Completed Work"]}</td>
                  <td className="px-2 py-1">{hu["Remaining Work"]}</td>
                  <td className="px-2 py-1">{hu["Start Date"]}</td>
                  <td className="px-2 py-1">{hu["Due Date"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link to="/initiatives-overview" className="btn btn-outline mt-4 inline-block">
          Volver
        </Link>
      </div>
    </div>
  );
}
