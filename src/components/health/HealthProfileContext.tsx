"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { effectiveThreshold, profileByKey, type RiskProfile } from "@/lib/profiles";

const STORAGE_KEY = "aqi-now:health-profile";
const EMPTY: string[] = [];

/**
 * localStorage treated as an external store rather than mirrored into state.
 * That is what `useSyncExternalStore` exists for: it gives the server an empty
 * snapshot and the browser the saved one without a setState-in-effect round
 * trip, and it keeps multiple tabs in agreement.
 */
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: string[] } = { raw: null, value: EMPTY };

function emit() {
  for (const listener of listeners) listener();
}

/** Snapshots must be referentially stable between reads, hence the cache. */
function getSnapshot(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked entirely; treat that as nothing saved.
  }
  if (raw === cache.raw) return cache.value;

  let value = EMPTY;
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        value = parsed.filter((k): k is string => typeof k === "string" && !!profileByKey(k));
      }
    } catch {
      // A corrupt entry just means no saved profile.
    }
  }
  cache = { raw, value };
  return value;
}

function getServerSnapshot(): string[] {
  return EMPTY;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(next: string[]) {
  const raw = JSON.stringify(next);
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Private browsing can refuse writes; the selection still works in-session.
  }
  cache = { raw, value: next };
  emit();
}

interface HealthProfileValue {
  selected: string[];
  profiles: RiskProfile[];
  toggle: (key: string) => void;
  clear: () => void;
  /** Whether any at-risk profile is selected. */
  isAtRisk: boolean;
  /** US AQI at which this reader should act. */
  threshold: number;
}

const HealthProfileContext = createContext<HealthProfileValue | null>(null);

export function HealthProfileProvider({ children }: { children: React.ReactNode }) {
  const selected = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((key: string) => {
    const current = getSnapshot();
    write(current.includes(key) ? current.filter((k) => k !== key) : [...current, key]);
  }, []);

  const clear = useCallback(() => write([]), []);

  const value = useMemo<HealthProfileValue>(() => {
    const profiles = selected
      .map((key) => profileByKey(key))
      .filter((p): p is RiskProfile => Boolean(p));
    return {
      selected,
      profiles,
      toggle,
      clear,
      isAtRisk: profiles.some((p) => p.actionThreshold <= 76),
      threshold: effectiveThreshold(selected),
    };
  }, [selected, toggle, clear]);

  return <HealthProfileContext.Provider value={value}>{children}</HealthProfileContext.Provider>;
}

export function useHealthProfile(): HealthProfileValue {
  const context = useContext(HealthProfileContext);
  if (!context) throw new Error("useHealthProfile must be used inside HealthProfileProvider");
  return context;
}
