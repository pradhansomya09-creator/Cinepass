import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
        <Film className="w-8 h-8" />
      </div>
      <h1 className="text-5xl font-black text-white">404</h1>
      <h2 className="text-xl font-bold text-slate-300">Scene Not Found</h2>
      <p className="text-xs text-slate-400 max-w-sm">
        The page you are looking for may have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-glow transition mt-2"
      >
        <Home className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
};
export default NotFoundPage;
