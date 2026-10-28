import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Ticket, Calendar, Clock, MapPin, X, AlertCircle, CheckCircle, ShieldAlert, ChevronRight } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

  // Cancel modal state
  const [selectedBookingToCancel, setSelectedBookingToCancel] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [cancelling, setCancelling] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await api.bookings.getAll();
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const now = new Date();
  const upcomingBookings = bookings.filter(
    (b) => b.status === 'CONFIRMED' && new Date(b.showTime) > now
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'CONFIRMED' && new Date(b.showTime) <= now
  );
  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED');

  const displayedBookings =
    activeTab === 'upcoming'
      ? upcomingBookings
      : activeTab === 'past'
      ? pastBookings
      : cancelledBookings;

  const handleConfirmCancel = async () => {
    if (!selectedBookingToCancel) return;
    setCancelling(true);
    setActionMessage(null);

    try {
      const res = await api.bookings.cancel(selectedBookingToCancel.id, cancelReason);
      if (res.success) {
        setActionMessage({ text: 'Booking cancelled. Refund initiated to original source.', type: 'success' });
        setSelectedBookingToCancel(null);
        fetchBookings();
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to cancel booking', type: 'error' });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen">
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-rose-400 flex items-center justify-center text-2xl font-black text-white shadow-glow uppercase">
            {user?.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
              <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 text-[10px] font-bold border border-brand-500/30">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
            {user?.phone && <p className="text-xs text-slate-500">Phone: {user.phone}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center min-w-[100px]">
            <span className="text-lg font-black text-white">{bookings.length}</span>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Bookings</p>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center space-x-2 ${
          actionMessage.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Bookings Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Ticket className="w-5 h-5 text-brand-400" />
            <span>Booking History</span>
          </h2>

          {/* Status Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'upcoming' ? 'bg-brand-500 text-white shadow-glow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Upcoming ({upcomingBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'past' ? 'bg-brand-500 text-white shadow-glow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Past ({pastBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'cancelled' ? 'bg-brand-500 text-white shadow-glow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cancelled ({cancelledBookings.length})
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-900 animate-pulse" />
            ))}
          </div>
        ) : displayedBookings.length > 0 ? (
          <div className="space-y-4">
            {displayedBookings.map((b) => (
              <div
                key={b.id}
                className="p-5 sm:p-6 rounded-3xl glass-panel border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Movie & Cinema info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-slate-300">
                      {b.bookingReference}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.status === 'CONFIRMED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{b.movie.title}</h3>

                  <div className="flex flex-wrap gap-y-1 gap-x-4 text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-500" />
                      <span>{b.cinema.name} ({b.cinema.screenName})</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(b.showTime).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(b.showTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Seats: <strong className="text-white">{b.seats.map((s: any) => s.label).join(', ')}</strong> ({b.seats.length} Tickets)
                  </p>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center justify-between md:flex-col md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Paid Amount</p>
                    <p className="text-xl font-black text-white">₹{b.finalAmount}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {b.ticket && (
                      <Link
                        to={`/tickets/${b.ticket.id}`}
                        className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-glow transition"
                      >
                        View E-Ticket
                      </Link>
                    )}

                    {b.isEligibleForCancellation && (
                      <button
                        onClick={() => setSelectedBookingToCancel(b)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-700 text-xs font-semibold text-slate-400 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-3xl glass-panel border border-slate-800">
            <Ticket className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No {activeTab} bookings found</p>
            <Link
              to="/movies"
              className="mt-3 inline-block px-4 py-2 bg-brand-500 rounded-xl text-white text-xs font-bold"
            >
              Book Movies Now
            </Link>
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      {selectedBookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl glass-panel border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-400 font-bold">
                <ShieldAlert className="w-5 h-5" />
                <span>Cancel Booking</span>
              </div>
              <button
                onClick={() => setSelectedBookingToCancel(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to cancel booking <strong className="text-white font-mono">{selectedBookingToCancel.bookingReference}</strong> for <strong>{selectedBookingToCancel.movie.title}</strong>?
            </p>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Refund Amount:</span>
                <span className="font-bold text-emerald-400">₹{selectedBookingToCancel.finalAmount}</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Refund will be credited to original payment source within 3-5 business days.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Reason for cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="Change of plans">Change of plans</option>
                <option value="Booked by mistake">Booked by mistake</option>
                <option value="Showtime timing issue">Showtime timing issue</option>
                <option value="Other personal reason">Other personal reason</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedBookingToCancel(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProfilePage;
