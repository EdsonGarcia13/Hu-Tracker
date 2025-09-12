// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import huReducer from "./huSlice";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: {
    hu: huReducer,
    auth: authReducer,
  },
});
