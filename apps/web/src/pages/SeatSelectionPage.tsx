import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SeatMap, { SeatItem } from '../components/seats/SeatMap';
import BookingSummaryDrawer from '../components/booking/BookingSummaryDrawer';
import PaymentModal from '../components/payment/PaymentModal';
import { Clock, MapPin, Film, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

export const SeatSelectionPage: React.FC = () => {
  const { showId } = useParams<{ showId: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [seatData, setSeatData] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<SeatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Seat hold state
  const [seatHoldSession, setSeatHoldSession] = useState<{
    id: string;
    expiresAt: string;
  } | null>(null);

  // Payment state
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const fetchSeats = async () => {
    if (!showId) return;
    try {
      const res = await api.shows.getSeats(showId);
      if (res.success) {
        setSeatData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load seats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
  }, [showId]);

  // Handle seat click
  const handleToggleSeat = (seat: SeatItem) => {
    setError(null);
    const alreadySelected = selectedSeats.some((s) => s.seatId === seat.seatId);

    if (alreadySelected) {
      setSelectedSeats(selectedSeats.filter((s) => s.seatId !== seat.seatId));
    } else {
      if (selectedSeats.length >= 10) {
        setError('Maximum 10 seats allowed per transaction');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  // Proceed to payment: Acquire atomic seat hold & create pending booking
  const handleProceedToPayment = async (couponCode?: string) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/book/seats/${showId}`);
      return;
    }

    if (selectedSeats.length === 0 || !showId) return;

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create atomic seat hold on backend
      let holdId = seatHoldSession?.id;

      if (!holdId) {
        const holdRes = await api.seats.hold({
          showId,
          seatIds: selectedSeats.map((s) => s.seatId),
        });

        if (!holdRes.success || !holdRes.data?.seatHoldId) {
          throw new Error(holdRes.error || 'Failed to hold seats');
        }

        const newHoldId: string = holdRes.data.seatHoldId;
        holdId = newHoldId;
        setSeatHoldSession({
          id: newHoldId,
          expiresAt: holdRes.data.expiresAt,
        });
      }

      if (!holdId) {
        throw new Error('Failed to retrieve seat hold session ID');
      }

      // 2. Create pending booking with Razorpay order
      const bookingRes = await api.bookings.create({
        showId,
        seatHoldId: holdId,
        couponCode,
      });

      if (!bookingRes.success) {
        throw new Error(bookingRes.error || 'Failed to initiate booking');
      }

      setPendingBookingData(bookingRes.data);
      setIsPaymentModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Seat reservation failed. Someone else may have reserved these seats.');
      // Refresh real-time seat inventory
      fetchSeats();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelHold = async () => {
    if (seatHoldSession?.id) {
      try {
        await api.seats.releaseHold(seatHoldSession.id);
      } catch (err) {}
      setSeatHoldSession(null);
    }
    setSelectedSeats([]);
    fetchSeats();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4 animate-pulse">
        <div className="h-96 rounded-3xl bg-slate-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change Show</span>
          </button>

          <button
            onClick={fetchSeats}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Seats</span>
          </button>
        </div>

        {/* Show Info Banner */}
        {seatData && (
          <div className="p-4 sm:p-6 rounded-3xl glass-panel border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{seatData.cinemaName}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="font-semibold text-brand-400">{seatData.screenName}</span>
                <span>•</span>
                <span>{seatData.screenType}</span>
                <span>•</span>
                <span>{seatData.soundType}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs font-medium">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Available Seats: </span>
                <span className="font-bold text-emerald-400">{seatData.availableSeats}</span> / {seatData.totalSeats}
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Seat Map */}
        {seatData && (
          <SeatMap
            rows={seatData.rows}
            selectedSeats={selectedSeats}
            onToggleSeat={handleToggleSeat}
            maxSeats={10}
          />
        )}
      </div>

      {/* Floating Bottom Booking Drawer */}
      {selectedSeats.length > 0 && showId && (
        <BookingSummaryDrawer
          selectedSeats={selectedSeats}
          showId={showId}
          holdExpiresAt={seatHoldSession?.expiresAt}
          onProceedToPayment={handleProceedToPayment}
          onCancelHold={handleCancelHold}
          isProcessing={isProcessing}
        />
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && pendingBookingData && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          bookingData={pendingBookingData}
          onPaymentSuccess={(confirmedBookingId) => {
            setIsPaymentModalOpen(false);
            navigate(`/booking/success/${confirmedBookingId}`);
          }}
        />
      )}
    </div>
  );
};
export default SeatSelectionPage;
