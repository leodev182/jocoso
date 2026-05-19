import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ProductStatus } from '../../../../domain/products/entities/product.entity';

export class UpdateProductDto {
  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsEnum(ProductStatus)
  status?: ProductStatus;
}
