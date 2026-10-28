import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useCity } from '../context/CityContext';
import { Star, Clock, Calendar, MapPin, Play, Ticket, Shield, Users, Sparkles, ChevronRight } from 'lucide-react';

export const MovieDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { selectedCity } = useCity();
  const navigate = useNavigate();

  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // Generate 5 dates starting from today
  const dates = [...Array(5)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateObj: d,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      isoString: d.toISOString().split('T')[0],
    };
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.movies
      .getById(id)
      .then((res) => {
        if (res.success) setMovie(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-pulse space-y-4">
        <div className="h-96 rounded-3xl bg-slate-900" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Movie Not Found</h2>
        <Link to="/movies" className="inline-block px-4 py-2 bg-brand-500 rounded-xl text-white text-xs font-bold">
          Back to Movies
        </Link>
      </div>
    );
  }

  // Filter shows by selected date & city
  const selectedDateStr = dates[selectedDateIndex].isoString;
  const filteredShows = (movie.shows || []).filter((s: any) => {
    const showDate = new Date(s.startTime).toISOString().split('T')[0];
    const cityMatch = !selectedCity || s.cinema.cityId === selectedCity.id || s.cinema.city === selectedCity.name;
    return showDate === selectedDateStr && cityMatch;
  });

  // Group shows by cinema
  const cinemaShowsMap: Record<string, { cinema: any; shows: any[] }> = {};
  filteredShows.forEach((s: any) => {
    if (!cinemaShowsMap[s.cinema.id]) {
      cinemaShowsMap[s.cinema.id] = { cinema: s.cinema, shows: [] };
    }
    cinemaShowsMap[s.cinema.id].shows.push(s);
  });

  return (
    <div className="min-h-screen pb-20">
      {/* Backdrop Banner Header */}
      <div className="relative w-full h-[360px] sm:h-[450px] overflow-hidden bg-slate-950">
        <img
          src={movie.bannerUrl || movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-top opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-darkest via-cinema-darkest/70 to-transparent" />
      </div>

      {/* Main Content Info Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-52 sm:-mt-64 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster */}
          <div className="w-48 sm:w-64 flex-shrink-0 rounded-2xl overflow-hidden glass-panel border border-slate-700 shadow-2xl">
            <img src={movie.posterUrl} alt={movie.title} className="w-full aspect-[2/3] object-cover" />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700">
                {movie.ageClassification}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700">
                {movie.language}
              </span>
              <span className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/40">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{Number(movie.rating).toFixed(1)} / 10</span>
              </span>
              <span className="text-xs text-slate-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{Math.floor(movie.durationMinutes / 60)}h {movie.durationMinutes % 60}m</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">{movie.title}</h1>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((g: string) => (
                <span key={g} className="px-3 py-1 rounded-lg bg-brand-500/15 text-brand-300 border border-brand-500/30 text-xs font-semibold">
                  {g}
                </span>
              ))}
            </div>

            {/* Director & Cast */}
            <div className="text-xs text-slate-400 space-y-1 pt-2">
              <p><strong className="text-slate-200">Director:</strong> {movie.director}</p>
              <p><strong className="text-slate-200">Cast:</strong> {movie.cast.join(', ')}</p>
            </div>

            {/* Synopsis */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl pt-2">
              {movie.description}
            </p>
          </div>
        </div>

        {/* Date Selector Tabs */}
        <div className="mt-14 pt-8 border-t border-slate-800">
          <div className="flex items-center space-x-2 pb-4 overflow-x-auto scrollbar-none">
            {dates.map((d, index) => {
              const isSelected = selectedDateIndex === index;
              return (
                <button
                  key={d.isoString}
                  onClick={() => setSelectedDateIndex(index)}
                  className={`flex flex-col items-center min-w-[70px] py-2.5 px-3 rounded-2xl transition border ${
                    isSelected
                      ? 'bg-brand-500 text-white border-brand-400 shadow-glow'
                      : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold">{d.day}</span>
                  <span className="text-lg font-black">{d.dateNum}</span>
                  <span className="text-[10px] uppercase">{d.month}</span>
                </button>
              );
            })}
          </div>

          {/* Cinemas & Showtimes Listing */}
          <div className="mt-8 space-y-6">
            {Object.keys(cinemaShowsMap).length > 0 ? (
              Object.values(cinemaShowsMap).map(({ cinema, shows }) => (
                <div key={cinema.id} className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center space-x-2">
                        <span>{cinema.name}</span>
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                        <span>{cinema.address}</span>
                      </p>
                    </div>
                  </div>

                  {/* Showtimes Pill Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {shows.map((show: any) => {
                      const startTime = new Date(show.startTime);
                      const timeStr = startTime.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      });

                      return (
                        <button
                          key={show.id}
                          onClick={() => navigate(`/book/seats/${show.id}`)}
                          className="group relative p-3 rounded-2xl bg-slate-900 border border-slate-700/80 hover:border-brand-500 hover:shadow-glow transition text-left"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-white group-hover:text-brand-400 transition">
                              {timeStr}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center space-x-2 text-[10px] text-slate-400">
                            <span className="text-emerald-400 font-semibold">{show.screenName}</span>
                            <span>•</span>
                            <span>₹{show.pricing.regular}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center rounded-3xl glass-panel border border-slate-800">
                <Ticket className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">No Shows Available for This Date</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Try choosing another date above or checking a different cinema location.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default MovieDetailsPage;
