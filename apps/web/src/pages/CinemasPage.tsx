import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useCity } from '../context/CityContext';
import { MapPin, Search, Sparkles, Film, ArrowRight } from 'lucide-react';

export const CinemasPage: React.FC = () => {
  const { selectedCity, setIsModalOpen } = useCity();
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.cinemas
      .getAll({ cityId: selectedCity?.id })
      .then((res) => {
        if (res.success) setCinemas(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCity?.id]);

  const filtered = cinemas.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Cinemas in {selectedCity?.name}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Experience state-of-the-art IMAX with Laser, Dolby Atmos & Luxury Recliners
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search cinema..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center space-x-1.5 transition whitespace-nowrap"
          >
            <MapPin className="w-3.5 h-3.5 text-brand-500" />
            <span>Change City</span>
          </button>
        </div>
      </div>

      {/* Cinema Cards List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 rounded-3xl bg-slate-900 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-6">
          {filtered.map((cinema) => (
            <div
              key={cinema.id}
              className="p-6 rounded-3xl glass-panel border border-slate-800 hover:border-slate-700 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{cinema.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-1">
                    <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    <span>{cinema.address}</span>
                  </p>
                </div>
                <Link
                  to={`/movies`}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-glow transition self-start sm:self-auto"
                >
                  <span>View Shows</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Facilities */}
              {cinema.facilities && cinema.facilities.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                  {cinema.facilities.map((f: string) => (
                    <span
                      key={f}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/90 text-slate-300 border border-slate-800 text-[11px] font-medium flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{f}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Screens */}
              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Auditoriums:</span>
                {cinema.screens?.map((s: any) => (
                  <span key={s.id} className="text-brand-400 font-medium">
                    {s.name} ({s.soundType})
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-3xl glass-panel border border-slate-800">
          <Film className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-white">No Cinemas Found</h4>
          <p className="text-xs text-slate-400 mt-1">Try selecting a different city or clearing your search.</p>
        </div>
      )}
    </div>
  );
};
export default CinemasPage;
