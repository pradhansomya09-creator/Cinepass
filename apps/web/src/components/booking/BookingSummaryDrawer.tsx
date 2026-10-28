import React, { useState, useEffect } from 'react';
import { Tag, Clock, ArrowRight, X, AlertCircle } from 'lucide-react';
import { SeatItem } from '../seats/SeatMap';
import { api } from '../../services/api';

interface BookingSummaryDrawerProps {
  selectedSeats: SeatItem[];
  showId: string;
  holdExpiresAt?: string | null;
  onProceedToPayment: (couponCode?: string) => void;
  onCancelHold: () => void;
  isProcessing?: boolean;
}

export const BookingSummaryDrawer: React.FC<BookingSummaryDrawerProps> = ({
  selectedSeats,
  showId,
  holdExpiresAt,
  onProceedToPayment,
  onCancelHold,
  isProcessing = false,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    description: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Seat hold countdown timer
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!holdExpiresAt) {
      setSecondsRemaining(null);
      return;
    }

    const targetTime = new Date(holdExpiresAt).getTime();
    const updateCountdown = () => {
      const diff = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      setSecondsRemaining(diff);
      if (diff === 0) {
        onCancelHold();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  const subtotal = selectedSeats.reduce((acc, curr) => acc + curr.price, 0);
  const convenienceFee = selectedSeats.length > 0 ? Math.round(selectedSeats.length * 28.5) : 0;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalAmount = Math.max(0, subtotal + convenienceFee - discount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await api.coupons.validate({
        code: couponCode.trim(),
        showId,
        subtotal,
      });

      if (res.success && res.data) {
        setAppliedCoupon({
          code: res.data.code,
          discountAmount: res.data.discountAmount,
          description: res.data.description,
        });
      }
    } catch (err: any) {
      setCouponError(err.message || 'Failed to apply coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  if (selectedSeats.length === 0) return null;

  const minutes = secondsRemaining !== null ? Math.floor(secondsRemaining / 60) : 0;
  const seconds = secondsRemaining !== null ? secondsRemaining % 60 : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-4 sm:p-6 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl animate-slide-up">
      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Selected Seats summary & countdown */}
        <div className="flex-1 w-full space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected Seats</span>
              <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold">
                {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'}
              </span>
            </div>

            {/* Countdown timer */}
            {secondsRemaining !== null && (
              <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                secondsRemaining < 120 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>Seats Held: {minutes}:{seconds < 10 ? '0' : ''}{seconds}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-1">
            {selectedSeats.map((s) => (
              <span
                key={s.seatId}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-white"
              >
                {s.rowLabel}{s.seatNumber} <span className="text-[10px] text-slate-400 font-normal">({s.category})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Coupon Form */}
        <div className="w-full lg:w-72">
          {appliedCoupon ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs">
              <div>
                <span className="font-bold text-emerald-400 uppercase tracking-wider">{appliedCoupon.code}</span>
                <p className="text-[11px] text-emerald-300">Saved ₹{appliedCoupon.discountAmount}</p>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} className="space-y-1">
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  placeholder="Coupon (e.g. CINE20)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 uppercase focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl disabled:opacity-50 transition"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && (
                <p className="text-[10px] text-rose-400 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{couponError}</span>
                </p>
              )}
            </form>
          )}
        </div>

        {/* Price Breakdown & CTA Button */}
        <div className="flex items-center justify-between sm:justify-end space-x-6 w-full lg:w-auto border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
          <div>
            <p className="text-[11px] text-slate-400">Total Payable</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white">₹{finalAmount}</span>
              {discount > 0 && (
                <span className="text-xs line-through text-slate-500">₹{subtotal + convenienceFee}</span>
              )}
            </div>
          </div>

          <button
            onClick={() => onProceedToPayment(appliedCoupon?.code)}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-rose-500 hover:from-brand-500 hover:to-rose-400 text-sm font-bold text-white shadow-glow transition disabled:opacity-50"
          >
            <span>{isProcessing ? 'Processing...' : 'Proceed to Pay'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default BookingSummaryDrawer;
