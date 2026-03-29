import type { ReactNode } from "react";
import { useTracker } from "../context/TrackerContext";

export function TrackerReadyGate({ children }: { children: ReactNode }) {
  const { ready } = useTracker();
  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100/80 px-4">
        <p className="text-center text-slate-600">Loading your data…</p>
      </div>
    );
  }
  return children;
}
