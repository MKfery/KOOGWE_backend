"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwt, config, mail) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.mail = mail;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async sendOtp(dto) {
        const { email, language = 'fr' } = dto;
        const normalizedEmail = email.toLowerCase().trim();
        const existing = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { otpAttempts: true, otpExpiresAt: true, otpCode: true },
        });
        if (existing?.otpAttempts >= 5 && existing?.otpExpiresAt && existing.otpExpiresAt > new Date()) {
            throw new common_1.HttpException('Trop de tentatives. Veuillez réessayer dans 10 minutes.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const otpCode = this.generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await this.prisma.user.upsert({
            where: { email: normalizedEmail },
            create: {
                email: normalizedEmail,
                otpCode,
                otpExpiresAt: expiresAt,
                otpAttempts: 0,
                language,
            },
            update: {
                otpCode,
                otpExpiresAt: expiresAt,
                otpAttempts: 0,
                language,
            },
        });
        await this.mail.sendOtp(normalizedEmail, otpCode, language);
        this.logger.log(`OTP envoyé à ${normalizedEmail}`);
        return {
            message: 'Code OTP envoyé par email',
            expiresIn: 600,
        };
    }
    async verifyOtp(dto) {
        const { email, code } = dto;
        const normalizedEmail = email.toLowerCase().trim();
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: { driver: true },
        });
        if (!user) {
            throw new common_1.BadRequestException('Aucun compte trouvé pour cet email');
        }
        if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            throw new common_1.BadRequestException('Le code OTP a expiré. Veuillez en demander un nouveau.');
        }
        const maxAttempts = Number(this.config.get('OTP_MAX_ATTEMPTS', 5));
        if (user.otpAttempts >= maxAttempts) {
            throw new common_1.HttpException('Trop de tentatives incorrectes. Demandez un nouveau code.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        if (user.otpCode !== code) {
            await this.prisma.user.update({
                where: { email: normalizedEmail },
                data: { otpAttempts: { increment: 1 } },
            });
            const remaining = maxAttempts - user.otpAttempts - 1;
            throw new common_1.BadRequestException(`Code incorrect. ${remaining} tentative(s) restante(s).`);
        }
        const isNewUser = !user.isVerified;
        const updatedUser = await this.prisma.user.update({
            where: { email: normalizedEmail },
            data: {
                isVerified: true,
                otpCode: null,
                otpExpiresAt: null,
                otpAttempts: 0,
            },
        });
        if (isNewUser) {
            await this.mail.sendWelcome(normalizedEmail, user.firstName ?? 'là', user.language);
        }
        const tokens = await this.generateTokens(updatedUser.id, updatedUser.email, updatedUser.role);
        await this.prisma.user.update({
            where: { id: updatedUser.id },
            data: { refreshToken: tokens.refreshToken },
        });
        return {
            ...tokens,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                avatarUrl: updatedUser.avatarUrl,
                role: updatedUser.role,
                isVerified: updatedUser.isVerified,
                language: updatedUser.language,
                hasDriver: !!user.driver,
                driverStatus: user.driver?.status ?? null,
            },
            isNewUser,
        };
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true, refreshToken: true, isActive: true },
        });
        if (!user || !user.isActive || user.refreshToken !== refreshToken) {
            throw new common_1.UnauthorizedException('Session expirée. Veuillez vous reconnecter.');
        }
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: tokens.refreshToken },
        });
        return tokens;
    }
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null, fcmToken: null },
        });
    }
    async updateFcmToken(userId, fcmToken) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { fcmToken },
        });
    }
    async generateTokens(userId, email, role) {
        const payload = { sub: userId, email, role };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwt.signAsync(payload, {
                secret: this.config.get('JWT_ACCESS_SECRET'),
                expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
            }),
            this.jwt.signAsync(payload, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
                expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '30d'),
            }),
        ]);
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map