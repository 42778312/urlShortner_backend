import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // Each API controller declares its own 'api/...' prefix (see UrlsController,
  // HealthController) instead of using a Nest global prefix. A global prefix's
  // `exclude` option matches dynamic segments like ':code' as a wildcard against
  // ANY single-segment path (e.g. it would also swallow '/health' and '/docs'),
  // which would shadow those routes behind the redirect catch-all. Per-controller
  // prefixes keep the clean, unprefixed GET /:code redirect route unambiguous.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('URL Shortener API')
    .setDescription(
      'A backend-only URL shortener service. Submit a URL to receive a short code, then use the short code to redirect to the original URL.',
    )
    .setVersion('1.0')
    .addTag('URLs', 'Create and look up shortened URLs')
    .addTag('Health', 'Service health check')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
}

bootstrap();
