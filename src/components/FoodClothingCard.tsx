'use client';

import React from 'react';
import { Utensils, Shirt, Umbrella, Sparkles, Coffee } from 'lucide-react';
import { CurrentWeather, Language } from '@/types/weather';
import { getFoodClothingSuggestions } from '@/lib/suggestions';
import { t } from '@/lib/i18n';

interface FoodClothingCardProps {
  current: CurrentWeather;
  lang: Language;
}

export const FoodClothingCard: React.FC<FoodClothingCardProps> = ({ current, lang }) => {
  const suggestions = getFoodClothingSuggestions(current, lang);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Food & Beverages Recommendations */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{t('foodSuggestions', lang)}</h3>
            <p className="text-xs text-slate-400">Weather-tailored culinary picks</p>
          </div>
        </div>

        <p className="text-xs text-amber-200/90 bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/20 mb-4 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          {suggestions.reason}
        </p>

        <div className="space-y-3">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-2">
              Recommended Dishes
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestions.food.map((item, idx) => (
                <span
                  key={idx}
                  className="text-xs font-medium px-3 py-1.5 bg-white/10 text-white rounded-lg border border-white/15 hover:bg-white/20 transition"
                >
                  🍲 {item}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-2">
              Refreshing Beverages
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestions.drinks.map((item, idx) => (
                <span
                  key={idx}
                  className="text-xs font-medium px-3 py-1.5 bg-amber-500/15 text-amber-200 rounded-lg border border-amber-500/20"
                >
                  ☕ {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clothing & Accessories Recommendations */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
            <Shirt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{t('clothingSuggestions', lang)}</h3>
            <p className="text-xs text-slate-400">Optimal outfit & gear guide</p>
          </div>
        </div>

        <div className="space-y-3 mt-2">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-2">
              Apparel Outfit
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestions.clothing.map((item, idx) => (
                <span
                  key={idx}
                  className="text-xs font-medium px-3 py-1.5 bg-white/10 text-white rounded-lg border border-white/15"
                >
                  👕 {item}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-2">
              Essential Accessories
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestions.accessories.map((item, idx) => (
                <span
                  key={idx}
                  className="text-xs font-medium px-3 py-1.5 bg-blue-500/15 text-blue-200 rounded-lg border border-blue-500/20"
                >
                  🕶️ {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
