import React, { useState } from 'react';
import { CreditCard, QrCode, Building, ShieldCheck, CheckCircle2, X, Lock } from 'lucide-react';
import { api } from '../../services/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    bookingId: string;
    bookingReference: string;
    finalAmount: number;
    movie: { title: string; posterUrl: string };
    cinema: { name: string; screenName: string };
    seats: { label: string; category: string; price: number }[];
    payment: {
      orderId: string;
      keyId: string;
      amount: number;
      currency: string;
      isSandbox: boolean;
    };
  };
  onPaymentSuccess: (bookingId: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  bookingData,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulatePayment = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const paymentId = 'pay_mock_' + Math.random().toString(36).substring(2, 12);
      const signature = 'sig_mock_verified_signature_hash';

      const res = await api.payments.verify({
        bookingId: bookingData.bookingId,
        razorpayOrderId: bookingData.payment.orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      });

      if (res.success) {
        onPaymentSuccess(bookingData.bookingId);
      }
    } catch (err: any) {
      setError(err.message || 'Payment verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl glass-panel border border-slate-700/80 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Secure Checkout</h3>
              <p className="text-xs text-slate-400">Order ID: {bookingData.payment.orderId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">{bookingData.movie.title}</p>
              <p className="text-sm font-bold text-white">{bookingData.cinema.name}</p>
              <p className="text-xs text-slate-500">
                Seats: {bookingData.seats.map((s) => s.label).join(', ')} ({bookingData.seats.length})
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Payable Amount</p>
              <p className="text-2xl font-black text-brand-400">₹{bookingData.finalAmount}</p>
            </div>
          </div>

          {/* Sandbox Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Payment Sandbox Mode:</span>
              <p className="text-[11px] text-amber-400/90 mt-0.5">
                Razorpay test sandbox is active. You can simulate instant payment verification without entering real financial credentials.
              </p>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedMethod('upi')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition ${
                  selectedMethod === 'upi'
                    ? 'bg-brand-500/20 border-brand-500 text-white shadow-glow'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <QrCode className="w-5 h-5 text-brand-400" />
                <span className="text-xs font-semibold">UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('card')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition ${
                  selectedMethod === 'card'
                    ? 'bg-brand-500/20 border-brand-500 text-white shadow-glow'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-5 h-5 text-brand-400" />
                <span className="text-xs font-semibold">Card</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('netbanking')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition ${
                  selectedMethod === 'netbanking'
                    ? 'bg-brand-500/20 border-brand-500 text-white shadow-glow'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building className="w-5 h-5 text-brand-400" />
                <span className="text-xs font-semibold">NetBanking</span>
              </button>
            </div>
          </div>

          {/* Method Details Preview */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60 text-xs text-slate-300 space-y-2">
            {selectedMethod === 'upi' && (
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">Instant UPI Fast Pay</p>
                  <p className="text-[11px] text-slate-400">Google Pay, PhonePe, Paytm, or BHIM</p>
                </div>
              </div>
            )}
            {selectedMethod === 'card' && (
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">Visa, Mastercard, RuPay & Diners</p>
                  <p className="text-[11px] text-slate-400">3D Secure 256-bit encrypted channel</p>
                </div>
              </div>
            )}
            {selectedMethod === 'netbanking' && (
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">All Indian Banks Supported</p>
                  <p className="text-[11px] text-slate-400">HDFC, ICICI, SBI, Axis, Kotak & 50+ Banks</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-rose-400 text-center font-semibold">{error}</p>
          )}

          {/* Action CTA */}
          <button
            onClick={handleSimulatePayment}
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-rose-500 hover:from-brand-500 hover:to-rose-400 text-sm font-bold text-white shadow-glow transition disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isSubmitting ? 'Verifying Payment...' : `Confirm & Pay ₹${bookingData.finalAmount}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default PaymentModal;
