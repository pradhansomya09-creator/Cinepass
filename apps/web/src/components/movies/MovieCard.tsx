import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Ticket } from 'lucide-react';

export interface MovieCardProps {
  movie: {
    id: string;
    title: string;
    posterUrl: string;
    rating: number;
    durationMinutes: number;
    language: string;
    ageClassification: string;
    genres: string[];
    isComingSoon?: boolean;
    hasShows?: boolean;
  };
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden glass-panel border border-slate-800/80 hover:border-brand-500/50 hover:shadow-glow transition-all duration-300">
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Rating Badge */}
        {movie.rating > 0 && (
          <div className="absolute top-2.5 left-2.5 flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-amber-500/40 text-amber-400 text-xs font-bold shadow-lg">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{Number(movie.rating).toFixed(1)}</span>
          </div>
        )}

        {/* Age Classification Badge */}
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-bold text-slate-300 border border-slate-700">
          {movie.ageClassification}
        </div>

        {/* Language & Duration Bottom Bar */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/60 to-transparent flex items-center justify-between text-[11px] text-slate-300">
          <span className="font-semibold px-2 py-0.5 rounded bg-slate-800/80">{movie.language}</span>
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{Math.floor(movie.durationMinutes / 60)}h {movie.durationMinutes % 60}m</span>
          </span>
        </div>
      </div>

      {/* Details Container */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
            {movie.title}
          </h3>

          {/* Genres */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {movie.genres.slice(0, 2).map((g) => (
              <span
                key={g}
                className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800/90 text-slate-400 border border-slate-800"
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {movie.isComingSoon ? (
            <Link
              to={`/movies/${movie.id}`}
              className="w-full flex items-center justify-center py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Coming Soon
            </Link>
          ) : (
            <Link
              to={`/movies/${movie.id}`}
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-glow transition group-hover:bg-brand-500"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Book Tickets</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
export default MovieCard;
