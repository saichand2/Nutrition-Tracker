import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TrackerProvider } from "./context/TrackerContext";
import { Layout } from "./components/Layout";
import { TrackerReadyGate } from "./components/TrackerReadyGate";
import { DashboardPage } from "./pages/DashboardPage";
import { CalendarPage } from "./pages/CalendarPage";
import { CustomMealsPage } from "./pages/CustomMealsPage";
import { LoginPage } from "./pages/LoginPage";

function AppRoutes() {
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
      <TrackerReadyGate>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="meals" element={<CustomMealsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TrackerReadyGate>
    </TrackerProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
