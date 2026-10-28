import nodemailer from 'nodemailer';
import { config } from '../config';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (config.email.user && config.email.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465,
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
      });
    }
  }

  public async sendEmail(options: { to: string; subject: string; html: string; text?: string }) {
    console.log(`\n================= [TRANSACTIONAL EMAIL DISPATCH] =================`);
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`From: ${config.email.from}`);
    console.log(`------------------------------------------------------------------`);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: config.email.from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.subject,
        });
        console.log(`[EMAIL SENT VIA SMTP SUCCESSFULLY]`);
      } catch (err) {
        console.error(`[SMTP ERROR]:`, err);
      }
    } else {
      console.log(`[DEV MODE]: Email logged to console (Configure SMTP credentials in .env to deliver real emails)`);
    }
    console.log(`==================================================================\n`);
  }

  public async sendBookingConfirmation(to: string, details: {
    bookingRef: string;
    movieTitle: string;
    cinemaName: string;
    screenName: string;
    showTime: string;
    seats: string;
    amount: number;
  }) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 8px;">
        <h2 style="color: #e11d48; text-align: center;">🎬 CinePass Booking Confirmed!</h2>
        <p>Dear Moviegoer,</p>
        <p>Your booking <strong>${details.bookingRef}</strong> is confirmed. Details below:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; color: #cbd5e1;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #334155;"><strong>Movie:</strong></td><td style="padding: 8px; border-bottom: 1px solid #334155;">${details.movieTitle}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #334155;"><strong>Cinema:</strong></td><td style="padding: 8px; border-bottom: 1px solid #334155;">${details.cinemaName} (${details.screenName})</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #334155;"><strong>Date & Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #334155;">${details.showTime}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #334155;"><strong>Seats:</strong></td><td style="padding: 8px; border-bottom: 1px solid #334155;">${details.seats}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #334155;"><strong>Total Paid:</strong></td><td style="padding: 8px; border-bottom: 1px solid #334155; color: #4ade80; font-weight: bold;">₹${details.amount}</td></tr>
        </table>
        <p style="margin-top: 20px; font-size: 13px; color: #94a3b8; text-align: center;">
          Show this email or your QR code e-ticket at the cinema entrance for entry. Enjoy the show!
        </p>
      </div>
    `;

    await this.sendEmail({
      to,
      subject: `Booking Confirmed: ${details.movieTitle} [${details.bookingRef}]`,
      html,
    });
  }

  public async sendPasswordReset(to: string, token: string) {
    const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 8px;">
        <h2 style="color: #e11d48;">Password Reset Request</h2>
        <p>You requested to reset your CinePass password. Click the link below to set a new password:</p>
        <p style="margin: 25px 0;">
          <a href="${resetUrl}" style="background: #e11d48; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </p>
        <p style="color: #94a3b8; font-size: 12px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    await this.sendEmail({
      to,
      subject: 'Reset Your CinePass Password',
      html,
    });
  }
}

export const emailService = new EmailService();
export default emailService;
