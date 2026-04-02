// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // ─── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:8080',
      // Ajouter ici les URLs de production
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // ─── Validation globale ───────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Ignore les champs non déclarés dans les DTOs
      forbidNonWhitelisted: true,
      transform: true,          // Transforme automatiquement les types
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Préfixe global /api ──────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── Swagger Documentation ────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Koogwe Transport API')
      .setDescription(
        'Backend API pour les applications passager et chauffeur Koogwe · Guyane française',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentification OTP par email')
      .addTag('Users', 'Gestion des profils utilisateurs')
      .addTag('Rides', 'Cycle de vie des courses')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    logger.log('📚 Swagger disponible sur http://localhost:3000/api/docs');
  }

  // ─── Démarrage ────────────────────────────────────────────────────────────
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 Koogwe API démarrée sur le port ${port}`);
  logger.log(`🌍 Environnement: ${process.env.NODE_ENV ?? 'development'}`);
}

bootstrap();
