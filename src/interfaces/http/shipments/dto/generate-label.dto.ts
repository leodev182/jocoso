import { IsString, IsNotEmpty, IsOptional, IsEmail, IsInt, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateLabelDto {
  @IsOptional() @IsString() trackingCode?: string;

  @IsString() @IsNotEmpty() fullName: string;
  @IsString() @IsNotEmpty() rut: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsNotEmpty() phone: string;

  @IsString() @IsNotEmpty() region: string;
  @IsString() @IsNotEmpty() ciudad: string;
  @IsString() @IsNotEmpty() comuna: string;
  @IsString() @IsNotEmpty() calle: string;
  @IsString() @IsNotEmpty() numero: string;
  @IsOptional() @IsString() depto?: string;
  @IsOptional() @IsString() referencia?: string;

  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() itemCount?: number;
  @IsOptional() @Type(() => Number) @Min(0) total?: number;
}
