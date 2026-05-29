import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(','),
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
  });
  const config = app.get(ConfigService);

  app.use(helmet());

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useLogger(app.get(Logger));

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  app.get(Logger).log(`App running on port ${port}`, 'Bootstrap');
}
bootstrap();
