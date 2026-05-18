import { Injectable } from '@nestjs/common';
import EventEmitter2 from 'eventemitter2';
import { IEventBus } from './event-bus.interface';

@Injectable()
export class LocalEventBus implements IEventBus {
  private readonly emitter = new EventEmitter2({ wildcard: true, maxListeners: 50 });

  emit(event: string, payload: unknown): void {
    this.emitter.emit(event, payload);
  }

  on(event: string, handler: (payload: unknown) => void | Promise<void>): void {
    this.emitter.on(event, handler);
  }

  off(event: string, handler: (payload: unknown) => void | Promise<void>): void {
    this.emitter.off(event, handler);
  }
}
