import React from 'react';
import { Film, ShieldCheck, CreditCard, Sparkles, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-cinema-dark mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                Cine<span className="text-brand-500">Pass</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your next-generation entertainment portal. Seamless seat booking, instant discounts, and genuine cinema experiences.
            </p>
            <div className="flex items-center space-x-3 text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>256-bit SSL</span>
              </span>
              <span className="flex items-center space-x-1">
                <CreditCard className="w-4 h-4 text-brand-400" />
                <span>Razorpay Verified</span>
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Discover</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/movies?status=now_showing" className="hover:text-white transition">Now Showing</Link></li>
              <li><Link to="/movies?status=coming_soon" className="hover:text-white transition">Coming Soon</Link></li>
              <li><Link to="/cinemas" className="hover:text-white transition">Cinemas & IMAX</Link></li>
              <li><Link to="/movies" className="hover:text-white transition">Top Rated Movies</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Support & Rules</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/profile" className="hover:text-white transition">My Bookings</Link></li>
              <li><span className="cursor-pointer hover:text-white transition">Cancellation Policy</span></li>
              <li><span className="cursor-pointer hover:text-white transition">Ticket Terms</span></li>
              <li><span className="cursor-pointer hover:text-white transition">Privacy Policy</span></li>
            </ul>
          </div>

          {/* Security & Badges */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Security Guaranteed</h4>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex items-center space-x-2 text-brand-400 font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>Instant E-Tickets & QR</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Official bookings guaranteed. Digital QR code delivered immediately on payment verification.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} CinePass Technologies Pvt. Ltd. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center space-x-1">
            <span>Designed for cinematic excellence</span>
            <Heart className="w-3.5 h-3.5 text-brand-500 inline fill-brand-500" />
          </p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
