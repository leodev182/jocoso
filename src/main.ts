import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { initSentry } from './infrastructure/monitoring/sentry';
import { SentryExceptionFilter } from './infrastructure/monitoring/sentry-exception.filter';

initSentry();

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
  app.useGlobalFilters(new SentryExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Jocoso API')
    .setDescription('API del storefront, operaciones e integraciones de Jocoso')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    jsonDocumentUrl: 'api/docs-json',
  });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  app.get(Logger).log(`App running on port ${port}`, 'Bootstrap');
}
bootstrap();
