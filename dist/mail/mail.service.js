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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
let MailService = MailService_1 = class MailService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(MailService_1.name);
        this.transporter = nodemailer.createTransport({
            host: this.config.get('MAIL_HOST'),
            port: Number(this.config.get('MAIL_PORT')),
            secure: this.config.get('MAIL_SECURE') === 'true',
            auth: {
                user: this.config.get('MAIL_USER'),
                pass: this.config.get('MAIL_PASS'),
            },
        });
    }
    async sendOtp(email, code, language = 'fr') {
        const subject = this.getOtpSubject(language);
        const html = this.buildOtpTemplate(code, language);
        try {
            await this.transporter.sendMail({
                from: this.config.get('MAIL_FROM'),
                to: email,
                subject,
                html,
            });
            this.logger.log(`OTP envoyé à ${email}`);
        }
        catch (error) {
            this.logger.error(`Échec envoi OTP à ${email}`, error.stack);
            throw new Error('Impossible d\'envoyer l\'email OTP');
        }
    }
    async sendWelcome(email, firstName, language = 'fr') {
        const subjects = {
            fr: 'Bienvenue sur Koogwe Transport 🚗',
            en: 'Welcome to Koogwe Transport 🚗',
            es: 'Bienvenido a Koogwe Transport 🚗',
            pt: 'Bem-vindo ao Koogwe Transport 🚗',
            ht: 'Byenveni nan Koogwe Transport 🚗',
        };
        const html = this.buildWelcomeTemplate(firstName, language);
        try {
            await this.transporter.sendMail({
                from: this.config.get('MAIL_FROM'),
                to: email,
                subject: subjects[language] ?? subjects.fr,
                html,
            });
        }
        catch (error) {
            this.logger.error(`Échec envoi welcome à ${email}`, error.stack);
        }
    }
    async sendDriverApproved(email, firstName) {
        try {
            await this.transporter.sendMail({
                from: this.config.get('MAIL_FROM'),
                to: email,
                subject: '✅ Votre compte chauffeur Koogwe est validé !',
                html: this.buildDriverApprovedTemplate(firstName),
            });
        }
        catch (error) {
            this.logger.error(`Échec envoi driver-approved à ${email}`, error.stack);
        }
    }
    getOtpSubject(language) {
        const subjects = {
            fr: 'Votre code de connexion Koogwe',
            en: 'Your Koogwe login code',
            es: 'Tu código de acceso Koogwe',
            pt: 'Seu código de acesso Koogwe',
            ht: 'Kòd koneksyon Koogwe ou',
        };
        return subjects[language] ?? subjects.fr;
    }
    buildOtpTemplate(code, language) {
        const texts = {
            fr: {
                title: 'Votre code de vérification',
                intro: 'Utilisez ce code pour vous connecter à Koogwe Transport.',
                label: 'Votre code :',
                expiry: 'Ce code expire dans 10 minutes.',
                ignore: 'Si vous n\'avez pas demandé ce code, ignorez cet email.',
                footer: 'Koogwe Transport · Guyane française',
            },
            en: {
                title: 'Your verification code',
                intro: 'Use this code to sign in to Koogwe Transport.',
                label: 'Your code:',
                expiry: 'This code expires in 10 minutes.',
                ignore: 'If you didn\'t request this code, please ignore this email.',
                footer: 'Koogwe Transport · French Guiana',
            },
            es: {
                title: 'Tu código de verificación',
                intro: 'Usa este código para iniciar sesión en Koogwe Transport.',
                label: 'Tu código:',
                expiry: 'Este código expira en 10 minutos.',
                ignore: 'Si no solicitaste este código, ignora este email.',
                footer: 'Koogwe Transport · Guayana Francesa',
            },
            pt: {
                title: 'Seu código de verificação',
                intro: 'Use este código para entrar no Koogwe Transport.',
                label: 'Seu código:',
                expiry: 'Este código expira em 10 minutos.',
                ignore: 'Se você não solicitou este código, ignore este e-mail.',
                footer: 'Koogwe Transport · Guiana Francesa',
            },
            ht: {
                title: 'Kòd verifikasyon ou',
                intro: 'Itilize kòd sa pou konekte nan Koogwe Transport.',
                label: 'Kòd ou:',
                expiry: 'Kòd sa fini nan 10 minit.',
                ignore: 'Si ou pa mande kòd sa, pa okipe imèl sa.',
                footer: 'Koogwe Transport · Gwiyàn fransé',
            },
        };
        const t = texts[language] ?? texts.fr;
        return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${t.title}</title>
</head>
<body style="margin:0;padding:0;background:#F2F4F7;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F4F7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#003FB1,#2170E4);padding:36px 40px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.12);border-radius:14px;padding:10px 24px;">
                <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">KOOGWE</span>
              </div>
              <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.6);letter-spacing:3px;margin-top:6px;">TRANSPORT</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#191C1E;letter-spacing:-0.5px;">${t.title}</h2>
              <p style="margin:0 0 32px;font-size:15px;color:#737686;line-height:1.6;">${t.intro}</p>

              <!-- Code block -->
              <div style="background:#F2F4F7;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#737686;letter-spacing:1.5px;text-transform:uppercase;">${t.label}</p>
                <div style="font-size:42px;font-weight:900;color:#1A56DB;letter-spacing:12px;font-family:'Courier New',monospace;">${code}</div>
              </div>

              <p style="margin:0 0 8px;font-size:13px;color:#737686;text-align:center;">⏱ ${t.expiry}</p>
              <p style="margin:0;font-size:12px;color:#B8BAC8;text-align:center;">${t.ignore}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F7F9FC;padding:20px 40px;border-top:1px solid #E0E3E6;">
              <p style="margin:0;font-size:12px;color:#B8BAC8;text-align:center;">${t.footer}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }
    buildWelcomeTemplate(firstName, language) {
        return `
<!DOCTYPE html>
<html lang="${language}">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F2F4F7;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F4F7;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#003FB1,#2170E4);padding:36px 40px;text-align:center;">
            <span style="font-size:22px;font-weight:900;color:#ffffff;">KOOGWE</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#191C1E;font-size:24px;font-weight:800;">Bonjour ${firstName} ! 👋</h2>
            <p style="color:#737686;font-size:15px;line-height:1.6;">
              Bienvenue sur Koogwe Transport, votre service VTC premium en Guyane française.
              Votre compte est maintenant actif et prêt à utiliser.
            </p>
            <div style="background:#F2F4F7;border-radius:16px;padding:24px;margin:24px 0;">
              <p style="margin:0;color:#191C1E;font-weight:600;">🚗 Commandez votre première course</p>
              <p style="margin:8px 0 0;color:#737686;font-size:13px;">Ouvrez l'application et découvrez nos services.</p>
            </div>
            <p style="color:#B8BAC8;font-size:12px;">Koogwe Transport · Guyane française</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    }
    buildDriverApprovedTemplate(firstName) {
        return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F2F4F7;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F4F7;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#003FB1,#2170E4);padding:36px 40px;text-align:center;">
            <span style="font-size:22px;font-weight:900;color:#ffffff;">KOOGWE</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="width:64px;height:64px;background:#E6F4EA;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:32px;">✅</div>
            </div>
            <h2 style="color:#191C1E;font-size:24px;font-weight:800;text-align:center;">Félicitations ${firstName} !</h2>
            <p style="color:#737686;font-size:15px;line-height:1.6;text-align:center;">
              Votre dossier a été validé. Vous pouvez maintenant vous connecter à l'application chauffeur et commencer à accepter des courses.
            </p>
            <div style="background:#E6F4EA;border-radius:16px;padding:20px;margin:24px 0;text-align:center;">
              <p style="margin:0;color:#1B7F37;font-weight:700;font-size:16px;">Compte chauffeur activé 🚗</p>
            </div>
            <p style="color:#B8BAC8;font-size:12px;text-align:center;">Koogwe Transport · Guyane française</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map