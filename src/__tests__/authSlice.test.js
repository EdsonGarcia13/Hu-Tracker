import reducer, { login, logout } from '../store/authSlice';

describe('authSlice', () => {
  test('login sets isAuthenticated true', () => {
    const state = reducer(undefined, login());
    expect(state.isAuthenticated).toBe(true);
  });

  test('logout sets isAuthenticated false', () => {
    const state = reducer({ isAuthenticated: true }, logout());
    expect(state.isAuthenticated).toBe(false);
  });
});
