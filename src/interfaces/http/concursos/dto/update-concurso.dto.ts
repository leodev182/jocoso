import { IsString, IsNotEmpty, IsNumber, IsPositive, IsDateString, IsOptional, IsBoolean, IsUrl, MaxLength, Allow } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateConcursoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  titulo?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  montoMinimo?: number;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  reglas?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  legal?: string;

  @IsOptional()
  imagenPromoUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  imagenPromoActiva?: boolean;

  @IsOptional()
  @IsBoolean()
  permiteMultiplesParticipaciones?: boolean;
}
