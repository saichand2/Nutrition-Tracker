import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TrackerProvider } from "./context/TrackerContext";
import { WeightProvider } from "./context/WeightContext";
import { Layout } from "./components/Layout";
import { TrackerReadyGate } from "./components/TrackerReadyGate";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CalendarPage } from "./pages/CalendarPage";
import { CustomMealsPage } from "./pages/CustomMealsPage";
import { ExercisePage } from "./pages/ExercisePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { WeightPage } from "./pages/WeightPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { MicroPage } from "./pages/MicroPage";
import { LoginPage } from "./pages/LoginPage";

function MainApp() {
  const { isConfigured, loading, session } = useAuth();

  if (isConfigured && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100/80">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  if (isConfigured && !session) {
    return <LoginPage />;
  }

  return (
    <TrackerProvider>
      <WeightProvider>
        <TrackerReadyGate>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="meals" element={<CustomMealsPage />} />
              <Route path="exercise" element={<ExercisePage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="weight" element={<WeightPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="micros" element={<MicroPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </TrackerReadyGate>
      </WeightProvider>
    </TrackerProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="*" element={<MainApp />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
