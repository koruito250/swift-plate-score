import { isPreviewHostname } from "./pwa-policy";

export async function registerAppWorker(onReady: () => void, onError: () => void) {
  if (!("serviceWorker" in navigator)) return;
  const refused = !import.meta.env.PROD || window.self !== window.top
    || isPreviewHostname(window.location.hostname)
    || new URLSearchParams(window.location.search).get("sw") === "off";
  if (refused) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter(registration => {
      const worker = registration.active ?? registration.waiting ?? registration.installing;
      return worker && new URL(worker.scriptURL).pathname === "/sw.js";
    }).map(registration => registration.unregister()));
    console.info("[CorpMind PWA] Offline desativado neste ambiente.");
    return;
  }
  const { registerSW } = await import("virtual:pwa-register");
  registerSW({ immediate: true, onOfflineReady: onReady, onRegisterError: onError,
    onRegisteredSW: (_url, registration) => {
      console.info("[CorpMind PWA] Atualizações automáticas ativadas.");
      window.addEventListener("online", () => { void registration?.update(); });
    },
  });
}