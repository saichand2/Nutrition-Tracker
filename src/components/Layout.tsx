import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 flex-1 items-center justify-center rounded-lg px-2 py-2 text-xs font-medium transition sm:flex-none sm:px-3 sm:text-sm ${
    isActive ? "bg-emerald-100 text-emerald-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

export function Layout() {
  const { isConfigured, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80">
      <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
          <span className="shrink-0 text-center text-sm font-semibold text-slate-900 sm:text-left">
            Nutrition Tracker
          </span>
          <div className="flex w-full flex-wrap items-center justify-center gap-1 sm:w-auto sm:justify-end">
            <NavLink to="/" className={linkClass} end>
              <span className="sm:hidden">Home</span>
              <span className="hidden sm:inline">Dashboard</span>
            </NavLink>
            <NavLink to="/calendar" className={linkClass}>
              Calendar
            </NavLink>
            <NavLink to="/exercise" className={linkClass}>
              Exercise
            </NavLink>
            <NavLink to="/meals" className={linkClass}>
              <span className="sm:hidden">Meals</span>
              <span className="hidden sm:inline">Custom meals</span>
            </NavLink>
            {isConfigured && (
              <button
                type="button"
                onClick={() => void signOut()}
                className="min-h-11 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:text-sm"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
