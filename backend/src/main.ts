import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('apiPrefix', 'api');
  const port = config.get<number>('port', 4000);
  const corsOrigins = config.get<string[]>('corsOrigins', []);

  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // ─── Request logger ────────────────────────────────────────────────────────
  // Logs EVERY incoming request (method, path, status, duration, client IP) so
  // connection and routing problems are visible in the terminal.
  const httpLogger = new Logger('HTTP');
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const ip = req.headers['x-forwarded-for'] ?? req.socket.remoteAddress;
    res.on('finish', () => {
      const ms = Date.now() - start;
      const msg = `${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms) [${ip}]`;
      if (res.statusCode >= 500) httpLogger.error(msg);
      else if (res.statusCode >= 400) httpLogger.warn(msg);
      else httpLogger.log(msg);
    });
    next();
  });

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // ─── Swagger / OpenAPI ─────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Kiddy API')
    .setDescription('Kiddy backend — parents, children, activities, rewards, subscriptions.')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .addCookieAuth('refresh_token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Bind to all interfaces so physical devices on the LAN can connect too.
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`🚀 Kiddy API ready on http://0.0.0.0:${port}/${apiPrefix}/v1 (LAN + localhost)`);
  // eslint-disable-next-line no-console
  console.log(`📚 Swagger docs at http://localhost:${port}/${apiPrefix}/docs`);
}

bootstrap();
