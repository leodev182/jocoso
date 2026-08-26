import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested, IsArray, IsInt, Min, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class ManualOrderItemDto {
  @IsUUID()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateManualOrderDto {
  @IsUUID()
  userId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ManualOrderItemDto)
  items: ManualOrderItemDto[];

  @IsEnum(['CARD', 'TRANSFER', 'CASH'])
  origin: 'CARD' | 'TRANSFER' | 'CASH';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  adminNotes?: string;
}
