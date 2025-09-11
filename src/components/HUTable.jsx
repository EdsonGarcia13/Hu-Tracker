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
}) {
  const getDeviation = (dueDate, completed, original) => {
    if (!dueDate) return "-";
    const today = new Date();
    const due = new Date(dueDate);
    if (completed >= original) return "Cumplida";
    return today >= due ? "Retrasada" : "Adelantada";
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        {/* Header con título y filtro sprint */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title m-0">Listado de Historias de Usuario</h5>
          {availableSprints?.length > 1 && (
            <div className="d-flex align-items-center">
              <label className="me-2 fw-bold">Sprint</label>
              <select
                className="form-select form-select-sm"
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
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead className="table-light ">
              <tr>
                <th style={{ minWidth: "200px" }}>Title</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Original Estimate</th>
                <th>Remaining</th>
                <th>Completed</th>
                <th>Sprint</th>
                <th>Start Date</th>
                <th>Due Date</th>
                <th>Elapsed (days)</th>
                <th>Delay (hrs)</th>
                <th>Delay (days)</th>
                <th>Deviation</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const start = row["Start Date"]
                  ? new Date(row["Start Date"])
                  : new Date();
                const due = row["Due Date"]
                  ? new Date(row["Due Date"])
                  : new Date();
                const today = new Date();

                const { elapsedDays, delayHours, delayDays } =
                  calculateElapsedAndDelay(
                    new Date(row["Start Date"]),
                    new Date(row["Due Date"]),
                    new Date(),
                    Number(row["Original Estimate"]) || 0,
                    Number(row["Completed Work"]) || 0
                  );

                return (
                  <tr
                    key={idx}
                    className={delayHours > 0 ? "table-danger" : ""}
                  >
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={row.Title || ""}
                        onChange={(e) =>
                          handleEdit(idx, "Title", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <StatusSelect
                        value={row.State}
                        onChange={(e) =>
                          handleEdit(idx, "State", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={row["Assigned To"] || ""}
                        onChange={(e) =>
                          handleEdit(idx, "Assigned To", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={row["Original Estimate"] || ""}
                        onChange={(e) =>
                          handleEdit(idx, "Original Estimate", e.target.value)
                        }
                      />
                    </td>
                    <td>{row["Remaining Work"]}</td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={row["Completed Work"] || 0}
                        onChange={(e) =>
                          handleEdit(idx, "Completed Work", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={row.Sprint || ""}
                        onChange={(e) =>
                          handleEdit(idx, "Sprint", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={row["Start Date"] || ""}
                        onChange={(e) =>
                          handleEdit(idx, "Start Date", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={row["Due Date"] || ""}
                        onChange={(e) =>
                          handleEdit(idx, "Due Date", e.target.value)
                        }
                      />
                    </td>
                    <td>{elapsedDays}</td>
                    <td>{delayHours}</td>
                    <td>{delayDays}</td>
                    <td>
                      <span
                        className={`fw-bold ${
                          getDeviation(
                            row["Due Date"],
                            row["Completed Work"],
                            row["Original Estimate"]
                          ) === "Retrasada"
                            ? "text-danger"
                            : "text-success"
                        }`}
                      >
                        {getDeviation(
                          row["Due Date"],
                          row["Completed Work"],
                          row["Original Estimate"]
                        )}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
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
    </div>
  );
}
