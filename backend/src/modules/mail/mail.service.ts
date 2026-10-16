import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Mail architecture only. The default provider logs to the console so the
 * email-verification / password-reset flows are fully testable without an
 * external service. Swap `provider` (env MAIL_PROVIDER) for SES/Resend/etc.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async send(message: MailMessage): Promise<void> {
    const provider = this.config.get<string>('mail.provider', 'console');
    const from = this.config.get<string>('mail.from');

    if (provider === 'console') {
      this.logger.log(`✉️  [${from}] -> ${message.to} | ${message.subject}\n${message.text}`);
      return;
    }

    // TODO: integrate a real provider (Resend, SES, Postmark...) keyed by `provider`.
    this.logger.warn(`Mail provider "${provider}" not implemented; message dropped.`);
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    await this.send({
      to,
      subject: 'Verify your Kiddy account',
      text: `Welcome to Kiddy! Verify your email with this token: ${token}`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    await this.send({
      to,
      subject: 'Reset your Kiddy password',
      text: `Use this token to reset your password: ${token}`,
    });
  }
}
