import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import authReducer from '../store/authSlice';
import ProtectedRoute from '../components/ProtectedRoute';

function renderWithAuth({ isAuthenticated, status = 'ready' }) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: isAuthenticated ? { id: '1' } : null,
        isAuthenticated,
        status,
        error: null,
      },
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute />}>
            <Route index element={<div>protected content</div>} />
          </Route>
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('ProtectedRoute', () => {
  test('renders child when authenticated', () => {
    renderWithAuth({ isAuthenticated: true });
    expect(screen.getByText('protected content')).toBeInTheDocument();
  });

  test('redirects to login when not authenticated', () => {
    renderWithAuth({ isAuthenticated: false });
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  test('shows loading message while checking session', () => {
    renderWithAuth({ isAuthenticated: false, status: 'checking' });
    expect(screen.getByText('Verificando sesión...')).toBeInTheDocument();
  });
});
