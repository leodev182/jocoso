import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ProductStatus } from '../../../../domain/products/entities/product.entity';

export class UpdateProductDto {
  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  slug?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  brand?: string;

  @IsOptional() @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional() @IsBoolean()
  featured?: boolean;
}
