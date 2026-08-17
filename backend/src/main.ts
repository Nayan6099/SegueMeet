import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * CORS — permissive in development.
   * Restrict origins in production by setting the CORS_ORIGIN environment variable.
   */
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  /**
   * Global ValidationPipe — applied to every controller.
   * - whitelist: strips properties not present in the DTO class.
   * - forbidNonWhitelisted: throws 400 if unknown properties are sent.
   * - transform: automatically converts plain JSON payloads into DTO class instances.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  console.log(`SegueMeet API listening on http://localhost:${port}`);
}
bootstrap();

