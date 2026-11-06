import { useSyncExternalStore } from "react";

// Name shown in the installation popup. Pages that know the current restaurant
// (QR evaluation page, restaurant panel) set it; null falls back to CorpMind.
let current: string | null = null;
const listeners = new Set<() => void>();

export function setInstallBrand(name: string | null) {
  const next = name && name.trim() ? name.trim() : null;
  if (next === current) return;
  current = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInstallBrand(fallback = "CorpMind") {
  const name = useSyncExternalStore(subscribe, () => current, () => null);
  return name ?? fallback;
}
