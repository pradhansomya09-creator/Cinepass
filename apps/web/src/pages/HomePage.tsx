import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useCity } from '../context/CityContext';
import HeroCarousel, { HeroMovie } from '../components/movies/HeroCarousel';
import MovieCard from '../components/movies/MovieCard';
import { Film, Sparkles, Calendar, ChevronRight, SlidersHorizontal } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { selectedCity } = useCity();
  const [featuredMovies, setFeaturedMovies] = useState<HeroMovie[]>([]);
  const [nowShowing, setNowShowing] = useState<any[]>([]);
  const [comingSoon, setComingSoon] = useState<any[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  const genres = ['All', 'Action', 'Sci-Fi', 'Drama', 'Adventure', 'Thriller', 'Animation'];

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.movies.getAll({ status: 'featured', limit: 5 }),
      api.movies.getAll({ status: 'now_showing', cityId: selectedCity?.id, limit: 12 }),
      api.movies.getAll({ status: 'coming_soon', limit: 6 }),
    ])
      .then(([featuredRes, nowRes, comingRes]) => {
        if (featuredRes.success) setFeaturedMovies(featuredRes.data);
        if (nowRes.success) setNowShowing(nowRes.data);
        if (comingRes.success) setComingSoon(comingRes.data);
      })
      .catch((err) => console.error('Error loading movies:', err))
      .finally(() => setLoading(false));
  }, [selectedCity?.id]);

  const filteredNowShowing =
    selectedGenre === 'All'
      ? nowShowing
      : nowShowing.filter((m) => m.genres.includes(selectedGenre));

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Carousel */}
      {featuredMovies.length > 0 && <HeroCarousel movies={featuredMovies} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Genre Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <SlidersHorizontal className="w-4 h-4 text-slate-500 mr-2 flex-shrink-0" />
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedGenre === g
                  ? 'bg-brand-500 text-white shadow-glow'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Now Showing Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-8 bg-brand-500 rounded-full" />
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Now Showing</h2>
                <p className="text-xs text-slate-400">
                  Currently playing in {selectedCity ? selectedCity.name : 'all cinemas'}
                </p>
              </div>
            </div>
            <Link
              to="/movies?status=now_showing"
              className="flex items-center space-x-1 text-xs font-bold text-brand-400 hover:text-brand-300 transition"
            >
              <span>Explore All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-2xl bg-slate-900 animate-pulse" />
              ))}
            </div>
          ) : filteredNowShowing.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredNowShowing.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center rounded-2xl glass-panel border border-slate-800">
              <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">No movies found for selected genre</p>
              <button
                onClick={() => setSelectedGenre('All')}
                className="mt-3 px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-brand-400 font-semibold"
              >
                Clear Filter
              </button>
            </div>
          )}
        </section>

        {/* Coming Soon Section */}
        {comingSoon.length > 0 && (
          <section className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-8 bg-amber-500 rounded-full" />
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Upcoming Premieres</h2>
                  <p className="text-xs text-slate-400">Mark your calendars for upcoming blockbuster releases</p>
                </div>
              </div>
              <Link
                to="/movies?status=coming_soon"
                className="flex items-center space-x-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {comingSoon.map((movie) => (
                <MovieCard key={movie.id} movie={{ ...movie, isComingSoon: true }} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
export default HomePage;
