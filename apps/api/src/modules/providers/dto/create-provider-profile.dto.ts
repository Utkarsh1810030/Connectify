import { IsString, IsArray, IsNumber, Min, MaxLength, ArrayMinSize, IsEnum, IsOptional } from 'class-validator';
import { ProviderCategory } from '@connectify/types';

export class CreateProviderProfileDto {
  @IsString()
  @MaxLength(100)
  displayName: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsArray()
  @IsEnum(['emotional_support', 'career_advice', 'language_practice', 'hobby_chat', 'study_buddy', 'general'], { each: true })
  @ArrayMinSize(1)
  categories: ProviderCategory[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  languages: string[];

  @IsNumber()
  @Min(1)
  chatRatePerMin: number;

  @IsNumber()
  @Min(1)
  voiceRatePerMin: number;

  @IsNumber()
  @Min(1)
  videoRatePerMin: number;
}
