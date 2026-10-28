import crypto from 'crypto';
import { config } from '../config';

// Razorpay SDK interface
export interface RazorpayOrderOptions {
  amount: number; // in paise
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  isMock?: boolean;
}

export class PaymentGatewayService {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;
  private isMockMode: boolean;

  constructor() {
    this.keyId = config.razorpay.keyId;
    this.keySecret = config.razorpay.keySecret;
    this.webhookSecret = config.razorpay.webhookSecret;
    // Mock mode active if using dummy test keys
    this.isMockMode = this.keyId.startsWith('rzp_test_Cinematic') || !process.env.RAZORPAY_KEY_ID;
  }

  public getPublicKey(): string {
    return this.keyId;
  }

  public isSandbox(): boolean {
    return this.isMockMode;
  }

  /**
   * Create Razorpay Order
   */
  public async createOrder(options: RazorpayOrderOptions): Promise<RazorpayOrderResult> {
    if (this.isMockMode) {
      const mockOrderId = 'order_mock_' + crypto.randomBytes(8).toString('hex');
      console.log(`[PAYMENT GATEWAY (SANDBOX)] Created mock order: ${mockOrderId} for amount: ₹${options.amount / 100}`);
      return {
        id: mockOrderId,
        amount: options.amount,
        currency: options.currency || 'INR',
        receipt: options.receipt,
        status: 'created',
        isMock: true,
      };
    }

    try {
      const Razorpay = require('razorpay');
      const instance = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });

      const order = await instance.orders.create({
        amount: options.amount,
        currency: options.currency || 'INR',
        receipt: options.receipt,
        notes: options.notes,
      });

      return order;
    } catch (error) {
      console.error('[RAZORPAY ERROR] Failed to create order:', error);
      throw new Error('Payment gateway order creation failed');
    }
  }

  /**
   * Cryptographically verify payment signature
   * signature = HMAC-SHA256(order_id + "|" + payment_id, secret)
   */
  public verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    if (this.isMockMode && signature.startsWith('sig_mock_')) {
      return true;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
    } catch (error) {
      console.error('[SIGNATURE VERIFICATION ERROR]:', error);
      return false;
    }
  }

  /**
   * Cryptographically verify Razorpay Webhook signature
   */
  public verifyWebhookSignature(payload: string, webhookSignature: string): boolean {
    if (this.isMockMode && webhookSignature === 'mock_webhook_signature') {
      return true;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(webhookSignature));
    } catch (error) {
      console.error('[WEBHOOK VERIFICATION ERROR]:', error);
      return false;
    }
  }
}

export const paymentGateway = new PaymentGatewayService();
export default paymentGateway;
