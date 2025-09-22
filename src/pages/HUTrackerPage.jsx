import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { calculateElapsedAndDelay, businessDaysBetween } from "../utils/timeCalculations";
import { useParams, Link } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import {
  mapSupabaseHuToUi,
  mapSupabaseInitiativeToUi,
} from "../utils/supabaseMappers";

export default function HUTrackerPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { items, selectedInitiative, initiatives } = useSelector((s) => s.hu);
  const { user } = useSelector((s) => s.auth);

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
  const [initiativeFromDb, setInitiativeFromDb] = useState(null);
  const [husRecords, setHusRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [remoteError, setRemoteError] = useState("");

  const canQuery = Boolean(supabase && isSupabaseConfigured && user?.id && id);

  const fetchInitiative = useCallback(async () => {
    if (!canQuery) {
      dispatch(loadFromExcel([]));
      dispatch(setSelectedInitiative(""));
      setInitiativeFromDb(null);
      setHusRecords([]);
      return;
    }

    setLoading(true);
    setRemoteError("");
    const { data, error } = await supabase
      .from("initiatives")
      .select(
        "id, name, start_date, due_date, sprint_days, hus(id, initiative_id, title, state, assigned_to, original_estimate, completed_work, remaining_work, start_date, due_date, sprint, is_additional, completion_date))"
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      setRemoteError(error.message);
      dispatch(loadFromExcel([]));
      dispatch(setSelectedInitiative(""));
      setInitiativeFromDb(null);
      setHusRecords([]);
      setLoading(false);
      return;
    }

    const mappedInitiative = mapSupabaseInitiativeToUi(data);
    setInitiativeFromDb(mappedInitiative);
    setHusRecords(data.hus || []);
    dispatch(loadFromExcel(mappedInitiative.stories));
    dispatch(setSelectedInitiative(mappedInitiative.name));
    setNewHU((prev) => ({ ...prev, Initiative: mappedInitiative.name }));
    setSelectedSprint("General");
    setLoading(false);
  }, [canQuery, dispatch, id, user?.id]);

  useEffect(() => {
    fetchInitiative();
  }, [fetchInitiative]);

  const currentInitiative = useMemo(() => {
    const byId = initiatives.find((i) => i.id === id);
    if (byId) return byId;
    const byName = initiatives.find((i) => i.name === selectedInitiative);
    return byName || initiativeFromDb;
  }, [initiatives, selectedInitiative, initiativeFromDb, id]);

  const filtered = useMemo(() => {
    return selectedInitiative
      ? items.filter((r) => r.Initiative === selectedInitiative)
      : items;
  }, [items, selectedInitiative]);

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

  const onAddHU = async () => {
    if (!newHU.Title || !newHU.State) return;
    if (!canQuery) {
      setRemoteError(
        "No es posible agregar historias sin conexión con Supabase."
      );
      return;
    }

    if (currentInitiative) {
      const sprintNum = Number(newHU.Sprint);
      if (
        newHU.Sprint &&
        (sprintNum < 1 || (totalPlannedSprints && sprintNum > totalPlannedSprints))
      ) {
        alert("Sprint fuera de rango");
        return;
      }
      if (newHU["Start Date"] && newHU["Start Date"] < minStartDate) {
        alert(
          "La fecha de inicio no puede ser anterior al inicio de la iniciativa ni al día de hoy"
        );
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

    const payload = {
      initiative_id: id,
      title: newHU.Title.trim(),
      state: newHU.State,
      assigned_to: newHU["Assigned To"] || null,
      original_estimate: Number(newHU["Original Estimate"]) || 0,
      completed_work: 0,
      start_date: newHU["Start Date"] || null,
      due_date: newHU["Due Date"] || null,
      sprint: newHU.Sprint ? Number(newHU.Sprint) : null,
      is_additional: isAdditional,
    };

    const { data, error } = await supabase
      .from("hus")
      .insert(payload)
      .select(
        "id, initiative_id, title, state, assigned_to, original_estimate, completed_work, remaining_work, start_date, due_date, sprint, is_additional, completion_date"
      )
      .single();

    if (error) {
      setRemoteError(error.message);
      return;
    }

    const initiativeName =
      selectedInitiative || initiativeFromDb?.name || currentInitiative?.name || "";
    const mapped = mapSupabaseHuToUi(data, initiativeName);
    setHusRecords((prev) => [...prev, data]);
    dispatch(addHU(mapped));
    setRemoteError("");
    setNewHU({
      Title: "",
      State: "ToDo",
      "Assigned To": "",
      "Original Estimate": "",
      "Completed Work": 0,
      "Remaining Work": "",
      "Start Date": "",
      "Due Date": "",
      Initiative: initiativeName,
      Sprint: "",
      isAdditional: false,
    });
  };

  const onEditHU = async (index, key, value) => {
    if (!canQuery) {
      setRemoteError(
        "No es posible actualizar historias sin conexión con Supabase."
      );
      return;
    }

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
      }
    }

    const record = husRecords[index];
    if (!record) return;

    const updates = {};
    let dispatchValue = value;

    if (key === "Title") updates.title = value;
    if (key === "State") updates.state = value;
    if (key === "Assigned To") updates.assigned_to = value || null;
    if (key === "Original Estimate") {
      updates.original_estimate = Number(value) || 0;
      dispatchValue = updates.original_estimate;
    }
    if (key === "Completed Work") {
      updates.completed_work = Number(value) || 0;
      dispatchValue = updates.completed_work;
    }
    if (key === "Sprint") {
      updates.sprint = value ? Number(value) : null;
    }
    if (key === "Start Date") updates.start_date = value || null;
    if (key === "Due Date") {
      updates.due_date = value || null;
      updates.is_additional = maxEndDate && value > maxEndDate;
    }

    if (Object.keys(updates).length === 0) {
      dispatch(editHU({ index, key, value }));
      return;
    }

    const { data, error } = await supabase
      .from("hus")
      .update(updates)
      .eq("id", record.id)
      .eq("initiative_id", id)
      .select(
        "id, initiative_id, title, state, assigned_to, original_estimate, completed_work, remaining_work, start_date, due_date, sprint, is_additional, completion_date"
      )
      .single();

    if (error) {
      setRemoteError(error.message);
      return;
    }

    setRemoteError("");
    setHusRecords((prev) => {
      const next = [...prev];
      next[index] = data;
      return next;
    });

    if (key === "Due Date") {
      dispatch(editHU({ index, key: "Due Date", value }));
      dispatch(editHU({ index, key: "isAdditional", value: data.is_additional }));
      return;
    }

    if (key === "Sprint") {
      dispatch(
        editHU({
          index,
          key: "Sprint",
          value:
            data.sprint !== null && data.sprint !== undefined
              ? String(data.sprint)
              : "",
        })
      );
      return;
    }

    if (key === "Original Estimate" || key === "Completed Work") {
      dispatch(editHU({ index, key, value: dispatchValue }));
      return;
    }

    dispatch(editHU({ index, key, value }));
  };

  const onDeleteHU = async (index) => {
    if (!canQuery) {
      setRemoteError(
        "No es posible eliminar historias sin conexión con Supabase."
      );
      return;
    }

    const record = husRecords[index];
    if (!record) return;

    const { error } = await supabase
      .from("hus")
      .delete()
      .eq("id", record.id)
      .eq("initiative_id", id);

    if (error) {
      setRemoteError(error.message);
      return;
    }

    setRemoteError("");
    setHusRecords((prev) => prev.filter((_, i) => i !== index));
    dispatch(removeHU(index));
  };

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

      {remoteError && (
        <div className="alert alert-danger" role="alert">
          {remoteError}
        </div>
      )}
      {loading && (
        <div className="alert alert-info" role="status">
          Cargando historias...
        </div>
      )}

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

      <HUForm
        newHU={newHU}
        setNewHU={setNewHU}
        handleAddHU={onAddHU}
        minStart={minStartDate}
        maxEnd={maxEndDate}
        sprintLimit={totalPlannedSprints}
      />

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

      <SprintBurndownChart
        tasks={sprintFiltered}
        sprintDays={currentInitiative?.sprintDays}
        sprintName={selectedSprint}
      />

      <BurndownChart
        burndownData={burndownData}
        initiative={selectedInitiative}
      />
    </div>
  );
}
