import React, { useState, useEffect } from "react";
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
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    useEffect(() => {
      setCurrentPage(1);
    }, [data]);
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = data.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="card bg-white text-dark">
        <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title m-0">Listado de Historias de Usuario</h5>
          {availableSprints?.length > 1 && (
            <div className="d-flex align-items-center gap-2">
              <label className="fw-semibold">Sprint</label>
              <select
                className="form-select form-select-sm w-auto"
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

        <div className="table-responsive">
          <table className="table table-striped table-sm align-middle table-column-separator">
            <thead>
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
                <th>Extra</th>
                <th>Acción</th>
              </tr>
            </thead>
              <tbody>
                {paginated.map((row, idx) => {
                  const effectiveToday =
                    row.State === "Done" &&
                    Number(row["Completed Work"]) >= Number(row["Original Estimate"])
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

                  const actualIndex = startIndex + idx;
                  return (
                    <tr
                      key={actualIndex}
                      className={`${delayHours > 0 ? "table-danger" : ""} ${
                        row.isAdditional ? "table-warning" : ""
                      }`}
                    >
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={row.Title || ""}
                          onChange={(e) => handleEdit(actualIndex, "Title", e.target.value)}
                        />
                      </td>
                      <td>
                        <StatusSelect
                          value={row.State}
                          onChange={(e) => handleEdit(actualIndex, "State", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={row["Assigned To"] || ""}
                          onChange={(e) =>
                            handleEdit(actualIndex, "Assigned To", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={row["Original Estimate"] || ""}
                          onChange={(e) =>
                            handleEdit(actualIndex, "Original Estimate", e.target.value)
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
                            handleEdit(actualIndex, "Completed Work", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          max={sprintLimit || undefined}
                          className="form-control form-control-sm"
                          value={row.Sprint || ""}
                          onChange={(e) => handleEdit(actualIndex, "Sprint", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          min={startLimit}
                          max={endLimit || undefined}
                          value={row["Start Date"] || ""}
                          onChange={(e) => handleEdit(actualIndex, "Start Date", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          min={row["Start Date"] || startLimit}
                          value={row["Due Date"] || ""}
                          onChange={(e) => handleEdit(actualIndex, "Due Date", e.target.value)}
                        />
                      </td>
                      <td>{elapsedDays}</td>
                      <td>{delayHours}</td>
                      <td>{delayDays}</td>
                      <td>
                        <span
                          className={
                            getDeviation(
                              row["Due Date"],
                              row["Completed Work"],
                              row["Original Estimate"]
                            ) === "Retrasada"
                              ? "text-danger fw-bold"
                              : "text-success fw-bold"
                          }
                        >
                          {getDeviation(
                            row["Due Date"],
                            row["Completed Work"],
                            row["Original Estimate"]
                          )}
                        </span>
                      </td>
                      <td>{row.isAdditional ? "⚠️" : ""}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => onDelete(actualIndex)}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
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
        </div>
      </div>
    );
  }
