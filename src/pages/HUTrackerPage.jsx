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
import SprintBurndownChart from "../components/SprintBurndownChart";
import {
  WORK_HOURS_PER_DAY,
  calculateElapsedAndDelay,
  businessDaysBetween,
} from "../utils/timeCalculations";
import { useParams, Link } from "react-router-dom";
import { initiativesMock } from "../mocks/initiativesMock";

export default function HUTrackerPage() {
  const { id } = useParams(); // initiative id
  const dispatch = useDispatch();
  const { items, selectedInitiative, initiatives } = useSelector((s) => s.hu);

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
    isAdditional: false,
  });

  const [selectedSprint, setSelectedSprint] = useState("General");

  // hydrate from mock initiative
  useEffect(() => {
    const ini = initiativesMock.find((x) => x.id === id);
    if (!ini) return;
    const rowsFromMock = ini.stories.map((s) => ({
      ...s,
      Initiative: ini.name,
      Sprint: s.Sprint != null || s.sprint != null ? String(s.Sprint ?? s.sprint) : "",
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

  const currentInitiative = useMemo(
    () => initiatives.find((i) => i.name === selectedInitiative),
    [initiatives, selectedInitiative]
  );

  const totalPlannedSprints = useMemo(() => {
    if (
      currentInitiative?.startDate &&
      currentInitiative?.dueDate &&
      currentInitiative?.sprintDays
    ) {
      const days = businessDaysBetween(
        new Date(currentInitiative.startDate),
        new Date(currentInitiative.dueDate)
      );
      return Math.ceil(days / currentInitiative.sprintDays);
    }
    return 0;
  }, [currentInitiative]);

  // filter by sprint
  const availableSprints = useMemo(() => {
    const all = filtered.map((hu) => String(hu.Sprint)).filter(Boolean);
    for (let i = 1; i <= totalPlannedSprints; i++) {
      all.push(String(i));
    }
    return ["General", ...new Set(all)];
  }, [filtered, totalPlannedSprints]);

  const sprintFiltered = useMemo(() => {
    if (selectedSprint === "General") return filtered;
    return filtered.filter((hu) => hu.Sprint === selectedSprint);
  }, [filtered, selectedSprint]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const minStartDate = useMemo(() => {
    const start = currentInitiative?.startDate;
    if (start) {
      return new Date(start) > new Date(todayStr) ? start : todayStr;
    }
    return todayStr;
  }, [currentInitiative, todayStr]);
  const maxEndDate = currentInitiative?.dueDate || "";

  // build burndown dataset

  const burndownDataFor = (rows) =>
    rows.map((row) => {
      const original = Number(row["Original Estimate"]) || 0;
      const completed = Number(row["Completed Work"]) || 0;
      const remaining = Math.max(0, original - completed);

      const start = row["Start Date"]
        ? new Date(row["Start Date"])
        : new Date();
      const due = row["Due Date"] ? new Date(row["Due Date"]) : new Date();
      const today = new Date();

      const {
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
    if (currentInitiative) {
      const sprintNum = Number(newHU.Sprint);
      if (
        sprintNum < 1 ||
        (totalPlannedSprints && sprintNum > totalPlannedSprints)
      ) {
        alert("Sprint fuera de rango");
        return;
      }
      if (newHU["Start Date"] && newHU["Start Date"] < minStartDate) {
        alert("La fecha de inicio no puede ser anterior al inicio de la iniciativa ni al día de hoy");
        return;
      }
      if (newHU["Due Date"] && newHU["Start Date"] && newHU["Due Date"] < newHU["Start Date"]) {
        alert("La fecha fin debe ser posterior a la fecha de inicio");
        return;
      }
    }
    let isAdditional = false;
    if (newHU["Due Date"] && maxEndDate && newHU["Due Date"] > maxEndDate) {
      const confirmExtra = window.confirm(
        "La fecha fin excede la de la iniciativa. Se marcará como tarea adicional. ¿Deseas continuar?"
      );
      if (!confirmExtra) return;
      isAdditional = true;
    }
    const toAdd = {
      ...newHU,
      Initiative: selectedInitiative || newHU.Initiative,
      Sprint: newHU.Sprint ? String(newHU.Sprint) : "",
      isAdditional,
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
      isAdditional: false,
    });
  };

  const onEditHU = (index, key, value) => {
    if (currentInitiative) {
      if (key === "Sprint") {
        const num = Number(value);
        if (num < 1 || (totalPlannedSprints && num > totalPlannedSprints)) return;
      }
      if (key === "Start Date") {
        if (value < minStartDate || (maxEndDate && value > maxEndDate)) return;
      }
      if (key === "Due Date") {
        const startVal = items[index]["Start Date"] || minStartDate;
        if (value < startVal) return;
        const isAdditional = maxEndDate && value > maxEndDate;
        dispatch(editHU({ index, key: "Due Date", value }));
        dispatch(editHU({ index, key: "isAdditional", value: isAdditional }));
        return;
      }
    }
    dispatch(editHU({ index, key, value }));
  };

  const onDeleteHU = (index) => dispatch(removeHU(index));

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="m-0">
          📊 Historias de Usuario — {" "}
          <span className="text-primary">{selectedInitiative || "…"}</span>
        </h2>
        <nav>
          <Link to="/" className="btn btn-outline-secondary">
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
      <HUForm
        newHU={newHU}
        setNewHU={setNewHU}
        handleAddHU={onAddHU}
        minStart={minStartDate}
        maxEnd={maxEndDate}
        sprintLimit={totalPlannedSprints}
      />

      {/* Tabla HU */}
      <HUTable
        data={sprintFiltered}
        handleEdit={onEditHU}
        onDelete={onDeleteHU}
        availableSprints={availableSprints}
        selectedSprint={selectedSprint}
        setSelectedSprint={setSelectedSprint}
        startLimit={minStartDate}
        endLimit={maxEndDate}
        sprintLimit={totalPlannedSprints}
      />

      {/* Sprint Burndown */}
      <SprintBurndownChart
        tasks={sprintFiltered}
        sprintDays={currentInitiative?.sprintDays}
      />

      {/* Detalle por HU */}
      <BurndownChart
        burndownData={burndownData}
        initiative={selectedInitiative}
      />
    </div>
  );
}
