import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { CheckCircle2, Printer, Download, ArrowRight, Film, MapPin, Calendar, Clock, QrCode } from 'lucide-react';

export const BookingSuccessPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Launch celebratory confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#fb7185', '#38bdf8', '#34d399', '#fbbf24'],
    });

    if (bookingId) {
      api.bookings.getById(bookingId).then((res) => {
        if (res.success) {
          setBooking(res.data);
          if (res.data.ticket) {
            // Fetch full ticket details with QR code
            api.tickets.getById(res.data.ticket.id).then((tRes) => {
              if (tRes.success) setTicket(tRes.data);
            });
          }
        }
      }).finally(() => setLoading(false));
    }
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="h-96 rounded-3xl bg-slate-900" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Booking Not Found</h2>
        <Link to="/" className="inline-block px-4 py-2 bg-brand-500 rounded-xl text-white text-xs font-bold">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Success Header Banner */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-glow">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Booking Confirmed!</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Your booking reference is <strong className="text-brand-400 font-mono text-base">{booking.bookingReference}</strong>.
            A confirmation email has been dispatched.
          </p>
        </div>

        {/* Printable Electronic Ticket */}
        <div id="printable-ticket" className="rounded-3xl overflow-hidden glass-panel border border-slate-700 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
          {/* Top Cinema Banner */}
          <div className="p-6 bg-gradient-to-r from-brand-900/60 to-rose-900/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Film className="w-6 h-6 text-brand-400" />
              <span className="text-xl font-black tracking-tight text-white">CinePass Electronic Ticket</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
              Confirmed Admission
            </span>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Movie Poster & Title */}
            <div className="space-y-3 md:col-span-2">
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Movie Information</span>
              <h2 className="text-2xl font-black text-white">{booking.show.movie.title}</h2>
              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                <span>{booking.show.movie.language}</span>
                <span>•</span>
                <span>{booking.show.movie.ageClassification}</span>
                <span>•</span>
                <span>{Math.floor(booking.show.movie.durationMinutes / 60)}h {booking.show.movie.durationMinutes % 60}m</span>
              </div>

              {/* Cinema & Screen */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <p className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-brand-500" />
                  <span>{booking.show.screen.cinema.name} ({booking.show.screen.cinema.city.name})</span>
                </p>
                <p className="text-xs text-slate-400 pl-5">{booking.show.screen.cinema.address}</p>
                <p className="text-xs text-brand-400 font-semibold pl-5">
                  Auditorium: {booking.show.screen.name} ({booking.show.screen.soundType})
                </p>
              </div>

              {/* Show Date, Time & Seats */}
              <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Date & Time</span>
                  <p className="text-sm font-bold text-white flex items-center space-x-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(booking.show.startTime).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                  </p>
                  <p className="text-xs text-emerald-400 font-bold mt-0.5">
                    {new Date(booking.show.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Allocated Seats</span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {booking.seats.map((s: any) => `${s.seat.rowLabel}${s.seat.seatNumber}`).join(', ')}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{booking.seats.length} Tickets</p>
                </div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white text-slate-900 text-center space-y-3 shadow-xl">
              {ticket?.qrCodeDataUrl ? (
                <img src={ticket.qrCodeDataUrl} alt="Ticket QR Code" className="w-40 h-40 object-contain" />
              ) : (
                <div className="w-40 h-40 bg-slate-100 flex items-center justify-center text-slate-400">
                  <QrCode className="w-12 h-12" />
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Ticket Number</p>
                <p className="text-xs font-black tracking-wider text-slate-800 font-mono">
                  {ticket?.ticketNumber || booking.bookingReference}
                </p>
              </div>
              <p className="text-[9px] text-slate-500 leading-tight">
                Scan this anti-counterfeit QR code at the cinema gate for instant admission.
              </p>
            </div>
          </div>

          {/* Payment Details Footer */}
          <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
            <div>
              <span>Payment Mode: <strong>{booking.payment?.method || 'UPI FastPay'}</strong></span>
              <span className="mx-2">•</span>
              <span>Status: <strong className="text-emerald-400">PAID</strong></span>
            </div>
            <div className="text-sm font-black text-white">
              Total Amount: <span className="text-brand-400">₹{Number(booking.finalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition border border-slate-700"
          >
            <Printer className="w-4 h-4 text-brand-400" />
            <span>Print Ticket</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition border border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Save PDF</span>
          </button>

          <Link
            to="/profile"
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-glow transition"
          >
            <span>View All Bookings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
export default BookingSuccessPage;
