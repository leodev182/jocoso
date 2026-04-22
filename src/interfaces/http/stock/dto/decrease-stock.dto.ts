import { IsUUID, IsInt, Min, IsEnum, IsOptional, IsString } from 'class-validator';
import { StockSource, ReferenceType } from '../../../../domain/stock/entities/stock-movement.entity';

export class DecreaseStockDto {
  @IsUUID()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsEnum(StockSource)
  source: StockSource;

  @IsEnum(ReferenceType)
  referenceType: ReferenceType;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}
