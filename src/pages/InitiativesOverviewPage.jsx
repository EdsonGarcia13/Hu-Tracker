// src/pages/InitiativesOverviewPage.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addInitiative,
  editInitiative,
  removeInitiativeById,
  setInitiatives,
} from "../store/huSlice";
import {
  businessDaysBetween,
  addBusinessDays,
  WORK_HOURS_PER_DAY,
} from "../utils/timeCalculations";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { mapSupabaseInitiativeToUi } from "../utils/supabaseMappers";

export default function InitiativesOverviewPage() {
  const dispatch = useDispatch();
  const { initiatives } = useSelector((s) => s.hu);
  const { user } = useSelector((s) => s.auth);
  const [newIni, setNewIni] = useState({
    id: "",
    name: "",
    startDate: "",
    dueDate: "",
    sprintDays: 10,
  });
  const [loading, setLoading] = useState(false);
  const [remoteError, setRemoteError] = useState("");

  const canQuery = Boolean(supabase && isSupabaseConfigured && user?.id);

  const fetchInitiatives = useCallback(async () => {
    if (!canQuery) {
      dispatch(setInitiatives([]));
      return;
    }

    setLoading(true);
    setRemoteError("");
    const { data, error } = await supabase
      .from("initiatives")
      .select(
        "id, name, start_date, due_date, sprint_days, hus(id, initiative_id, title, state, assigned_to, original_estimate, completed_work, remaining_work, start_date, due_date, sprint, is_additional, completion_date))"
      )
      .eq("user_id", user.id)
      .order("inserted_at", { ascending: true })
      .order("inserted_at", { ascending: true, foreignTable: "hus" });

    if (error) {
      setRemoteError(error.message);
      dispatch(setInitiatives([]));
    } else {
      const mapped = (data || []).map(mapSupabaseInitiativeToUi);
      dispatch(setInitiatives(mapped));
    }
    setLoading(false);
  }, [canQuery, dispatch, user?.id]);

  useEffect(() => {
    fetchInitiatives();
  }, [fetchInitiatives]);

  const summary = useMemo(() => {
    return initiatives.map((ini) => {
      const stories = ini.stories || [];
      const original =
        stories.reduce((acc, hu) => acc + (hu["Original Estimate"] || 0), 0) || 0;
      const completed =
        stories.reduce((acc, hu) => acc + (hu["Completed Work"] || 0), 0) || 0;
      const remaining =
        stories.reduce((acc, hu) => acc + (hu["Remaining Work"] || 0), 0) || 0;

      const totalBusinessDays =
        ini.startDate && ini.dueDate
          ? businessDaysBetween(new Date(ini.startDate), new Date(ini.dueDate))
          : 0;
      const totalSprints =
        ini.startDate && ini.dueDate && ini.sprintDays
          ? Math.ceil(
              businessDaysBetween(
                new Date(ini.startDate),
                new Date(ini.dueDate)
              ) / ini.sprintDays
            )
          : 0;
      const sprintNumbers = Array.from({ length: totalSprints }, (_, i) => i + 1);
      const expectedPercentPerSprint =
        totalSprints > 0 ? +(100 / totalSprints).toFixed(2) : 0;
      const completionPercent =
        original > 0 ? +((completed / original) * 100).toFixed(1) : 0;

      const sprints = sprintNumbers.map((num) => {
        const sprintStart =
          ini.startDate && ini.sprintDays
            ? addBusinessDays(new Date(ini.startDate), (num - 1) * ini.sprintDays)
            : null;
        const sprintEnd =
          sprintStart && ini.sprintDays
            ? addBusinessDays(sprintStart, ini.sprintDays - 1)
            : null;
        const storiesInSprint = stories.filter((hu) => hu.sprint === num);
        const expectedHours = storiesInSprint.reduce(
          (acc, hu) => acc + (hu["Original Estimate"] || 0),
          0
        );
        const completedHours = storiesInSprint.reduce(
          (acc, hu) => acc + (hu["Completed Work"] || 0),
          0
        );
        const debtHours = storiesInSprint.reduce(
          (acc, hu) => acc + (hu["Remaining Work"] || 0),
          0
        );
        let projectedEnd = sprintEnd;
        if (debtHours > 0 && sprintEnd) {
          const today = new Date();
          const delayDays = Math.max(
            0,
            today > sprintEnd
              ? businessDaysBetween(sprintEnd, today) - 1
              : 0
          );
          const extraDays = Math.ceil(debtHours / WORK_HOURS_PER_DAY);
          projectedEnd = addBusinessDays(sprintEnd, delayDays + extraDays);
        }
        return {
          number: num,
          start: sprintStart ? sprintStart.toISOString().slice(0, 10) : "",
          end: sprintEnd ? sprintEnd.toISOString().slice(0, 10) : "",
          projectedEnd: projectedEnd
            ? projectedEnd.toISOString().slice(0, 10)
            : "",
          expectedHours,
          completedHours,
          debtHours,
          completedPercent:
            expectedHours > 0
              ? +((completedHours / expectedHours) * 100).toFixed(1)
              : 0,
          debtPercent:
            expectedHours > 0
              ? +((debtHours / expectedHours) * 100).toFixed(1)
              : 0,
        };
      });

      const today = new Date();
      const hasDelay = stories.some((hu) => {
        const dueValue = hu["Due Date"];
        if (!dueValue) return false;
        const huDue = new Date(dueValue);
        return (
          (hu["Completed Work"] || 0) < (hu["Original Estimate"] || 0) &&
          today > huDue
        );
      });

      let projectedDelay = 0;
      if (stories.length > 0) {
        const start = ini.startDate
          ? new Date(ini.startDate)
          : stories.reduce((min, hu) => {
              const d = hu["Start Date"] ? new Date(hu["Start Date"]) : today;
              return d < min ? d : min;
            }, stories[0]["Start Date"] ? new Date(stories[0]["Start Date"]) : today);
        const due = ini.dueDate
          ? new Date(ini.dueDate)
          : stories.reduce((max, hu) => {
              const d = hu["Due Date"] ? new Date(hu["Due Date"]) : today;
              return d > max ? d : max;
            }, stories[0]["Due Date"] ? new Date(stories[0]["Due Date"]) : today);

        const fallbackTotal = Math.max(
          1,
          businessDaysBetween(start, due) - 1
        );
        const totalDays = ini.sprintDays || fallbackTotal;
        const daysElapsed = Math.max(
          0,
          businessDaysBetween(start, today) - 1
        );
        const burnRate = daysElapsed > 0 ? completed / daysElapsed : 0;
        const rem = Math.max(original - completed, 0);
        const projectedDays = burnRate > 0 ? Math.ceil(rem / burnRate) : 0;
        const projectedTotal = daysElapsed + projectedDays;
        projectedDelay = Math.max(0, projectedTotal - totalDays);
      }

      return {
        ...ini,
        original,
        completed,
        remaining,
        totalHU: stories.length,
        hasDelay,
        projectedDelay,
        totalSprints,
        expectedPercentPerSprint,
        sprints,
        totalDays: totalBusinessDays,
        completionPercent,
      };
    });
  }, [initiatives]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(summary.length / itemsPerPage);
  const paginatedSummary = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return summary.slice(start, start + itemsPerPage);
  }, [summary, currentPage]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages || 1);
  }, [totalPages, currentPage]);

  const handleAddInitiative = async () => {
    if (!newIni.name || !canQuery) {
      if (!canQuery) {
        setRemoteError(
          "No es posible crear iniciativas sin conexión con Supabase o sin usuario autenticado."
        );
      }
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    if (newIni.startDate && newIni.startDate < todayStr) {
      alert("La fecha de inicio no puede ser en el pasado");
      return;
    }
    if (newIni.startDate && newIni.dueDate && newIni.dueDate < newIni.startDate) {
      alert("La fecha fin debe ser posterior al inicio");
      return;
    }

    const payload = {
      user_id: user.id,
      name: newIni.name.trim(),
      start_date: newIni.startDate || null,
      due_date: newIni.dueDate || null,
      sprint_days: newIni.sprintDays ? Number(newIni.sprintDays) : null,
    };

    const { data, error } = await supabase
      .from("initiatives")
      .insert(payload)
      .select(
        "id, name, start_date, due_date, sprint_days, hus(id, initiative_id, title, state, assigned_to, original_estimate, completed_work, remaining_work, start_date, due_date, sprint, is_additional, completion_date))"
      )
      .single();

    if (error) {
      setRemoteError(error.message);
      return;
    }

    const mapped = mapSupabaseInitiativeToUi(data);
    dispatch(addInitiative(mapped));
    setRemoteError("");
    setNewIni({
      id: "",
      name: "",
      startDate: "",
      dueDate: "",
      sprintDays: 10,
    });
  };

  const handleEditById = async (id, key, value) => {
    if (!canQuery) {
      setRemoteError(
        "No es posible actualizar iniciativas sin conexión con Supabase."
      );
      return;
    }

    const updates = {};
    if (key === "name") updates.name = value;
    if (key === "startDate") updates.start_date = value || null;
    if (key === "dueDate") updates.due_date = value || null;
    if (key === "sprintDays") updates.sprint_days = value ? Number(value) : null;

    const { error } = await supabase
      .from("initiatives")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setRemoteError(error.message);
      return;
    }

    setRemoteError("");
    dispatch(editInitiative({ id, key, value }));
  };

  const handleDeleteById = async (id) => {
    if (!canQuery) {
      setRemoteError(
        "No es posible eliminar iniciativas sin conexión con Supabase."
      );
      return;
    }

    if (!window.confirm("¿Seguro que deseas eliminar esta iniciativa?")) {
      return;
    }

    const { error } = await supabase
      .from("initiatives")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setRemoteError(error.message);
      return;
    }

    setRemoteError("");
    dispatch(removeInitiativeById(id));
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">📈 Resumen por Iniciativa</h2>

      {remoteError && (
        <div className="alert alert-danger" role="alert">
          {remoteError}
        </div>
      )}
      {loading && (
        <div className="alert alert-info" role="status">
          Cargando iniciativas...
        </div>
      )}

      {/* Formulario para nueva iniciativa */}
      <div className="card bg-white text-dark mb-4">
        <div className="card-body">
          <h5 className="card-title mb-4">Agregar Nueva Iniciativa</h5>
          <div className="row g-3">
            <div className="col-md">
              <label htmlFor="new-ini-name" className="form-label">
                Nombre
              </label>
              <input
                id="new-ini-name"
                type="text"
                className="form-control"
                value={newIni.name}
                onChange={(e) => setNewIni({ ...newIni, name: e.target.value })}
              />
            </div>
            <div className="col-md">
              <label htmlFor="new-ini-start" className="form-label">
                Fecha inicio
              </label>
              <input
                id="new-ini-start"
                type="date"
                className="form-control"
                min={new Date().toISOString().slice(0, 10)}
                value={newIni.startDate}
                onChange={(e) => setNewIni({ ...newIni, startDate: e.target.value })}
              />
            </div>
            <div className="col-md">
              <label htmlFor="new-ini-due" className="form-label">
                Fecha fin
              </label>
              <input
                id="new-ini-due"
                type="date"
                className="form-control"
                min={newIni.startDate || new Date().toISOString().slice(0, 10)}
                value={newIni.dueDate}
                onChange={(e) => setNewIni({ ...newIni, dueDate: e.target.value })}
              />
            </div>
            <div className="col-md">
              <label htmlFor="new-ini-sprint" className="form-label">
                Días sprint
              </label>
              <input
                id="new-ini-sprint"
                type="number"
                className="form-control"
                value={newIni.sprintDays}
                onChange={(e) => setNewIni({ ...newIni, sprintDays: e.target.value })}
              />
            </div>
            <div className="col-md d-flex align-items-end">
              <button
                className="btn btn-primary w-100"
                onClick={handleAddInitiative}
                disabled={!canQuery}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Listado de iniciativas */}
      <div className="d-flex flex-column gap-4">
        {paginatedSummary.map((row) => (
          <div key={row.id} className="card bg-white text-dark">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped table-sm align-middle table-column-separator">
                  <thead>
                    <tr>
                      <th className="text-start">Initiative</th>
                      <th>Start Date</th>
                      <th>Due Date</th>
                      <th>Sprint Days</th>
                      <th>Historias</th>
                      <th>Original</th>
                      <th>Completed</th>
                      <th>Remaining</th>
                      <th>Projected Delay</th>
                      <th>Status</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={row.name}
                          onChange={(e) => handleEditById(row.id, "name", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={row.startDate || ""}
                          onChange={(e) =>
                            handleEditById(row.id, "startDate", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={row.dueDate || ""}
                          onChange={(e) =>
                            handleEditById(row.id, "dueDate", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={row.sprintDays || ""}
                          onChange={(e) =>
                            handleEditById(row.id, "sprintDays", e.target.value)
                          }
                        />
                      </td>
                      <td>{row.totalHU}</td>
                      <td>{row.original}</td>
                      <td>
                        <span className="badge bg-primary">{row.completed}</span>
                      </td>
                      <td>{row.remaining}</td>
                      <td>{row.projectedDelay}</td>
                      <td>
                        {row.hasDelay ? (
                          <span className="badge bg-danger">Con retrasos</span>
                        ) : (
                          <span className="badge bg-success">En tiempo</span>
                        )}
                      </td>
                      <td className="d-flex gap-2">
                        <Link
                          to={`/initiatives/${row.id}`}
                          className="btn btn-primary btn-sm"
                        >
                          Ver HU
                        </Link>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteById(row.id)}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {row.totalSprints > 0 && (
                <div className="mt-4 small">
                  <div className="mb-2">
                    Estimado teórico: {row.totalSprints} sprints, {row.expectedPercentPerSprint}% por sprint
                  </div>
                  <div className="table-responsive">
                    <table className="table table-striped table-sm align-middle table-column-separator">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Inicio</th>
                          <th>Fin</th>
                          <th>Proyección fin</th>
                          <th>Horas estimadas</th>
                          <th>Horas cumplidas</th>
                          <th>Horas deuda</th>
                          <th>% cumplido</th>
                          <th>% deuda</th>
                        </tr>
                      </thead>
                      <tbody>
                        {row.sprints.map((s) => (
                          <tr key={s.number}>
                            <td>{s.number}</td>
                            <td>{s.start}</td>
                            <td>{s.end}</td>
                            <td>{s.projectedEnd}</td>
                            <td>{s.expectedHours}</td>
                            <td>
                              <span className="badge bg-primary">{s.completedHours}</span>
                            </td>
                            <td>{s.debtHours}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="progress flex-grow-1" style={{ height: "0.5rem" }}>
                                  <div
                                    className="progress-bar bg-success"
                                    style={{ width: `${Math.min(s.completedPercent, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="percent-label">{s.completedPercent}%</span>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="progress flex-grow-1" style={{ height: "0.5rem" }}>
                                  <div
                                    className="progress-bar bg-danger"
                                    style={{ width: `${Math.min(s.debtPercent, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="percent-label">{s.debtPercent}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2">
                    <strong>Total estimado del proyecto:</strong> {row.original}h / {row.totalDays} días
                    <br />
                    <strong>Porcentaje general:</strong> {row.completionPercent}%
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {summary.length === 0 && !loading && (
          <div className="text-center text-muted">
            No hay iniciativas, agrega una arriba.
          </div>
        )}
        {totalPages > 1 && summary.length > 0 && (
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
  );
}
