import { IsUUID, IsEnum } from 'class-validator';
import { SessionType } from '@connectify/types';
export class StartSessionDto {
  @IsUUID() providerId: string;
  @IsEnum(['chat', 'voice', 'video']) type: SessionType;
}
