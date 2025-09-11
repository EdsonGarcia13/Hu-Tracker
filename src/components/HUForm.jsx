import React from "react";
import StatusSelect from "./StatusSelect";

export default function HUForm({ newHU, setNewHU, handleAddHU }) {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h5 className="card-title mb-3">Agregar Historia de Usuario</h5>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-control"
              value={newHU.Title}
              onChange={(e) => setNewHU({ ...newHU, Title: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Status</label>
            <StatusSelect
              value={newHU.State}
              onChange={(e) => setNewHU({ ...newHU, State: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Assigned To</label>
            <input
              type="text"
              className="form-control"
              value={newHU["Assigned To"]}
              onChange={(e) =>
                setNewHU({ ...newHU, "Assigned To": e.target.value })
              }
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Original Estimate (hrs)</label>
            <input
              type="number"
              className="form-control"
              value={newHU["Original Estimate"]}
              onChange={(e) =>
                setNewHU({ ...newHU, "Original Estimate": e.target.value })
              }
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Sprint</label>
            <input
              type="text"
              className="form-control"
              value={newHU["Sprint"]}
              onChange={(e) =>
                setNewHU({ ...newHU, Sprint: e.target.value })
              }
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={newHU["Start Date"]}
              onChange={(e) =>
                setNewHU({ ...newHU, "Start Date": e.target.value })
              }
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className="form-control"
              value={newHU["Due Date"]}
              onChange={(e) =>
                setNewHU({ ...newHU, "Due Date": e.target.value })
              }
            />
          </div>
          <div className="col-md-12">
            <label className="form-label">Initiative</label>
            <input
              type="text"
              className="form-control"
              value={newHU.Initiative}
              onChange={(e) =>
                setNewHU({ ...newHU, Initiative: e.target.value })
              }
            />
          </div>
        </div>
        <button className="btn btn-primary mt-3" onClick={handleAddHU}>
          Agregar HU
        </button>
      </div>
    </div>
  );
}
