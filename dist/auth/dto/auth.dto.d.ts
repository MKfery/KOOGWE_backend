export declare class SendOtpDto {
    email: string;
    language?: string;
}
export declare class VerifyOtpDto {
    email: string;
    code: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        avatarUrl: string | null;
        role: string;
        isVerified: boolean;
        language: string;
    };
    isNewUser: boolean;
}
