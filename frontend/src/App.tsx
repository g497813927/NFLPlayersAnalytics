import { DataProvider } from './state/DataProvider';
import { AppShell } from './layout/AppShell';
import { FavoriteTeamsProvider } from './features/favorites/FavoriteTeamsProvider';
import { AuthProvider } from './features/auth/AuthProvider';

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <FavoriteTeamsProvider>
          <AppShell />
        </FavoriteTeamsProvider>
      </DataProvider>
    </AuthProvider>
  );
}
