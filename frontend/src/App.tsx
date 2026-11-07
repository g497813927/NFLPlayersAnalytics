import { DataProvider } from './state/DataProvider';
import { AppShell } from './layout/AppShell';
import { FavoriteTeamsProvider } from './features/favorites/FavoriteTeamsProvider';

export default function App() {
  return (
    <DataProvider>
      <FavoriteTeamsProvider>
        <AppShell />
      </FavoriteTeamsProvider>
    </DataProvider>
  );
}
