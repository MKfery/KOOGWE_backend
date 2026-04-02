import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, RefreshTokenDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    refresh(dto: RefreshTokenDto, req: any): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(req: any): Promise<{
        message: string;
    }>;
    updateFcmToken(req: any, fcmToken: string): Promise<{
        message: string;
    }>;
    me(req: any): Promise<any>;
}
