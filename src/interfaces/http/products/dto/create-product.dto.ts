import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString() @MinLength(2)
  title: string;

  @IsOptional() @IsString()
  description?: string;
}
