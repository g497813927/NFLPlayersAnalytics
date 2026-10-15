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

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/teams" element={<TeamsPage />} />
      <Route path="/athletes" element={<AthletesPage />} />
      <Route path="/games" element={<GamesPage />} />
      <Route path="/standings" element={<StandingsPage />} />
      <Route path="/statistics" element={<StatisticsPage />} />
      <Route path="/manage" element={<ManagementPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
