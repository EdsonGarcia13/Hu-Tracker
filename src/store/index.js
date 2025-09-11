// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import huReducer from "./huSlice";

export const store = configureStore({
  reducer: {
    hu: huReducer,
  },
});
