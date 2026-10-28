import React, { useState } from 'react';
import { useCity } from '../../context/CityContext';
import { MapPin, Search, X, Check } from 'lucide-react';

export const CityModal: React.FC = () => {
  const { cities, selectedCity, setSelectedCity, isModalOpen, setIsModalOpen } = useCity();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isModalOpen) return null;

  const popularCities = ['Mumbai', 'Bengaluru', 'Delhi-NCR', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'];

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl p-6 overflow-hidden rounded-2xl glass-panel border border-slate-700/60 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-white">
            <MapPin className="w-5 h-5 text-brand-500" />
            <h3 className="text-xl font-bold">Select Your City</h3>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative my-4">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search for your city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-brand-500 transition"
            autoFocus
          />
        </div>

        {/* Popular Cities */}
        {!searchTerm && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Popular Cities</p>
            <div className="flex flex-wrap gap-2">
              {popularCities.map((cityName) => {
                const city = cities.find((c) => c.name.toLowerCase() === cityName.toLowerCase());
                if (!city) return null;
                const isSelected = selectedCity?.id === city.id;
                return (
                  <button
                    key={city.id}
                    onClick={() => setSelectedCity(city)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-brand-500 text-white shadow-glow'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <span>{city.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* All / Filtered Cities List */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">All Cities</p>
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {filteredCities.map((city) => {
              const isSelected = selectedCity?.id === city.id;
              return (
                <button
                  key={city.id}
                  onClick={() => setSelectedCity(city)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition text-left ${
                    isSelected
                      ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div>
                    <span className="font-medium text-white">{city.name}</span>
                    <span className="text-xs text-slate-500 ml-2">({city.state})</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-500" />}
                </button>
              );
            })}
            {filteredCities.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">No cities found matching "{searchTerm}"</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default CityModal;
