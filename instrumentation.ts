/**
 * Next.js instrumentation hook – runs once when the server starts.
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only register event listeners on the Node.js server runtime (not edge).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeEventListeners } = await import("@/events/init");
    initializeEventListeners();
  }
}
