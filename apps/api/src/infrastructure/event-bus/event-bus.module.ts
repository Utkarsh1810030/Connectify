import { Module } from '@nestjs/common';
import { LocalEventBus } from './local-event-bus';
import { EVENT_BUS } from './event-bus.interface';

@Module({
  providers: [{ provide: EVENT_BUS, useClass: LocalEventBus }],
  exports: [EVENT_BUS],
})
export class EventBusModule { }
