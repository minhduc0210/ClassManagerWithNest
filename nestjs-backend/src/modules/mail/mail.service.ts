import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailService: MailerService) {}

  async sendResetPasswordEmail(
    toEmail: string,
    resetPassword: string,
  ): Promise<void> {
    try {
      await this.mailService.sendMail({
        from: process.env.MAIL_USER,
        to: toEmail,
        subject: 'Reset Password',
        text:
          `Hello,\n\nYour temporary password is: ${resetPassword}\n\n` +
          `Please use this password to verify and set a new password.\n\n` +
          `If you did not request this, please ignore this email.`,
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error);
    }
  }
}
