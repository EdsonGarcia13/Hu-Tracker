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
import { businessDaysBetween } from "../utils/timeCalculations";

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
        const start = stories.reduce((min, hu) => {
          const d = hu["Start Date"] ? new Date(hu["Start Date"]) : today;
          return d < min ? d : min;
        }, stories[0]["Start Date"] ? new Date(stories[0]["Start Date"]) : today);
        const due = stories.reduce((max, hu) => {
          const d = hu["Due Date"] ? new Date(hu["Due Date"]) : today;
          return d > max ? d : max;
        }, stories[0]["Due Date"] ? new Date(stories[0]["Due Date"]) : today);

        const totalDays = Math.max(
          1,
          businessDaysBetween(start, due) - 1
        );
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
      };
    });
  }, [initiatives]);

  const handleAddInitiative = () => {
    if (!newIni.name) return;
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
          <div className="row g-2">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Nombre"
                value={newIni.name}
                onChange={(e) => setNewIni({ ...newIni, name: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <input
                type="date"
                className="form-control"
                value={newIni.startDate}
                onChange={(e) => setNewIni({ ...newIni, startDate: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <input
                type="date"
                className="form-control"
                value={newIni.dueDate}
                onChange={(e) => setNewIni({ ...newIni, dueDate: e.target.value })}
              />
            </div>
            <div className="col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Días sprint"
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
            <tr key={row.id}>
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
