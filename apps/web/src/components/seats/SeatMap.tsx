import React from 'react';
import { Armchair, Sparkles } from 'lucide-react';

export interface SeatItem {
  showSeatId: string;
  seatId: string;
  rowLabel: string;
  seatNumber: number;
  category: 'REGULAR' | 'PREMIUM' | 'RECLINER';
  price: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED';
}

interface SeatMapProps {
  rows: Record<string, SeatItem[]>;
  selectedSeats: SeatItem[];
  onToggleSeat: (seat: SeatItem) => void;
  maxSeats?: number;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  rows,
  selectedSeats,
  onToggleSeat,
  maxSeats = 10,
}) => {
  const isSelected = (seat: SeatItem) => selectedSeats.some((s) => s.seatId === seat.seatId);

  // Group rows by category
  const reclinerRows = ['G'];
  const premiumRows = ['D', 'E', 'F'];
  const regularRows = ['A', 'B', 'C'];

  const renderRow = (rowLabel: string) => {
    const seatsInRow = rows[rowLabel] || [];
    if (seatsInRow.length === 0) return null;

    return (
      <div key={rowLabel} className="flex items-center justify-center space-x-2 my-2">
        {/* Row Label (Left) */}
        <span className="w-6 text-center text-xs font-bold text-slate-500">{rowLabel}</span>

        {/* Seats Grid */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {seatsInRow.map((seat) => {
            const selected = isSelected(seat);
            const isBooked = seat.status === 'BOOKED' || seat.status === 'BLOCKED';
            const isHeld = seat.status === 'HELD' && !selected;
            const isAvailable = seat.status === 'AVAILABLE' || selected;

            let seatClasses = 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-200 select-none ';

            if (selected) {
              seatClasses += 'bg-brand-500 text-white shadow-glow scale-105 ring-2 ring-brand-300';
            } else if (isBooked) {
              seatClasses += 'bg-slate-900/90 text-slate-700 border border-slate-800/80 cursor-not-allowed';
            } else if (isHeld) {
              seatClasses += 'bg-amber-950/40 text-amber-500/80 border border-amber-600/40 cursor-not-allowed';
            } else if (seat.category === 'RECLINER') {
              seatClasses += 'bg-purple-950/40 text-purple-300 border border-purple-500/30 hover:bg-brand-600 hover:text-white cursor-pointer';
            } else if (seat.category === 'PREMIUM') {
              seatClasses += 'bg-blue-950/40 text-blue-300 border border-blue-500/30 hover:bg-brand-600 hover:text-white cursor-pointer';
            } else {
              seatClasses += 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-brand-600 hover:text-white cursor-pointer';
            }

            return (
              <button
                key={seat.seatId}
                disabled={!isAvailable && !selected}
                onClick={() => onToggleSeat(seat)}
                title={`${seat.rowLabel}${seat.seatNumber} - ${seat.category} (₹${seat.price})`}
                aria-label={`Seat ${seat.rowLabel}${seat.seatNumber}, ${seat.category}, ₹${seat.price}, status: ${seat.status}`}
                className={seatClasses}
              >
                {seat.seatNumber}
              </button>
            );
          })}
        </div>

        {/* Row Label (Right) */}
        <span className="w-6 text-center text-xs font-bold text-slate-500">{rowLabel}</span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 glass-panel rounded-3xl border border-slate-800 shadow-2xl">
      {/* Curved Screen Perspective */}
      <div className="perspective-screen mb-12 sm:mb-16">
        <div className="screen-curve max-w-2xl mx-auto" />
        <p className="text-center text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-widest mt-3">
          All Eyes This Way • Cinema Screen
        </p>
      </div>

      {/* Seats Container */}
      <div className="space-y-6 overflow-x-auto pb-4">
        {/* Recliner Tier */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-purple-400 uppercase tracking-wider px-8 mb-2">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Luxury Recliners</span>
            </span>
            <span className="text-slate-400">₹550</span>
          </div>
          {reclinerRows.map(renderRow)}
        </div>

        {/* Premium Tier */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-blue-400 uppercase tracking-wider px-8 mb-2">
            <span className="flex items-center space-x-1.5">
              <Armchair className="w-3.5 h-3.5" />
              <span>Premium View</span>
            </span>
            <span className="text-slate-400">₹350</span>
          </div>
          {premiumRows.map(renderRow)}
        </div>

        {/* Regular Tier */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-8 mb-2">
            <span>Regular Class</span>
            <span className="text-slate-400">₹220</span>
          </div>
          {regularRows.map(renderRow)}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700" />
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-md bg-brand-500 shadow-glow ring-2 ring-brand-300" />
          <span className="text-brand-400 font-semibold">Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-md bg-amber-950/40 border border-amber-600/50" />
          <span>Held (Others)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-md bg-slate-900 border border-slate-800" />
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
};
export default SeatMap;
