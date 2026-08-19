import { IsString } from 'class-validator';

export class MlWebhookDto {
  @IsString()
  resource: string;

  @IsString()
  topic: string;

}
