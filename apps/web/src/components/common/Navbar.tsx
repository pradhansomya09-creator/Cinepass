import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCity } from '../../context/CityContext';
import { Film, MapPin, Search, User, ChevronDown, Ticket, LogOut, ShieldCheck, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { selectedCity, setIsModalOpen } = useCity();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & City Selector */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-rose-400 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
                Cine<span className="text-brand-500">Pass</span>
              </span>
            </Link>

            {/* City Selector Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-500" />
              <span>{selectedCity ? selectedCity.name : 'Select City'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search for movies, cinemas, genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-full text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
          </form>

          {/* Navigation Links & User Action */}
          <div className="flex items-center space-x-4">
            <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium text-slate-300">
              <Link to="/movies" className="hover:text-brand-400 transition">Movies</Link>
              <Link to="/cinemas" className="hover:text-brand-400 transition">Cinemas</Link>
            </nav>

            {/* User Dropdown / Login */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-500 to-rose-400 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-white max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 rounded-2xl glass-dropdown shadow-2xl py-2 z-50 border border-slate-700/60 animate-fade-in"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center space-x-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>My Profile & Bookings</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-xs text-amber-400 hover:text-amber-300 hover:bg-slate-800/80 transition font-semibold"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <button
                      onClick={logout}
                      className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-slate-800/80 transition text-left border-t border-slate-800/80 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-rose-500 hover:from-brand-500 hover:to-rose-400 rounded-xl shadow-glow transition"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-800 space-y-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white"
              />
            </form>
            <div className="flex flex-col space-y-2 pt-2">
              <button
                onClick={() => {
                  setIsModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg"
              >
                <MapPin className="w-4 h-4 text-brand-500" />
                <span>City: {selectedCity?.name}</span>
              </button>
              <Link
                to="/movies"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg"
              >
                Movies
              </Link>
              <Link
                to="/cinemas"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg"
              >
                Cinemas
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm text-amber-400 font-semibold hover:bg-slate-800 rounded-lg"
                >
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
export default Navbar;
