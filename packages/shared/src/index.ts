import { z } from 'zod';

// ==========================================
// ENUMS & CONSTANTS
// ==========================================

export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum SeatCategory {
  REGULAR = 'REGULAR',
  PREMIUM = 'PREMIUM',
  RECLINER = 'RECLINER',
}

export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  HELD = 'HELD',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const MovieCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  durationMinutes: z.coerce.number().int().positive('Duration must be positive'),
  releaseDate: z.string().or(z.date()),
  language: z.string().min(1, 'Language is required'),
  genres: z.array(z.string()).min(1, 'At least one genre is required'),
  posterUrl: z.string().url('Poster URL must be valid'),
  bannerUrl: z.string().url('Banner URL must be valid'),
  trailerUrl: z.string().url('Trailer URL must be valid').optional().or(z.literal('')),
  rating: z.coerce.number().min(0).max(10).default(0),
  ageClassification: z.string().default('UA'),
  director: z.string().min(1, 'Director is required'),
  cast: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  isComingSoon: z.boolean().default(false),
});

export const CityCreateSchema = z.object({
  name: z.string().min(2, 'City name is required'),
  state: z.string().min(2, 'State is required'),
});

export const CinemaCreateSchema = z.object({
  name: z.string().min(2, 'Cinema name is required'),
  cityId: z.string().min(1, 'City is required'),
  address: z.string().min(5, 'Address is required'),
  facilities: z.array(z.string()).default([]),
});

export const ScreenCreateSchema = z.object({
  name: z.string().min(1, 'Screen name is required'),
  cinemaId: z.string().min(1, 'Cinema is required'),
  soundType: z.string().default('Dolby Atmos 7.1'),
  screenType: z.string().default('4K Laser IMAX'),
});

export const ShowCreateSchema = z.object({
  movieId: z.string().min(1, 'Movie is required'),
  screenId: z.string().min(1, 'Screen is required'),
  startTime: z.string().or(z.date()),
  endTime: z.string().or(z.date()),
  priceRegular: z.coerce.number().positive('Regular price must be positive'),
  pricePremium: z.coerce.number().positive('Premium price must be positive'),
  priceRecliner: z.coerce.number().positive('Recliner price must be positive'),
  bookingOpenTime: z.string().or(z.date()).optional(),
  bookingCloseTime: z.string().or(z.date()).optional(),
});

export const SeatHoldSchema = z.object({
  showId: z.string().min(1, 'Show ID is required'),
  seatIds: z.array(z.string()).min(1, 'Select at least one seat').max(10, 'Maximum 10 seats allowed per booking'),
});

export const BookingCreateSchema = z.object({
  showId: z.string().min(1, 'Show ID is required'),
  seatHoldId: z.string().min(1, 'Seat hold session ID is required'),
  couponCode: z.string().optional(),
});

export const CouponValidateSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  showId: z.string().min(1, 'Show ID is required'),
  subtotal: z.coerce.number().positive(),
});

export const CouponCreateSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  description: z.string().min(5),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.coerce.number().positive(),
  minBookingAmount: z.coerce.number().nonnegative().default(0),
  maxDiscountAmount: z.coerce.number().positive().optional().nullable(),
  globalUsageLimit: z.coerce.number().int().positive().default(100),
  perUserUsageLimit: z.coerce.number().int().positive().default(1),
  validFrom: z.string().or(z.date()),
  validUntil: z.string().or(z.date()),
  isActive: z.boolean().default(true),
});

export const PaymentVerifySchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  razorpayOrderId: z.string().min(1, 'Order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Payment ID is required'),
  razorpaySignature: z.string().min(1, 'Signature is required'),
});

export const TicketValidateSchema = z.object({
  token: z.string().min(1, 'Ticket token is required'),
});

export const BookingCancelSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason is required'),
});

// ==========================================
// TYPE INFERENCES
// ==========================================

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type MovieCreateInput = z.infer<typeof MovieCreateSchema>;
export type ShowCreateInput = z.infer<typeof ShowCreateSchema>;
export type SeatHoldInput = z.infer<typeof SeatHoldSchema>;
export type BookingCreateInput = z.infer<typeof BookingCreateSchema>;
export type PaymentVerifyInput = z.infer<typeof PaymentVerifySchema>;
export type CouponCreateInput = z.infer<typeof CouponCreateSchema>;
