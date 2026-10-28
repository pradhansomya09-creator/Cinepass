import dotenv from 'dotenv';
import path from 'path';

// Load .env from apps/api or workspace root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/movie_ticket_booking?schema=public',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'super_secret_cinepass_access_jwt_key_2026_secured',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'super_secret_cinepass_refresh_jwt_key_2026_secured',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_CinematicTicket2026',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'rzp_sec_SampleSecretKey998877',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_wh_WebhookSecretVerified123',
    mockMode: process.env.RAZORPAY_MOCK_MODE !== 'false', // default true for safe local dev
  },

  seatHoldDurationMinutes: parseInt(process.env.SEAT_HOLD_DURATION_MINUTES || '8', 10),

  email: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || '"CinePass Movie Booking" <no-reply@cinepass.com>',
  },
};
