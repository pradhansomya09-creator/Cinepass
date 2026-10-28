import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Printer, Download, ArrowLeft, Film, MapPin, Calendar, Clock, QrCode } from 'lucide-react';

export const TicketViewPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ticketId) {
      api.tickets.getById(ticketId).then((res) => {
        if (res.success) setTicket(res.data);
      }).finally(() => setLoading(false));
    }
  }, [ticketId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="h-96 rounded-3xl bg-slate-900" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Ticket Not Found</h2>
        <Link to="/profile" className="inline-block px-4 py-2 bg-brand-500 rounded-xl text-white text-xs font-bold">
          Back to Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/profile"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>My Bookings</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-brand-400 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>

        {/* Ticket Card */}
        <div id="printable-ticket" className="rounded-3xl overflow-hidden glass-panel border border-slate-700 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
          <div className="p-6 bg-gradient-to-r from-brand-900/60 to-rose-900/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Film className="w-6 h-6 text-brand-400" />
              <span className="text-xl font-black tracking-tight text-white">CinePass Electronic Ticket</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              ticket.isRedeemed ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {ticket.isRedeemed ? 'Already Admitted' : 'Valid for Entry'}
            </span>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 md:col-span-2">
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Movie Information</span>
              <h2 className="text-2xl font-black text-white">{ticket.movie.title}</h2>
              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                <span>{ticket.movie.language}</span>
                <span>•</span>
                <span>{ticket.movie.ageClassification}</span>
                <span>•</span>
                <span>{Math.floor(ticket.movie.durationMinutes / 60)}h {ticket.movie.durationMinutes % 60}m</span>
              </div>

              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <p className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-brand-500" />
                  <span>{ticket.cinema.name} ({ticket.cinema.city})</span>
                </p>
                <p className="text-xs text-slate-400 pl-5">{ticket.cinema.address}</p>
                <p className="text-xs text-brand-400 font-semibold pl-5">
                  Auditorium: {ticket.cinema.screenName}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Showtime</span>
                  <p className="text-sm font-bold text-white flex items-center space-x-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(ticket.showTime).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                  </p>
                  <p className="text-xs text-emerald-400 font-bold mt-0.5">
                    {new Date(ticket.showTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Seats</span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {ticket.seats.map((s: any) => s.label).join(', ')}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{ticket.seats.length} Tickets</p>
                </div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white text-slate-900 text-center space-y-3 shadow-xl">
              {ticket.qrCodeDataUrl ? (
                <img src={ticket.qrCodeDataUrl} alt="Ticket QR Code" className="w-40 h-40 object-contain" />
              ) : (
                <QrCode className="w-24 h-24 text-slate-400" />
              )}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Ticket Reference</p>
                <p className="text-xs font-black tracking-wider text-slate-800 font-mono">
                  {ticket.ticketNumber}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Booking Ref: <strong className="text-white">{ticket.bookingReference}</strong></span>
            <span className="text-sm font-black text-white">Amount Paid: <span className="text-brand-400">₹{ticket.finalAmount}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TicketViewPage;
