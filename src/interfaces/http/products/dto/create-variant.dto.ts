import { IsString, IsNumber, IsPositive, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AttributeDto {
  @IsString() name: string;
  @IsString() value: string;
}

export class CreateVariantDto {
  @IsString()
  sku: string;

  @IsNumber() @IsPositive()
  price: number;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AttributeDto)
  attributes?: AttributeDto[];
}
