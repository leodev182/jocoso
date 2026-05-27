import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateAddressDto {
  @IsString() @IsNotEmpty() alias: string;
  @IsString() @IsNotEmpty() fullName: string;
  @IsString() @IsNotEmpty() rut: string;
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @IsNotEmpty() region: string;
  @IsString() @IsNotEmpty() ciudad: string;
  @IsString() @IsNotEmpty() comuna: string;
  @IsString() @IsNotEmpty() calle: string;
  @IsString() @IsNotEmpty() numero: string;
  @IsOptional() @IsString() depto?: string;
  @IsOptional() @IsString() referencia?: string;
}
