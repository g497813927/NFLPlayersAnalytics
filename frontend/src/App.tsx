import { DataProvider } from './state/DataProvider';
import { AppShell } from './layout/AppShell';

export default function App() {
  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}
