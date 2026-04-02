import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SendOtpDto, VerifyOtpDto } from './dto/auth.dto';
export declare class AuthService {
    private prisma;
    private jwt;
    private config;
    private mail;
    private readonly logger;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, mail: MailService);
    private generateOtp;
    sendOtp(dto: SendOtpDto): Promise<{
        message: string;
        expiresIn: number;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatarUrl: string;
            role: import(".prisma/client").$Enums.UserRole;
            isVerified: boolean;
            language: string;
            hasDriver: boolean;
            driverStatus: import(".prisma/client").$Enums.DriverStatus;
        };
        isNewUser: boolean;
        accessToken: string;
        refreshToken: string;
    }>;
    refreshTokens(userId: string, refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<void>;
    updateFcmToken(userId: string, fcmToken: string): Promise<void>;
    private generateTokens;
}
