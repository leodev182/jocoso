import { Transform } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class MlWebhookDto {
  @IsString()
  resource: string;

  @IsString()
  topic: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? value : Number(value)))
  @IsNumber()
  user_id?: number;

  @IsOptional()
  @IsNumber()
  attempts?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? value : Number(value)))
  @IsNumber()
  application_id?: number;

  @IsOptional()
  @IsDateString()
  sent?: string;

  @IsOptional()
  @IsDateString()
  received?: string;
}
