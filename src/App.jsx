import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { DateRangeProvider } from './context/DateRangeContext';
import { I18nProvider } from './context/I18nContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import AudienceDashboard from './pages/AudienceDashboard';
import ConfiguratorDashboard from './pages/ConfiguratorDashboard';
import ConversionDashboard from './pages/ConversionDashboard';
import JourneyDashboard from './pages/JourneyDashboard';
import MarketingDashboard from './pages/MarketingDashboard';
import VisitorsPage from './pages/VisitorsPage';
import SettingsPage from './pages/SettingsPage';
import SessionReplayPage from './pages/SessionReplayPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout />;
};

const PublicRoute = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
};

const CatchAllRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<ExecutiveDashboard />} />
        <Route path="/audience" element={<AudienceDashboard />} />
        <Route path="/funnel" element={<ConfiguratorDashboard />} />
        <Route path="/conversion" element={<ConversionDashboard />} />
        <Route path="/journey" element={<JourneyDashboard />} />
        <Route path="/marketing" element={<MarketingDashboard />} />
        <Route path="/visitors" element={<VisitorsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/replay/:recordingId" element={<SessionReplayPage />} />
      <Route path="*" element={<CatchAllRoute />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <I18nProvider>
              <DateRangeProvider>
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </DateRangeProvider>
            </I18nProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
