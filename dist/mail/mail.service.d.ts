import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private config;
    private readonly logger;
    private transporter;
    constructor(config: ConfigService);
    sendOtp(email: string, code: string, language?: string): Promise<void>;
    sendWelcome(email: string, firstName: string, language?: string): Promise<void>;
    sendDriverApproved(email: string, firstName: string): Promise<void>;
    private getOtpSubject;
    private buildOtpTemplate;
    private buildWelcomeTemplate;
    private buildDriverApprovedTemplate;
}
