import { Global, Module } from '@nestjs/common';
import { EMAIL_SERVICE } from '../../application/email/ports/email.port';
import { ResendEmailService } from './resend.service';

@Global()
@Module({
  providers: [
    { provide: EMAIL_SERVICE, useClass: ResendEmailService },
  ],
  exports: [EMAIL_SERVICE],
})
export class EmailModule {}
