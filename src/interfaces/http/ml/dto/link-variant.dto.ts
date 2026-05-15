import { IsString } from 'class-validator';

export class LinkVariantDto {
  @IsString()
  mlVariationId: string;
}
