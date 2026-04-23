import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            level: config.get('LOG_LEVEL', 'info'),
            transport: isProd
              ? undefined
              : { target: 'pino-pretty', options: { colorize: true, singleLine: true } },
            redact: ['req.headers.authorization', 'req.headers.cookie'],
            serializers: {
              req(req) {
                return { method: req.method, url: req.url, id: req.id };
              },
              res(res) {
                return { statusCode: res.statusCode };
              },
            },
            customProps: () => ({ context: 'HTTP' }),
          },
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
