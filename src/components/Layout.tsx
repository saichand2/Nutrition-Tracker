import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  {
    to: "/",
    end: true,
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10.707 2.293a1 1 0 0 0-1.414 0l-7 7a1 1 0 0 0 1.414 1.414L4 10.414V17a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3h2v3a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-6.586l.293.293a1 1 0 0 0 1.414-1.414l-7-7Z" />
      </svg>
    ),
  },
  {
    to: "/calendar",
    label: "Calendar",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: "/exercise",
    label: "Exercise",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M7.75 2.75a.75.75 0 0 0-1.5 0v1.258a32.987 32.987 0 0 0-3.599.278.75.75 0 1 0 .198 1.487A31.545 31.545 0 0 1 8 5.5a31.545 31.545 0 0 1 5.151.273.75.75 0 0 0 .198-1.487 32.987 32.987 0 0 0-3.599-.278V2.75ZM5.5 7.75a.75.75 0 0 0-1.5 0v5.5a.75.75 0 0 0 1.5 0v-5.5Zm9 0a.75.75 0 0 0-1.5 0v5.5a.75.75 0 0 0 1.5 0v-5.5Zm-4.5 0a.75.75 0 0 0-1.5 0v5.5a.75.75 0 0 0 1.5 0v-5.5Zm-1.5 7.5a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Zm-3 0a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Zm6 0a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Z" />
      </svg>
    ),
  },
  {
    to: "/meals",
    label: "Meals",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M6.75 2.75A.75.75 0 0 1 7.5 2c0 .414-.336.75-.75.75V8.5a2.5 2.5 0 0 0 5 0V2.75A.75.75 0 0 1 11.25 2a.75.75 0 0 1 .75.75v5.75a4 4 0 0 1-8 0V2.75ZM4 16.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75a.75.75 0 0 1-.75-.75Z" />
      </svg>
    ),
  },
  {
    to: "/analytics",
    label: "Analytics",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 3 0v-13A1.5 1.5 0 0 0 15.5 2ZM10 7A1.5 1.5 0 0 0 8.5 8.5v8A1.5 1.5 0 0 0 11 16.5v-8A1.5 1.5 0 0 0 10 7ZM4.5 12A1.5 1.5 0 0 0 3 13.5v3a1.5 1.5 0 0 0 3 0v-3A1.5 1.5 0 0 0 4.5 12Z" />
      </svg>
    ),
  },
  {
    to: "/weight",
    label: "Weight",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M10 2a1 1 0 0 1 .894.553l2.382 4.764 5.26.764a1 1 0 0 1 .554 1.706l-3.807 3.71.899 5.243a1 1 0 0 1-1.451 1.054L10 17.347l-4.73 2.487a1 1 0 0 1-1.452-1.054l.9-5.243-3.808-3.71a1 1 0 0 1 .554-1.706l5.26-.764L9.106 2.553A1 1 0 0 1 10 2Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: "/notifications",
    label: "Alerts",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M4 8a6 6 0 1 1 12 0v2.917c0 .574.228 1.124.634 1.530l1.922 1.922A.75.75 0 0 1 18 15.5H2a.75.75 0 0 1-.555-1.131L3.367 12.447A2.17 2.17 0 0 0 4 10.917V8Zm6 10a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2Z" clipRule="evenodd" />
      </svg>
    ),
  },
] as const;

function NavItem({ to, end, label, icon, onClick }: { to: string; end?: boolean; label: string; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-emerald-100 text-emerald-900"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

export function Layout() {
  const { isConfigured, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80">
      <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        {/* Top bar */}
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M9.5 2a.5.5 0 0 1 .5.5v.88a7 7 0 1 1-3.417.943.5.5 0 0 1 .834.552A5.5 5.5 0 1 0 10 3.88V2.5a.5.5 0 0 1 .5-.5H9.5Z" />
                <path d="M10 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 1.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-900">Nutrition Tracker</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden items-center gap-0.5 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
            {isConfigured && (
              <button
                type="button"
                onClick={() => void signOut()}
                className="ml-2 flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-1.08a.75.75 0 1 0-1.004-1.115l-2.5 2.25a.75.75 0 0 0 0 1.115l2.5 2.25a.75.75 0 1 0 1.004-1.115l-1.048-1.08H18.25A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
                </svg>
                Sign out
              </button>
            )}
          </div>

          {/* Mobile: hamburger */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 md:hidden">
            <div className="grid grid-cols-2 gap-1">
              {NAV_ITEMS.map((item) => (
                <NavItem key={item.to} {...item} onClick={() => setMenuOpen(false)} />
              ))}
            </div>
            {isConfigured && (
              <button
                type="button"
                onClick={() => { void signOut(); setMenuOpen(false); }}
                className="mt-2 flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-1.08a.75.75 0 1 0-1.004-1.115l-2.5 2.25a.75.75 0 0 0 0 1.115l2.5 2.25a.75.75 0 1 0 1.004-1.115l-1.048-1.08H18.25A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
                </svg>
                Sign out
              </button>
            )}
          </div>
        )}
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
