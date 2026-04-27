import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ProductStatus } from '../../../../domain/products/entities/product.entity';

export class ListProductsQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
