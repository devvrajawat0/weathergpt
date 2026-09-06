'use client';

import React, { useState, useEffect } from 'react';
import { Star, Plus, Trash2, MapPin } from 'lucide-react';
import { GeoLocation, Language } from '@/types/weather';
import { geocodeCity } from '@/lib/geocoding';
import { t } from '@/lib/i18n';

const DEFAULT_INDIAN_CITIES = [
  'Gwalior',
  'New Delhi',
  'Mumbai',
  'Bengaluru',
  'Bhopal',
  'Jaipur',
  'Varanasi',
  'Kolkata',
  'Kochi',
  'Shimla',
];

interface FavoriteCitiesProps {
  currentLocation: GeoLocation;
  onSelectCity: (loc: GeoLocation) => void;
  lang: Language;
}

export const FavoriteCities: React.FC<FavoriteCitiesProps> = ({
  currentLocation,
  onSelectCity,
  lang,
}) => {
  const [favorites, setFavorites] = useState<string[]>(DEFAULT_INDIAN_CITIES);

  useEffect(() => {
    const saved = localStorage.getItem('weather_gpt_fav_cities');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const toggleFavorite = (cityName: string) => {
    let updated: string[];
    if (favorites.includes(cityName)) {
      updated = favorites.filter((c) => c !== cityName);
    } else {
      updated = [...favorites, cityName];
    }
    setFavorites(updated);
    localStorage.setItem('weather_gpt_fav_cities', JSON.stringify(updated));
  };

  const isCurrentFavorite = favorites.includes(currentLocation.name);

  const handleChipClick = async (cityName: string) => {
    const results = await geocodeCity(cityName);
    if (results.length > 0) {
      onSelectCity(results[0]);
    }
  };

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-300">
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 text-amber-400" />
          <span>{t('quickCities', lang)}</span>
        </div>

        <button
          onClick={() => toggleFavorite(currentLocation.name)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] transition ${
            isCurrentFavorite
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-white/5 text-slate-300 hover:text-white border-white/10'
          }`}
        >
          <Star className={`w-3 h-3 ${isCurrentFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span>{isCurrentFavorite ? 'Saved' : '+ Bookmark City'}</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {favorites.map((cityName) => {
          const isActive = currentLocation.name.toLowerCase() === cityName.toLowerCase();
          return (
            <button
              key={cityName}
              onClick={() => handleChipClick(cityName)}
              className={`px-3 py-1.5 text-xs rounded-xl border transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600/40 text-white font-bold border-blue-400 shadow-md shadow-blue-900/50'
                  : 'bg-white/5 hover:bg-white/15 text-slate-300 border-white/10'
              }`}
            >
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{cityName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
