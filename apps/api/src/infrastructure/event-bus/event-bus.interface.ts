export interface IEventBus {
  emit(event: string, payload: unknown): void;
  on(event: string, handler: (payload: unknown) => void | Promise<void>): void;
  off(event: string, handler: (payload: unknown) => void | Promise<void>): void;
}

export const EVENT_BUS = Symbol('EVENT_BUS');
