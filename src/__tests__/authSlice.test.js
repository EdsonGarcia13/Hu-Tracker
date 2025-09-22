import reducer, {
  clearSession,
  setAuthError,
  setSession,
  startAuthChecking,
} from '../store/authSlice';

describe('authSlice', () => {
  test('setSession stores user and marks authenticated', () => {
    const user = { id: '123', email: 'test@example.com' };
    const state = reducer(undefined, setSession(user));
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
    expect(state.status).toBe('ready');
    expect(state.error).toBeNull();
  });

  test('clearSession resets auth state', () => {
    const initial = {
      user: { id: '1' },
      isAuthenticated: true,
      status: 'ready',
      error: 'oops',
    };
    const state = reducer(initial, clearSession());
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.status).toBe('ready');
    expect(state.error).toBeNull();
  });

  test('startAuthChecking sets status to checking', () => {
    const state = reducer(undefined, startAuthChecking());
    expect(state.status).toBe('checking');
  });

  test('setAuthError stores error and clears authentication when message provided', () => {
    const initial = {
      user: { id: '1' },
      isAuthenticated: true,
      status: 'ready',
      error: null,
    };
    const state = reducer(initial, setAuthError('failed'));
    expect(state.error).toBe('failed');
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.status).toBe('ready');
  });

  test('setAuthError removes error without clearing user when null is provided', () => {
    const initial = {
      user: { id: '1' },
      isAuthenticated: true,
      status: 'ready',
      error: 'previous',
    };
    const state = reducer(initial, setAuthError(null));
    expect(state.error).toBeNull();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(initial.user);
  });
});
