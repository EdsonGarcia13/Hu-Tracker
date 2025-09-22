// src/store/huSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  initiatives: [],
  selectedInitiative: "",
};

const normalizeRow = (raw) => {
  const original =
    Number(
      raw["Original Estimate"] ??
        raw.originalEstimate ??
        raw.original_estimate ??
        0
    ) || 0;
  const completed =
    Number(
      raw["Completed Work"] ??
        raw.completedWork ??
        raw.completed_work ??
        0
    ) || 0;

  const sprintValue =
    raw.Sprint !== undefined && raw.Sprint !== null
      ? raw.Sprint
      : raw.sprint !== undefined && raw.sprint !== null
      ? raw.sprint
      : "";

  const normalized = {
    id: raw.id ?? raw.ID ?? null,
    initiativeId:
      raw.initiativeId ?? raw.initiative_id ?? raw.InitiativeId ?? null,
    Title: raw.Title ?? raw.title ?? "",
    State: raw.State ?? raw.state ?? "ToDo",
    "Assigned To":
      raw["Assigned To"] ?? raw.assignedTo ?? raw.assigned_to ?? "",
    "Original Estimate": original,
    "Completed Work": completed,
    "Remaining Work": Math.max(0, original - completed),
    "Start Date":
      raw["Start Date"] ?? raw.startDate ?? raw.start_date ?? "",
    "Due Date": raw["Due Date"] ?? raw.dueDate ?? raw.due_date ?? "",
    Initiative: raw.Initiative ?? raw.initiative ?? "General",
    Sprint: sprintValue !== "" ? String(sprintValue) : "",
    isAdditional: raw.isAdditional ?? raw.is_additional ?? false,
  };

  if (raw["Completion Date"] || raw.completionDate || raw.completion_date) {
    normalized["Completion Date"] =
      raw["Completion Date"] ?? raw.completionDate ?? raw.completion_date;
  }

  return normalized;
};

export const huSlice = createSlice({
  name: "hu",
  initialState,
  reducers: {
    setInitiatives: (state, { payload }) => {
      state.initiatives = payload;
    },
    addInitiative: (state, { payload }) => {
      state.initiatives.push(payload);
    },
    editInitiative: (state, { payload }) => {
      const { id, key, value } = payload;
      const idx = state.initiatives.findIndex((i) => i.id === id);
      if (idx !== -1)
        state.initiatives[idx][key] =
          key === "sprintDays" ? Number(value) : value;
    },
    removeInitiativeById: (state, { payload }) => {
      state.initiatives = state.initiatives.filter((i) => i.id !== payload);
    },

    loadFromExcel: (state, { payload }) => {
      state.items = payload.map(normalizeRow);
      const list = [...new Set(state.items.map((r) => r.Initiative || "General"))];
      state.selectedInitiative = list[0] || "";
    },
    addHU: (state, { payload }) => {
      const normalized = normalizeRow({ ...payload, "Completed Work": 0 });
      state.items.push(normalized);
      state.selectedInitiative = normalized.Initiative;
    },
    editHU: (state, { payload }) => {
      const { index, key, value, filteredIndexesMap } = payload;
      const realIndex = filteredIndexesMap ? filteredIndexesMap[index] : index;
      const item = state.items[realIndex];
      if (!item) return;
      if (key === "Original Estimate" || key === "Completed Work") {
        const num = Number(value) || 0;
        item[key] = num;
        const original = Number(item["Original Estimate"]) || 0;
        const completed = Number(item["Completed Work"]) || 0;
        item["Remaining Work"] = Math.max(0, original - completed);
      } else {
        item[key] = value;
      }
    },
    removeHU: (state, { payload }) => {
      state.items.splice(payload, 1);
    },
    setSelectedInitiative: (state, { payload }) => {
      state.selectedInitiative = payload || "";
    },
  },
});

export const {
  setInitiatives,
  addInitiative,
  editInitiative,
  removeInitiativeById,
  loadFromExcel,
  addHU,
  editHU,
  removeHU,
  setSelectedInitiative,
} = huSlice.actions;

export default huSlice.reducer;
