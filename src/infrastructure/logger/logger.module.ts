import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { Transform } from 'stream';
import { pushEntry } from '../logging/log-store';

// Duplica cada línea de log a stdout Y al buffer en memoria
const duplexStream = new Transform({
  transform(chunk: Buffer, _encoding: string, callback: () => void) {
    process.stdout.write(chunk);
    pushEntry(chunk.toString());
    callback();
  },
});

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: [
          {
            level: config.get('LOG_LEVEL', 'info'),
            redact: ['req.headers.authorization', 'req.headers.cookie'],
            serializers: {
              req(req: any) { return { method: req.method, url: req.url, id: req.id }; },
              res(res: any) { return { statusCode: res.statusCode }; },
            },
            customProps: () => ({ context: 'HTTP' }),
          },
          duplexStream,
        ],
      }),
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
