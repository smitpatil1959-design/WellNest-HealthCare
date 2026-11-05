import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import { AppRoutes } from './routes/AppRoutes';
import { ErrorBoundary } from './components/system/ErrorBoundary';
import { OfflineBanner } from './components/system/OfflineBanner';
import { AuthReturnRecovery } from './components/auth/AuthReturnRecovery';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <BrowserRouter>
          <OfflineBanner />
          <AuthReturnRecovery><AppRoutes /></AuthReturnRecovery>
        </BrowserRouter>
      </AppProviders>
    </ErrorBoundary>
  );
}
