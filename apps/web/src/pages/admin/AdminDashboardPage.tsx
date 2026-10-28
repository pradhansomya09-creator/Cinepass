import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Users,
  Film,
  Building,
  Calendar,
  Ticket,
  TrendingUp,
  CreditCard,
  Percent,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  QrCode,
  ShieldCheck,
  Search,
  Eye,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'movies' | 'shows' | 'bookings' | 'scanner'>('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Data lists
  const [moviesList, setMoviesList] = useState<any[]>([]);
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [showsList, setShowsList] = useState<any[]>([]);
  const [cinemasList, setCinemasList] = useState<any[]>([]);

  // Ticket scanner state
  const [scannerToken, setScannerToken] = useState('');
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // Add Movie Modal State
  const [isAddMovieModalOpen, setIsAddMovieModalOpen] = useState(false);
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    durationMinutes: 120,
    releaseDate: new Date().toISOString().split('T')[0],
    language: 'English',
    genres: 'Action, Sci-Fi',
    posterUrl: '',
    bannerUrl: '',
    director: '',
    ageClassification: 'UA',
    rating: 8.0,
  });

  const fetchDashboard = async () => {
    try {
      const res = await api.admin.getDashboard();
      if (res.success) setDashboardData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMovies = async () => {
    const res = await api.movies.getAll({ limit: 50 });
    if (res.success) setMoviesList(res.data);
  };

  const fetchBookings = async () => {
    const res = await api.admin.getBookings({ limit: 30 });
    if (res.success) setBookingsList(res.data);
  };

  const fetchShows = async () => {
    const res = await api.shows.getAll();
    if (res.success) setShowsList(res.data);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDashboard(), fetchMovies(), fetchBookings(), fetchShows()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...movieForm,
        genres: movieForm.genres.split(',').map((g) => g.trim()),
        durationMinutes: Number(movieForm.durationMinutes),
        rating: Number(movieForm.rating),
      };

      const res = await api.movies.create(payload);
      if (res.success) {
        setIsAddMovieModalOpen(false);
        fetchMovies();
        fetchDashboard();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create movie');
    }
  };

  const handleDeleteMovie = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await api.movies.delete(id);
        fetchMovies();
        fetchDashboard();
      } catch (err: any) {
        alert(err.message || 'Failed to delete movie');
      }
    }
  };

  const handleScanTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerToken.trim()) return;
    setScanning(true);
    setScanResult(null);
    setScanError(null);

    try {
      const res = await api.tickets.validateStaff(scannerToken.trim());
      if (res.success) {
        setScanResult(res.data);
      }
    } catch (err: any) {
      setScanError(err.message || 'Invalid or already redeemed ticket');
    } finally {
      setScanning(false);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center animate-pulse">
        <div className="h-96 rounded-3xl bg-slate-900" />
      </div>
    );
  }

  const { metrics, popularMovies, dailyBookings, recentBookings } = dashboardData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Admin Master Console</h1>
            <p className="text-xs text-slate-400">
              Real-time analytics, revenue, show scheduling, and staff admission validation
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 p-1 bg-slate-900 rounded-2xl border border-slate-800 text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-brand-500 text-white shadow-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
              activeTab === 'movies' ? 'bg-brand-500 text-white shadow-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Movies ({moviesList.length})
          </button>
          <button
            onClick={() => setActiveTab('shows')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
              activeTab === 'shows' ? 'bg-brand-500 text-white shadow-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Shows ({showsList.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
              activeTab === 'bookings' ? 'bg-brand-500 text-white shadow-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'scanner' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Scanner</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Gross Booking Value</span>
                <CreditCard className="w-4 h-4 text-brand-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">₹{metrics.grossBookingValue.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-emerald-400 font-medium">Net Collected: ₹{metrics.netRevenue.toLocaleString('en-IN')}</p>
            </div>

            <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Bookings</span>
                <Ticket className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{metrics.totalBookings}</p>
              <p className="text-[11px] text-slate-400">
                <span className="text-emerald-400">{metrics.confirmedBookings} Confirmed</span> •{' '}
                <span className="text-rose-400">{metrics.cancelledBookings} Cancelled</span>
              </p>
            </div>

            <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Show Occupancy</span>
                <Percent className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{metrics.occupancyRate}%</p>
              <p className="text-[11px] text-purple-400 font-medium">Across all scheduled shows</p>
            </div>

            <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Users & Theaters</span>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{metrics.totalUsers}</p>
              <p className="text-[11px] text-slate-400">
                {metrics.totalCinemas} Cinemas • {metrics.totalMovies} Movies
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Booking Trend */}
            <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-brand-400" />
                <span>Daily Confirmed Bookings (Last 7 Days)</span>
              </h3>
              <div className="space-y-3 pt-2">
                {dailyBookings.map((day: any) => {
                  const maxBooking = Math.max(...dailyBookings.map((d: any) => d.bookings), 1);
                  const percentage = Math.round((day.bookings / maxBooking) * 100);
                  return (
                    <div key={day.date} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">{day.date}</span>
                        <span className="text-white font-semibold">
                          {day.bookings} bookings (₹{day.revenue})
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-600 to-rose-400 rounded-full"
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Movies */}
            <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Film className="w-4 h-4 text-amber-400" />
                <span>Most Popular Movies by Bookings</span>
              </h3>
              <div className="space-y-3 pt-1">
                {popularMovies.map((m: any, index: number) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-black text-slate-500 w-4">#{index + 1}</span>
                      <img src={m.posterUrl} alt={m.title} className="w-9 h-12 rounded-lg object-cover" />
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{m.title}</h4>
                        <p className="text-[10px] text-amber-400 font-semibold">★ {m.rating} Rating</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-brand-500/20 text-brand-400 text-xs font-bold">
                      {m.bookingsCount} bookings
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Bookings Table */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Recent Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="pb-3">Reference</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Movie</th>
                    <th className="pb-3">Cinema</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentBookings.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-900/50">
                      <td className="py-3 font-mono font-bold text-brand-400">{b.bookingReference}</td>
                      <td className="py-3 text-white font-medium">{b.customer}</td>
                      <td className="py-3">{b.movie}</td>
                      <td className="py-3 text-slate-400">{b.cinema}</td>
                      <td className="py-3 font-bold text-white">₹{b.finalAmount}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MOVIES MANAGEMENT */}
      {activeTab === 'movies' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Manage Movies Catalog</h2>
            <button
              onClick={() => setIsAddMovieModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-glow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Movie</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {moviesList.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-3xl glass-panel border border-slate-800 flex items-start space-x-4 relative group"
              >
                <img src={m.posterUrl} alt={m.title} className="w-20 aspect-[2/3] rounded-xl object-cover" />
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-bold text-white line-clamp-1">{m.title}</h3>
                  <p className="text-[10px] text-slate-400">{m.language} • {m.durationMinutes}m • {m.ageClassification}</p>
                  <p className="text-xs text-amber-400 font-bold">★ {m.rating}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {m.genres.map((g: string) => (
                      <span key={g} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteMovie(m.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                  title="Delete Movie"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SHOWS MANAGEMENT */}
      {activeTab === 'shows' && (
        <div className="space-y-6 animate-fade-in">
          <h2 className="text-xl font-bold text-white">Active Showtime Schedules</h2>
          <div className="overflow-x-auto rounded-3xl glass-panel border border-slate-800 p-4">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="pb-3">Movie</th>
                  <th className="pb-3">Cinema</th>
                  <th className="pb-3">Auditorium</th>
                  <th className="pb-3">Start Time</th>
                  <th className="pb-3">Pricing (Reg/Prem/Recl)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {showsList.slice(0, 30).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/50">
                    <td className="py-3 font-semibold text-white">{s.movie?.title}</td>
                    <td className="py-3 text-slate-400">{s.cinema?.name}</td>
                    <td className="py-3 text-brand-400">{s.screen?.name}</td>
                    <td className="py-3 text-emerald-400 font-bold">
                      {new Date(s.startTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 text-slate-300 font-mono">
                      ₹{s.priceRegular} / ₹{s.pricePremium} / ₹{s.priceRecliner}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ALL BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-6 animate-fade-in">
          <h2 className="text-xl font-bold text-white">All Customer Bookings</h2>
          <div className="overflow-x-auto rounded-3xl glass-panel border border-slate-800 p-4">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Movie</th>
                  <th className="pb-3">Cinema & Screen</th>
                  <th className="pb-3">Seats</th>
                  <th className="pb-3">Paid Amount</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bookingsList.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/50">
                    <td className="py-3 font-mono font-bold text-brand-400">{b.bookingReference}</td>
                    <td className="py-3 text-white">
                      <p className="font-semibold">{b.customer?.name}</p>
                      <p className="text-[10px] text-slate-500">{b.customer?.email}</p>
                    </td>
                    <td className="py-3 font-medium text-white">{b.movieTitle}</td>
                    <td className="py-3 text-slate-400">{b.cinemaName} ({b.screenName})</td>
                    <td className="py-3 font-semibold text-white">{b.seats}</td>
                    <td className="py-3 font-bold text-white">₹{b.finalAmount}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: STAFF QR TICKET SCANNER */}
      {activeTab === 'scanner' && (
        <div className="max-w-xl mx-auto p-8 rounded-3xl glass-panel border border-slate-800 space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
              <QrCode className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Cinema Staff Admission Gate</h2>
            <p className="text-xs text-slate-400">
              Scan or enter electronic ticket token to verify authenticity and admit customer
            </p>
          </div>

          <form onSubmit={handleScanTicket} className="space-y-3">
            <input
              type="text"
              required
              placeholder="Paste ticket QR Token (e.g. CINEPASS_...)"
              value={scannerToken}
              onChange={(e) => setScannerToken(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
            <button
              type="submit"
              disabled={scanning}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition disabled:opacity-50 flex items-center justify-center space-x-2 shadow-glow-amber"
            >
              <span>{scanning ? 'Verifying Admission...' : 'Validate & Admit Customer'}</span>
            </button>
          </form>

          {/* Verification Success Box */}
          {scanResult && (
            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 space-y-2 animate-fade-in">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>ADMISSION GRANTED • TICKET VALID</span>
              </div>
              <div className="text-xs text-slate-300 space-y-1 pt-1">
                <p><strong>Customer:</strong> {scanResult.customerName}</p>
                <p><strong>Movie:</strong> {scanResult.movieTitle}</p>
                <p><strong>Cinema:</strong> {scanResult.cinemaName} ({scanResult.screenName})</p>
                <p><strong>Seats:</strong> <span className="text-white font-bold">{scanResult.seats}</span></p>
                <p><strong>Ticket Ref:</strong> {scanResult.ticketNumber}</p>
              </div>
            </div>
          )}

          {/* Verification Error Box */}
          {scanError && (
            <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-300 space-y-1 animate-fade-in">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                <AlertCircle className="w-5 h-5" />
                <span>ADMISSION DENIED</span>
              </div>
              <p className="text-xs">{scanError}</p>
            </div>
          )}
        </div>
      )}

      {/* Add Movie Modal */}
      {isAddMovieModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl glass-panel border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Add New Movie</h3>
              <button
                onClick={() => setIsAddMovieModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMovie} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Movie Title</label>
                <input
                  type="text"
                  required
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  placeholder="Inception"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description / Synopsis</label>
                <textarea
                  rows={3}
                  required
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    required
                    value={movieForm.durationMinutes}
                    onChange={(e) => setMovieForm({ ...movieForm, durationMinutes: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Language</label>
                  <input
                    type="text"
                    required
                    value={movieForm.language}
                    onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Genres (comma separated)</label>
                  <input
                    type="text"
                    required
                    value={movieForm.genres}
                    onChange={(e) => setMovieForm({ ...movieForm, genres: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Director</label>
                  <input
                    type="text"
                    required
                    value={movieForm.director}
                    onChange={(e) => setMovieForm({ ...movieForm, director: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Poster URL</label>
                <input
                  type="url"
                  required
                  value={movieForm.posterUrl}
                  onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Banner / Backdrop URL</label>
                <input
                  type="url"
                  required
                  value={movieForm.bannerUrl}
                  onChange={(e) => setMovieForm({ ...movieForm, bannerUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddMovieModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-white font-bold shadow-glow"
                >
                  Save Movie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminDashboardPage;
