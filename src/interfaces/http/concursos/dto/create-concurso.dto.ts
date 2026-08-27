import { IsString, IsNotEmpty, IsNumber, IsPositive, IsDateString, IsOptional, IsBoolean, IsUrl, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConcursoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  titulo: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  montoMinimo: number;

  @IsDateString()
  fechaDesde: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsString()
  @IsNotEmpty()
  reglas: string;

  @IsString()
  @IsNotEmpty()
  legal: string;

  @IsOptional()
  @IsUrl()
  imagenPromoUrl?: string;

  @IsBoolean()
  imagenPromoActiva: boolean;

  @IsBoolean()
  permiteMultiplesParticipaciones: boolean;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  minimoTickets: number;
}
