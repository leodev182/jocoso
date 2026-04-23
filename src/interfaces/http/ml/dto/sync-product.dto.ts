import { IsString, IsIn } from 'class-validator';

export class SyncProductDto {
  @IsString()
  mlCategoryId: string;

  @IsIn(['new', 'used'])
  condition: 'new' | 'used';

  @IsString()
  listingType: string;
}
