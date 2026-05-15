import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class VariantMappingDto {
  @IsString()
  localVariantId: string;

  @IsOptional()
  @IsString()
  mlVariationId?: string;
}

export class LinkProductDto {
  @IsString()
  mlItemId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantMappingDto)
  variantMappings: VariantMappingDto[];
}
