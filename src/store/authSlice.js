// src/store/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  status: "checking",
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    startAuthChecking: (state) => {
      state.status = "checking";
    },
    setSession: (state, { payload }) => {
      state.user = payload;
      state.isAuthenticated = Boolean(payload);
      state.status = "ready";
      state.error = null;
    },
    clearSession: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.status = "ready";
      state.error = null;
    },
    setAuthError: (state, { payload }) => {
      state.error = payload || null;
      state.status = "ready";
      if (payload) {
        state.user = null;
        state.isAuthenticated = false;
      }
    },
  },
});

export const { startAuthChecking, setSession, clearSession, setAuthError } =
  authSlice.actions;
export default authSlice.reducer;
