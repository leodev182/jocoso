import { IsDateString } from 'class-validator';

export class ReconcileMlOrdersDto {
  @IsDateString()
  since: string;
}
