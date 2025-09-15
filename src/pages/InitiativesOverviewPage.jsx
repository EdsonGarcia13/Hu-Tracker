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
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">📈 Resumen por Iniciativa</h2>

      {/* Formulario para nueva iniciativa */}
      <div className="bg-slate-800 rounded-lg shadow p-4">
        <h5 className="text-lg font-semibold mb-4">Agregar Nueva Iniciativa</h5>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="flex flex-col">
            <label htmlFor="new-ini-name" className="text-sm mb-1">
              Nombre
            </label>
            <input
              id="new-ini-name"
              type="text"
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
              value={newIni.name}
              onChange={(e) => setNewIni({ ...newIni, name: e.target.value })}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="new-ini-start" className="text-sm mb-1">
              Fecha inicio
            </label>
            <input
              id="new-ini-start"
              type="date"
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
              min={new Date().toISOString().slice(0, 10)}
              value={newIni.startDate}
              onChange={(e) => setNewIni({ ...newIni, startDate: e.target.value })}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="new-ini-due" className="text-sm mb-1">
              Fecha fin
            </label>
            <input
              id="new-ini-due"
              type="date"
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
              min={newIni.startDate || new Date().toISOString().slice(0, 10)}
              value={newIni.dueDate}
              onChange={(e) => setNewIni({ ...newIni, dueDate: e.target.value })}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="new-ini-sprint" className="text-sm mb-1">
              Días sprint
            </label>
            <input
              id="new-ini-sprint"
              type="number"
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
              value={newIni.sprintDays}
              onChange={(e) => setNewIni({ ...newIni, sprintDays: e.target.value })}
            />
          </div>
          <div className="flex flex-col justify-end">
            <button className="btn btn-primary w-full" onClick={handleAddInitiative}>
              Agregar
            </button>
          </div>
        </div>
      </div>

      {/* Listado de iniciativas */}
      <div className="space-y-6">
        {summary.map((row) => (
          <div key={row.id} className="bg-slate-800 rounded-lg shadow p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-700 text-slate-300">
                  <tr>
                    <th className="px-2 py-1 text-left">Initiative</th>
                    <th className="px-2 py-1">Start Date</th>
                    <th className="px-2 py-1">Due Date</th>
                    <th className="px-2 py-1">Sprint Days</th>
                    <th className="px-2 py-1">Historias</th>
                    <th className="px-2 py-1">Original</th>
                    <th className="px-2 py-1">Completed</th>
                    <th className="px-2 py-1">Remaining</th>
                    <th className="px-2 py-1">Projected Delay</th>
                    <th className="px-2 py-1">Status</th>
                    <th className="px-2 py-1">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-slate-900">
                    <td className="p-2">
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1"
                        value={row.name}
                        onChange={(e) => handleEditById(row.id, "name", e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1"
                        value={row.startDate || ""}
                        onChange={(e) => handleEditById(row.id, "startDate", e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1"
                        value={row.dueDate || ""}
                        onChange={(e) => handleEditById(row.id, "dueDate", e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1"
                        value={row.sprintDays || ""}
                        onChange={(e) => handleEditById(row.id, "sprintDays", e.target.value)}
                      />
                    </td>
                    <td className="p-2">{row.totalHU}</td>
                    <td className="p-2">{row.original}</td>
                    <td className="p-2">
                      <span className="badge-hours">{row.completed}</span>
                    </td>
                    <td className="p-2">{row.remaining}</td>
                    <td className="p-2">{row.projectedDelay}</td>
                    <td className="p-2">
                      {row.hasDelay ? (
                        <span className="badge-status-delay">Con retrasos</span>
                      ) : (
                        <span className="badge-status-ontime">En tiempo</span>
                      )}
                    </td>
                    <td className="p-2 flex gap-2">
                      <Link
                        to={`/initiatives/${row.id}`}
                        className="btn btn-primary text-xs"
                      >
                        Ver HU
                      </Link>
                      <button
                        className="btn btn-danger text-xs"
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
              <div className="mt-4 text-sm">
                <div className="mb-2">
                  Estimado teórico: {row.totalSprints} sprints, {row.expectedPercentPerSprint}% por sprint
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-700 text-slate-300">
                      <tr>
                        <th className="px-2 py-1">#</th>
                        <th className="px-2 py-1">Inicio</th>
                        <th className="px-2 py-1">Fin</th>
                        <th className="px-2 py-1">Proyección fin</th>
                        <th className="px-2 py-1">Horas estimadas</th>
                        <th className="px-2 py-1">Horas cumplidas</th>
                        <th className="px-2 py-1">Horas deuda</th>
                        <th className="px-2 py-1">% cumplido</th>
                        <th className="px-2 py-1">% deuda</th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.sprints.map((s) => (
                        <tr
                          key={s.number}
                          className="odd:bg-slate-800 even:bg-slate-900"
                        >
                          <td className="px-2 py-1">{s.number}</td>
                          <td className="px-2 py-1">{s.start}</td>
                          <td className="px-2 py-1">{s.end}</td>
                          <td className="px-2 py-1">{s.projectedEnd}</td>
                          <td className="px-2 py-1">{s.expectedHours}</td>
                          <td className="px-2 py-1">
                            <span className="badge-hours">{s.completedHours}</span>
                          </td>
                          <td className="px-2 py-1">{s.debtHours}</td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-2">
                              <div className="progress-container">
                                <div
                                  className="progress-completed"
                                  style={{ width: `${s.completedPercent}%` }}
                                ></div>
                              </div>
                              <span>{s.completedPercent}%</span>
                            </div>
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-2">
                              <div className="progress-container">
                                <div
                                  className="progress-debt"
                                  style={{ width: `${s.debtPercent}%` }}
                                ></div>
                              </div>
                              <span>{s.debtPercent}%</span>
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
        ))}
        {summary.length === 0 && (
          <div className="text-center text-slate-400">
            No hay iniciativas, agrega una arriba.
          </div>
        )}
      </div>
    </div>
  );
}
