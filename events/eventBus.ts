import { EventEmitter } from "events";
import { DomainEventType, DomainEventMap } from "./eventTypes";

class EventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  emit<K extends DomainEventType>(event: K, data: DomainEventMap[K]): void {
    console.log(`[EventBus] Emitting event: ${event}`, data);
    this.emitter.emit(event, data);
  }

  on<K extends DomainEventType>(event: K, handler: (data: DomainEventMap[K]) => void | Promise<void>): void {
    this.emitter.on(event, (data) => {
      Promise.resolve(handler(data)).catch((err) => {
        console.error(`[EventBus] Error handling event ${event}:`, err);
      });
    });
  }
}

const globalForEventBus = globalThis as unknown as {
  eventBus: EventBus | undefined;
};

// Cache the instance on globalThis unconditionally. In Next.js production,
// instrumentation.ts (which registers listeners) and server actions (which emit)
// run in separate module contexts that each evaluate this module — so without a
// shared global the listeners would sit on a different EventBus than the emitter,
// and handlers would never fire. globalThis is the one object shared across those
// contexts within the single server process. (Also survives dev HMR.)
export const eventBus = globalForEventBus.eventBus ?? new EventBus();

globalForEventBus.eventBus = eventBus;
