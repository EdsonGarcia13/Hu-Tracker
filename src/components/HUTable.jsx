import React from "react";
import StatusSelect from "./StatusSelect";
import { calculateElapsedAndDelay } from "../utils/timeCalculations";

export default function HUTable({
  data,
  handleEdit,
  onDelete,
  availableSprints,
  selectedSprint,
  setSelectedSprint,
  startLimit,
  endLimit,
  sprintLimit,
}) {
  const getDeviation = (dueDate, completed, original) => {
    if (!dueDate) return "-";
    const today = new Date();
    const due = new Date(dueDate);
    if (completed >= original) return "Cumplida";
    return today >= due ? "Retrasada" : "Adelantada";
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow p-4">
      {/* Header con título y filtro sprint */}
      <div className="flex justify-between items-center mb-4">
        <h5 className="text-lg font-semibold">Listado de Historias de Usuario</h5>
        {availableSprints?.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="font-semibold">Sprint</label>
            <select
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
              style={{ width: "auto" }}
              value={selectedSprint}
              onChange={(e) => setSelectedSprint(e.target.value)}
            >
              {availableSprints.map((s, idx) => (
                <option key={idx} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-slate-700 text-slate-300">
            <tr>
              <th className="px-2 py-1" style={{ minWidth: "200px" }}>Title</th>
              <th className="px-2 py-1">Status</th>
              <th className="px-2 py-1">Assigned To</th>
              <th className="px-2 py-1">Original Estimate</th>
              <th className="px-2 py-1">Remaining</th>
              <th className="px-2 py-1">Completed</th>
              <th className="px-2 py-1">Sprint</th>
              <th className="px-2 py-1">Start Date</th>
              <th className="px-2 py-1">Due Date</th>
              <th className="px-2 py-1">Elapsed (days)</th>
              <th className="px-2 py-1">Delay (hrs)</th>
              <th className="px-2 py-1">Delay (days)</th>
              <th className="px-2 py-1">Deviation</th>
              <th className="px-2 py-1">Extra</th>
              <th className="px-2 py-1">Acción</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
                const effectiveToday =
                  row.State === "Done" &&
                  Number(row["Completed Work"]) >=
                    Number(row["Original Estimate"])
                    ? new Date(
                        row["Completion Date"] ||
                          row["Due Date"] ||
                          row["Start Date"]
                      )
                    : new Date();
                const { elapsedDays, delayHours, delayDays } =
                  calculateElapsedAndDelay(
                    new Date(row["Start Date"]),
                    new Date(row["Completion Date"] || row["Due Date"]),
                    effectiveToday,
                    Number(row["Original Estimate"]) || 0,
                    Number(row["Completed Work"]) || 0
                  );

              return (
                <tr
                  key={idx}
                  className={`${delayHours > 0 ? "bg-red-900/20" : ""} ${
                    row.isAdditional ? "bg-yellow-900/20" : ""
                  }`}
                >
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1"
                      value={row.Title || ""}
                      onChange={(e) => handleEdit(idx, "Title", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <StatusSelect
                      value={row.State}
                      onChange={(e) => handleEdit(idx, "State", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1"
                      value={row["Assigned To"] || ""}
                      onChange={(e) => handleEdit(idx, "Assigned To", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1"
                      value={row["Original Estimate"] || ""}
                      onChange={(e) => handleEdit(idx, "Original Estimate", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1">{row["Remaining Work"]}</td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1"
                      value={row["Completed Work"] || 0}
                      onChange={(e) => handleEdit(idx, "Completed Work", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={1}
                      max={sprintLimit || undefined}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1"
                      value={row.Sprint || ""}
                      onChange={(e) => handleEdit(idx, "Sprint", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="date"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1"
                      min={startLimit}
                      max={endLimit || undefined}
                      value={row["Start Date"] || ""}
                      onChange={(e) => handleEdit(idx, "Start Date", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="date"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1"
                      min={row["Start Date"] || startLimit}
                      value={row["Due Date"] || ""}
                      onChange={(e) => handleEdit(idx, "Due Date", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1">{elapsedDays}</td>
                  <td className="px-2 py-1">{delayHours}</td>
                  <td className="px-2 py-1">{delayDays}</td>
                  <td className="px-2 py-1">
                    <span
                      className={`${
                        getDeviation(
                          row["Due Date"],
                          row["Completed Work"],
                          row["Original Estimate"]
                        ) === "Retrasada"
                          ? "text-red-500"
                          : "text-green-500"
                      } font-bold`}
                    >
                      {getDeviation(
                        row["Due Date"],
                        row["Completed Work"],
                        row["Original Estimate"]
                      )}
                    </span>
                  </td>
                  <td className="px-2 py-1">{row.isAdditional ? "⚠️" : ""}</td>
                  <td className="px-2 py-1">
                    <button
                      className="btn btn-danger text-xs"
                      onClick={() => onDelete(idx)}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
