// src/store/huSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  initiatives: [],
  selectedInitiative: "",
};

const normalizeRow = (raw) => {
  const original = Number(raw["Original Estimate"]) || 0;
  const completed = Number(raw["Completed Work"]) || 0;
  return {
    Title: raw.Title || "",
    State: raw.State || "ToDo",
    "Assigned To": raw["Assigned To"] || "",
    "Original Estimate": original,
    "Completed Work": completed,
    "Remaining Work": Math.max(0, original - completed),
    "Start Date": raw["Start Date"] || "",
    "Due Date": raw["Due Date"] || "",
    Initiative: raw.Initiative || "General",
    Sprint: raw.Sprint || "", 
  };
};

export const huSlice = createSlice({
  name: "hu",
  initialState,
  reducers: {
    setInitiatives: (state, { payload }) => {
      // payload: array completo de iniciativas (reemplaza)
      state.initiatives = payload;
    },
    addInitiative: (state, { payload }) => {
      // payload: { id, name, startDate, dueDate, stories: [] }
      state.initiatives.push(payload);
    },
    editInitiative: (state, { payload }) => {
      // { id, key, value }
      const { id, key, value } = payload;
      const idx = state.initiatives.findIndex((i) => i.id === id);
      if (idx !== -1) state.initiatives[idx][key] = value;
    },
    removeInitiativeById: (state, { payload }) => {
      // payload: id de la iniciativa
      state.initiatives = state.initiatives.filter((i) => i.id !== payload);
      // (Opcional) limpiar HUs relacionadas si alguna vez guardas InitiativeId en items
      // state.items = state.items.filter(hu => hu.InitiativeId !== payload);
    },

    loadFromExcel: (state, { payload }) => {
      state.items = payload.map(normalizeRow);
      const list = [...new Set(state.items.map((r) => r.Initiative || "General"))];
      state.selectedInitiative = list[0] || "";
      // NOTA: las iniciativas (catálogo) se manejan en otro lado
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
