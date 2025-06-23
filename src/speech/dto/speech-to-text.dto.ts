import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class SpeechToTextDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2}-[A-Z]{2}$/, {
    message: 'languageCode must be in format xx-XX (e.g. en-US)',
  })
  languageCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sampleRateHertz?: number;
}
