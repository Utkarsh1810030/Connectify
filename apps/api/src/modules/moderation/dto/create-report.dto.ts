import { IsString, IsUUID, IsOptional, MaxLength } from 'class-validator';
export class CreateReportDto {
  @IsUUID()
  reportedUserId: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsString()
  @MaxLength(200)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
