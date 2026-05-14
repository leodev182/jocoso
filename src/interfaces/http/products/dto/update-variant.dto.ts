import { IsNumber, IsPositive, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AttributeDto {
  @IsOptional() name?: string;
  @IsOptional() value?: string;
}

export class UpdateVariantDto {
  @IsOptional() @IsNumber() @IsPositive()
  price?: number;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AttributeDto)
  attributes?: AttributeDto[];
}
