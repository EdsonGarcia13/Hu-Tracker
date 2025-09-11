import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useDispatch, useSelector } from "react-redux";
import {
  loadFromExcel,
  addHU,
  editHU,
  setSelectedInitiative,
  removeHU,
} from "../store/huSlice";
import HUForm from "../components/HUForm";
import HUTable from "../components/HUTable";
import BurndownChart from "../components/BurndownChart";
import {
  WORK_HOURS_PER_DAY,
  businessDaysBetween,
  calculateElapsedAndDelay,
} from "../utils/timeCalculations";
import { useParams, Link } from "react-router-dom";
import { initiativesMock } from "../mocks/initiativesMock";

export default function HUTrackerPage() {
  const { id } = useParams(); // initiative id
  const dispatch = useDispatch();
  const { items, selectedInitiative } = useSelector((s) => s.hu);

  const [newHU, setNewHU] = useState({
    Title: "",
    State: "ToDo",
    "Assigned To": "",
    "Original Estimate": "",
    "Completed Work": 0,
    "Remaining Work": "",
    "Start Date": "",
    "Due Date": "",
    Initiative: "",
    Sprint: "",
  });

  const [selectedSprint, setSelectedSprint] = useState("General");

  // hydrate from mock initiative
  useEffect(() => {
    const ini = initiativesMock.find((x) => x.id === id);
    if (!ini) return;
    const rowsFromMock = ini.stories.map((s) => ({
      ...s,
      Initiative: ini.name,
      Sprint: s.Sprint || "",
    }));
    dispatch(loadFromExcel(rowsFromMock));
    dispatch(setSelectedInitiative(ini.name));
    setNewHU((prev) => ({ ...prev, Initiative: ini.name }));
  }, [id, dispatch]);

  // upload excel
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedInitiative) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const parsedData = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const headers = parsedData[0] || [];
      const rows = parsedData.slice(1).map((row) => {
        const obj = {};
        headers.forEach((h, i) => (obj[h] = row[i]));
        if (!obj.Initiative) obj.Initiative = selectedInitiative;
        if (!obj.Sprint) obj.Sprint = "";
        return obj;
      });

      dispatch(loadFromExcel(rows));
      dispatch(setSelectedInitiative(selectedInitiative));
    };
    reader.readAsBinaryString(file);
  };

  // filter by initiative
  const filtered = useMemo(() => {
    return selectedInitiative
      ? items.filter((r) => r.Initiative === selectedInitiative)
      : items;
  }, [items, selectedInitiative]);

  // filter by sprint
  const availableSprints = useMemo(() => {
    const all = filtered.map((hu) => hu.Sprint).filter(Boolean);
    return ["General", ...new Set(all)];
  }, [filtered]);

  const sprintFiltered = useMemo(() => {
    if (selectedSprint === "General") return filtered;
    return filtered.filter((hu) => hu.Sprint === selectedSprint);
  }, [filtered, selectedSprint]);

  // build burndown dataset
  
const burndownDataFor = (rows) =>
  rows.map((row) => {
    const original = Number(row["Original Estimate"]) || 0;
    const completed = Number(row["Completed Work"]) || 0;
    const remaining = Math.max(0, original - completed);

    const start = row["Start Date"] ? new Date(row["Start Date"]) : new Date();
    const due = row["Due Date"] ? new Date(row["Due Date"]) : new Date();
    const today = new Date();

    const {
      elapsedDays,
      delayHours,
      delayDays,
      capacityHoursUntilDue,
      capacityDaysUntilDue,
    } = calculateElapsedAndDelay(start, due, today, original, completed);

    return {
      Title: row.Title || "",
      OriginalHours: original,
      CompletedHours: completed,
      RemainingHours: remaining,
      DelayHours: delayHours,
      DelayDays: delayDays,
      CapacityHoursUntilDue: capacityHoursUntilDue,
      CapacityDaysUntilDue: capacityDaysUntilDue,
      Sprint: row.Sprint || "",
    };
  });

  const burndownData = useMemo(
    () => burndownDataFor(sprintFiltered),
    [sprintFiltered]
  );

  // actions
  const onAddHU = () => {
    if (!newHU.Title || !newHU.State) return;
    const toAdd = {
      ...newHU,
      Initiative: selectedInitiative || newHU.Initiative,
      Sprint: newHU.Sprint || "",
    };
    dispatch(addHU(toAdd));
    setNewHU({
      Title: "",
      State: "ToDo",
      "Assigned To": "",
      "Original Estimate": "",
      "Completed Work": 0,
      "Remaining Work": "",
      "Start Date": "",
      "Due Date": "",
      Initiative: selectedInitiative || "",
      Sprint: "",
    });
  };

  const onEditHU = (index, key, value) =>
    dispatch(editHU({ index, key, value }));

  const onDeleteHU = (index) => dispatch(removeHU(index));

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="m-0">
          📊 Historias de Usuario —{" "}
          <span className="text-primary">
            {selectedInitiative || "…"}
          </span>
        </h2>
        <nav>
          <Link to="/initiatives" className="btn btn-outline-secondary">
            Volver a Iniciativas
          </Link>
        </nav>
      </div>

      {/* Upload Excel */}
      <div className="mb-4">
        <label className="form-label">
          Cargar Excel (se asigna a: {selectedInitiative || "—"})
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          className="form-control"
          onChange={handleFileUpload}
        />
      </div>

      {/* Formulario HU */}
      <HUForm newHU={newHU} setNewHU={setNewHU} handleAddHU={onAddHU} />

      {/* Sprint filter */}
      <div className="mb-3">
        <label className="form-label fw-bold">Filtrar por Sprint</label>
        <select
          className="form-select"
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

      {/* Tabla HU */}
      <HUTable
        data={sprintFiltered}
        handleEdit={onEditHU}
        onDelete={onDeleteHU}
      />

      {/* Chart */}
      <BurndownChart
        burndownData={burndownData}
        initiative={selectedInitiative}
      />
    </div>
  );
}
