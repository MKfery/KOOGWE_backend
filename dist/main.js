"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: [
            'http://localhost:3000',
            'http://localhost:8080',
        ],
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.setGlobalPrefix('api');
    if (process.env.NODE_ENV !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Koogwe Transport API')
            .setDescription('Backend API pour les applications passager et chauffeur Koogwe · Guyane française')
            .setVersion('1.0')
            .addBearerAuth()
            .addTag('Auth', 'Authentification OTP par email')
            .addTag('Users', 'Gestion des profils utilisateurs')
            .addTag('Rides', 'Cycle de vie des courses')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: { persistAuthorization: true },
        });
        logger.log('📚 Swagger disponible sur http://localhost:3000/api/docs');
    }
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    logger.log(`🚀 Koogwe API démarrée sur le port ${port}`);
    logger.log(`🌍 Environnement: ${process.env.NODE_ENV ?? 'development'}`);
}
bootstrap();
//# sourceMappingURL=main.js.map