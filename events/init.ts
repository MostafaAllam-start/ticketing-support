import { registerNotificationListeners } from "./listeners/notificationListener";

// The guard lives on globalThis (not a module-level variable) so registration
// stays once-only even when this module is evaluated in more than one context —
// otherwise the listeners would be registered multiple times on the shared
// eventBus and every notification would be created N times.
const globalForListeners = globalThis as unknown as {
  eventListenersInitialized: boolean | undefined;
};

/**
 * Bootstraps all event listeners. Safe to call multiple times — only runs once.
 * Import this at the application entry point (e.g., layout.tsx or instrumentation.ts).
 */
export function initializeEventListeners(): void {
  if (globalForListeners.eventListenersInitialized) return;
  globalForListeners.eventListenersInitialized = true;
  registerNotificationListeners();
}
