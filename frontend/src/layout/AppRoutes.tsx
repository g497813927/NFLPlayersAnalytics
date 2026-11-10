import { Navigate, Route, Routes } from 'react-router-dom';
import {
  AthletesPage,
  GamesPage,
  HomePage,
  StandingsPage,
  StatisticsPage,
  TeamsPage,
} from '../pages';
import ManagementPage from '../management/ManagementPage';
import { AdminRoute } from '../features/auth/AdminRoute';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { ComparisonPage } from '../pages/ComparisonPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />
      <Route
        path="/register"
        element={<RegisterPage />}
      />
      <Route
        path="/"
        element={<HomePage />}
      />
      <Route
        path="/teams"
        element={<TeamsPage />}
      />
      <Route
        path="/athletes"
        element={<AthletesPage />}
      />
      <Route
        path="/games"
        element={<GamesPage />}
      />
      <Route
        path="/standings"
        element={<StandingsPage />}
      />
      <Route
        path="/statistics"
        element={<StatisticsPage />}
      />
      <Route
        path="/compare"
        element={<ComparisonPage />}
      />
      <Route
        path="/manage"
        element={
          <AdminRoute>
            <ManagementPage />
          </AdminRoute>
        }
      />
      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}
