import { IsUUID, IsInt, Min, Max, IsOptional, IsString, MaxLength } from 'class-validator';
export class CreateRatingDto {
  @IsUUID() sessionId: string;
  @IsInt() @Min(1) @Max(5) score: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) helpfulness?: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) appropriateness?: number;
  @IsOptional() @IsString() @MaxLength(500) comment?: string;
}
