import React from "react";
import StatusSelect from "./StatusSelect";

export default function HUForm({
  newHU,
  setNewHU,
  handleAddHU,
  minStart,
  maxEnd,
  sprintLimit,
}) {
  return (
    <div className="bg-slate-800 rounded-lg shadow p-4 mb-6">
      <h5 className="text-lg font-semibold mb-4">Agregar Historia de Usuario</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm mb-1">Title</label>
          <input
            type="text"
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
            value={newHU.Title}
            onChange={(e) => setNewHU({ ...newHU, Title: e.target.value })}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Status</label>
          <StatusSelect
            value={newHU.State}
            onChange={(e) => setNewHU({ ...newHU, State: e.target.value })}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Assigned To</label>
          <input
            type="text"
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
            value={newHU["Assigned To"]}
            onChange={(e) =>
              setNewHU({ ...newHU, "Assigned To": e.target.value })
            }
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Original Estimate (hrs)</label>
          <input
            type="number"
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
            value={newHU["Original Estimate"]}
            onChange={(e) =>
              setNewHU({ ...newHU, "Original Estimate": e.target.value })
            }
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Sprint</label>
          <input
            type="number"
            min={1}
            max={sprintLimit || undefined}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
            value={newHU["Sprint"]}
            onChange={(e) => setNewHU({ ...newHU, Sprint: e.target.value })}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Start Date</label>
          <input
            type="date"
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
            min={minStart}
            max={maxEnd || undefined}
            value={newHU["Start Date"]}
            onChange={(e) =>
              setNewHU({ ...newHU, "Start Date": e.target.value })
            }
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Due Date</label>
          <input
            type="date"
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
            min={newHU["Start Date"] || minStart}
            value={newHU["Due Date"]}
            onChange={(e) =>
              setNewHU({ ...newHU, "Due Date": e.target.value })
            }
          />
        </div>
        <div className="flex flex-col md:col-span-2">
          <label className="text-sm mb-1">Initiative</label>
          <input
            type="text"
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
            value={newHU.Initiative}
            onChange={(e) =>
              setNewHU({ ...newHU, Initiative: e.target.value })
            }
          />
        </div>
      </div>
      <button className="btn btn-primary mt-4" onClick={handleAddHU}>
        Agregar HU
      </button>
    </div>
  );
}
