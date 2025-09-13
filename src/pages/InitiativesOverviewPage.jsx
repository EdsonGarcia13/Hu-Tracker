// src/pages/InitiativesOverviewPage.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addInitiative,
  editInitiative,
  removeInitiativeById,
  setInitiatives,
} from "../store/huSlice";
import { initiativesMock } from "../mocks/initiativesMock";
import {
  businessDaysBetween,
  addBusinessDays,
  WORK_HOURS_PER_DAY,
} from "../utils/timeCalculations";

export default function InitiativesOverviewPage() {
  const dispatch = useDispatch();
  const { initiatives } = useSelector((s) => s.hu);

  // Hidratar SOLO una vez (evita duplicados por StrictMode)
  const hydratedOnce = useRef(false);
  useEffect(() => {
    if (!hydratedOnce.current && initiatives.length === 0) {
      dispatch(setInitiatives(initiativesMock));
      hydratedOnce.current = true;
    }
  }, [dispatch, initiatives.length]);

  // Form para nueva iniciativa
  const [newIni, setNewIni] = useState({
    id: "",
    name: "",
    startDate: "",
    dueDate: "",
    sprintDays: 10,
  });

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
        const huDue = new Date(hu["Due Date"]);
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

  const handleAddInitiative = () => {
    if (!newIni.name) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    if (newIni.startDate && newIni.startDate < todayStr) {
      alert("La fecha de inicio no puede ser en el pasado");
      return;
    }
    if (newIni.startDate && newIni.dueDate && newIni.dueDate < newIni.startDate) {
      alert("La fecha fin debe ser posterior al inicio");
      return;
    }
    const iniToAdd = {
      ...newIni,
      id: `ini-${Date.now()}`,
      stories: [],
      sprintDays: Number(newIni.sprintDays) || 10,
    };
    dispatch(addInitiative(iniToAdd));
    setNewIni({
      id: "",
      name: "",
      startDate: "",
      dueDate: "",
      sprintDays: 10,
    });
  };

  const handleEditById = (id, key, value) => {
    dispatch(editInitiative({ id, key, value }));
  };

  const handleDeleteById = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar esta iniciativa?")) {
      dispatch(removeInitiativeById(id));
    }
  };

  return (
    <div className="container-fluid">
      <h2 className="mb-4">📈 Resumen por Iniciativa</h2>

      {/* Formulario para nueva iniciativa */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">Agregar Nueva Iniciativa</h5>
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
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
            <div className="col-md-3">
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
            <div className="col-md-3">
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
            <div className="col-md-2">
              <label htmlFor="new-ini-sprint" className="form-label">
                Días sprint
              </label>
              <input
                id="new-ini-sprint"
                type="number"
                className="form-control"
                value={newIni.sprintDays}
                onChange={(e) =>
                  setNewIni({ ...newIni, sprintDays: e.target.value })
                }
              />
            </div>
            <div className="col-md-1">
              <button className="btn btn-primary w-100" onClick={handleAddInitiative}>
                Agregar
              </button>
            </div>
          </div>
        </div>
      </div>

     {/* Tabla de iniciativas */}
<div className="card shadow-sm">
  <div className="card-body">
    {/* Header con título (izquierda) */}
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h5 className="card-title m-0">Listado de Iniciativas</h5>
    </div>

    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th>Initiative</th>
            <th>Start Date</th>
            <th>Due Date</th>
            <th>Sprint Days</th>
            <th>Historias</th>
            <th>Original (hrs)</th>
            <th>Completed (hrs)</th>
            <th>Remaining (hrs)</th>
            <th>Projected Delay (days)</th>
            <th>Status</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((row) => (
            <React.Fragment key={row.id}>
              <tr>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={row.name}
                    onChange={(e) =>
                      handleEditById(row.id, "name", e.target.value)
                    }
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
                <td>{row.completed}</td>
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
                    className="btn btn-sm btn-outline-primary"
                  >
                    Ver HU
                  </Link>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteById(row.id)}
                  >
                    🗑
                  </button>
                </td>
              </tr>
              {row.totalSprints > 0 && (
                <tr className="table-secondary">
                  <td colSpan="11">
                    <div>
                      Estimado teórico: {row.totalSprints} sprints, {row.expectedPercentPerSprint}
                      % por sprint
                    </div>
                    <div className="table-responsive">
                      <table className="table table-sm mb-0">
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
                              <td>{s.completedHours}</td>
                              <td>{s.debtHours}</td>
                              <td>{s.completedPercent}%</td>
                              <td>{s.debtPercent}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2">
                      <strong>Total estimado del proyecto:</strong> {row.original}h / {row.totalDays}{" "}
                      días
                      <br />
                      <strong>Porcentaje general:</strong> {row.completionPercent}%
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          {summary.length === 0 && (
            <tr>
              <td colSpan="11" className="text-center text-muted">
                No hay iniciativas, agrega una arriba.
              </td>
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
