import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useCity } from '../context/CityContext';
import MovieCard from '../components/movies/MovieCard';
import { Search, Filter, SlidersHorizontal, Film } from 'lucide-react';

export const MoviesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedCity } = useCity();

  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const search = searchParams.get('search') || '';
  const genre = searchParams.get('genre') || '';
  const language = searchParams.get('language') || '';
  const status = searchParams.get('status') || '';
  const sortBy = searchParams.get('sortBy') || 'popularity';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const genresList = ['All', 'Action', 'Sci-Fi', 'Drama', 'Adventure', 'Thriller', 'Animation'];
  const languagesList = ['All', 'English', 'Hindi'];
  const sortOptions = [
    { label: 'Popularity', value: 'popularity' },
    { label: 'Highest Rated', value: 'rating' },
    { label: 'Release Date', value: 'releaseDate' },
  ];

  useEffect(() => {
    setLoading(true);
    const queryParams: any = {
      page,
      limit: 12,
      sortBy,
    };

    if (search) queryParams.search = search;
    if (genre && genre !== 'All') queryParams.genre = genre;
    if (language && language !== 'All') queryParams.language = language;
    if (status) queryParams.status = status;
    if (selectedCity?.id) queryParams.cityId = selectedCity.id;

    api.movies
      .getAll(queryParams)
      .then((res) => {
        if (res.success) {
          setMovies(res.data);
          setTotal(res.meta.total);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [search, genre, language, status, sortBy, page, selectedCity?.id]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (!value || value === 'All') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Movie Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse currently playing and upcoming movies {selectedCity ? `in ${selectedCity.name}` : ''}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search titles..."
            value={search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Status Tab */}
          <div className="flex items-center space-x-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => updateFilter('status', '')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                !status ? 'bg-brand-500 text-white shadow-glow' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => updateFilter('status', 'now_showing')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                status === 'now_showing' ? 'bg-brand-500 text-white shadow-glow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Now Showing
            </button>
            <button
              onClick={() => updateFilter('status', 'coming_soon')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                status === 'coming_soon' ? 'bg-brand-500 text-white shadow-glow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Coming Soon
            </button>
          </div>

          {/* Genre select */}
          <select
            value={genre || 'All'}
            onChange={(e) => updateFilter('genre', e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-brand-500"
          >
            {genresList.map((g) => (
              <option key={g} value={g}>{g === 'All' ? 'All Genres' : g}</option>
            ))}
          </select>

          {/* Language select */}
          <select
            value={language || 'All'}
            onChange={(e) => updateFilter('language', e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-brand-500"
          >
            {languagesList.map((l) => (
              <option key={l} value={l}>{l === 'All' ? 'All Languages' : l}</option>
            ))}
          </select>
        </div>

        {/* Sort Select */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-brand-500"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Movie Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-2xl bg-slate-900 animate-pulse" />
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-3xl glass-panel border border-slate-800 space-y-3">
          <Film className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Movies Match Your Selection</h3>
          <p className="text-xs text-slate-400">Try adjusting your filters, searching for a different title, or changing city.</p>
        </div>
      )}
    </div>
  );
};
export default MoviesPage;
