import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { Writable } from 'stream';
import { pushEntry } from '../logging/log-store';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pino = require('pino');

const bufferStream = new Writable({
  write(chunk: Buffer, _encoding: string, callback: () => void) {
    pushEntry(chunk.toString());
    callback();
  },
});

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          pinoHttp: [
            {
              level: config.get('LOG_LEVEL', 'info'),
              redact: ['req.headers.authorization', 'req.headers.cookie'],
              serializers: {
                req(req: any) {
                  return { method: req.method, url: req.url, id: req.id };
                },
                res(res: any) {
                  return { statusCode: res.statusCode };
                },
              },
              customProps: () => ({ context: 'HTTP' }),
            },
            pino.multistream([
              { stream: process.stdout },
              { stream: bufferStream },
            ]),
          ],
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
