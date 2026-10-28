import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Play, Ticket, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface HeroMovie {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  posterUrl: string;
  rating: number;
  genres: string[];
  durationMinutes: number;
  trailerUrl?: string;
  ageClassification: string;
}

export const HeroCarousel: React.FC<{ movies: HeroMovie[] }> = ({ movies }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trailerModalUrl, setTrailerModalUrl] = useState<string | null>(null);

  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [movies.length]);

  if (!movies || movies.length === 0) return null;

  const currentMovie = movies[currentIndex];

  // Helper to extract YouTube embed URL
  const getEmbedUrl = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : null;
  };

  return (
    <div className="relative w-full h-[480px] sm:h-[560px] lg:h-[620px] overflow-hidden rounded-3xl mb-12 border border-slate-800/80 shadow-2xl">
      {/* Background Image with Cinematic Overlay */}
      <div className="absolute inset-0 bg-slate-950">
        <img
          src={currentMovie.bannerUrl || currentMovie.posterUrl}
          alt={currentMovie.title}
          className="w-full h-full object-cover object-top opacity-50 scale-105 transition-all duration-1000 ease-out"
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-darkest via-cinema-darkest/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-darkest via-cinema-darkest/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-end pb-12 sm:pb-16 z-10">
        <div className="max-w-2xl space-y-4 animate-fade-in">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/40 text-xs font-bold uppercase tracking-wider">
              Featured Premiere
            </span>
            <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{Number(currentMovie.rating).toFixed(1)}</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-800/80 text-xs text-slate-300 border border-slate-700">
              {currentMovie.ageClassification}
            </span>
            <span className="text-xs text-slate-400">
              {Math.floor(currentMovie.durationMinutes / 60)}h {currentMovie.durationMinutes % 60}m
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            {currentMovie.title}
          </h1>

          {/* Genres */}
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-300">
            {currentMovie.genres.map((g) => (
              <span key={g} className="px-2.5 py-1 rounded-lg bg-slate-800/60 backdrop-blur-md border border-slate-700/60">
                {g}
              </span>
            ))}
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-xl">
            {currentMovie.description}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to={`/movies/${currentMovie.id}`}
              className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-rose-500 hover:from-brand-500 hover:to-rose-400 text-sm font-bold text-white shadow-glow transition transform hover:-translate-y-0.5"
            >
              <Ticket className="w-4 h-4" />
              <span>Book Tickets Now</span>
            </Link>

            {currentMovie.trailerUrl && (
              <button
                onClick={() => setTrailerModalUrl(getEmbedUrl(currentMovie.trailerUrl))}
                className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-sm font-semibold text-white backdrop-blur-md transition"
              >
                <Play className="w-4 h-4 text-brand-400 fill-brand-400" />
                <span>Watch Trailer</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Manual Slide Controls */}
      {movies.length > 1 && (
        <div className="absolute bottom-6 right-6 sm:right-12 z-20 flex items-center space-x-2">
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length)}
            className="p-2 rounded-xl bg-black/60 hover:bg-brand-600 text-white backdrop-blur-md border border-slate-800 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-1 px-2">
            {movies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'w-6 bg-brand-500' : 'w-2 bg-slate-600'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % movies.length)}
            className="p-2 rounded-xl bg-black/60 hover:bg-brand-600 text-white backdrop-blur-md border border-slate-800 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Trailer Modal */}
      {trailerModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <button
              onClick={() => setTrailerModalUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/80 hover:bg-brand-600 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={trailerModalUrl}
              title="Movie Trailer"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default HeroCarousel;
