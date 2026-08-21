import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  /**
   * CORS Configuration
   * - Supports FRONTEND_URL and CORS_ORIGIN environment variables (comma-separated if multiple).
   * - Dynamically matches Vercel production and preview deployment origins (*.vercel.app).
   * - Supports local development origins (localhost / 127.0.0.1).
   * - Echoes the specific origin (not '*') to allow credentials/authorization headers securely.
   */
  const allowedOriginsEnv = [
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
  ]
    .filter(Boolean)
    .flatMap((val) => (val ? val.split(',') : []))
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const isOriginAllowed = (origin: string | undefined): boolean => {
    // Allow non-browser requests with no origin header (e.g. health checks, server-to-server, mobile)
    if (!origin) return true;

    const cleanOrigin = origin.trim().replace(/\/+$/, '');

    // 1. Check against explicitly configured environment origins
    if (allowedOriginsEnv.includes(cleanOrigin)) {
      return true;
    }

    // 2. Allow Vercel production & preview deployment URLs
    if (/^https:\/\/.*\.vercel\.app$/.test(cleanOrigin)) {
      return true;
    }

    // 3. Allow localhost / 127.0.0.1 in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      if (
        /^https?:\/\/localhost(:\d+)?$/.test(cleanOrigin) ||
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(cleanOrigin)
      ) {
        return true;
      }
    }

    return false;
  };

  app.enableCors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        Logger.warn(`Blocked by CORS: ${origin}`, 'CORS');
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'Origin',
    ],
    exposedHeaders: ['Authorization', 'Content-Disposition'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
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

  /**
   * Swagger OpenAPI setup
   */
  const config = new DocumentBuilder()
    .setTitle('SegueMeet API')
    .setDescription('API documentation for the SegueMeet Board Management Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen(port, '0.0.0.0');
  Logger.log(
    `SegueMeet API listening on http://0.0.0.0:${port}`,
    'Bootstrap',
  );
}
bootstrap();
