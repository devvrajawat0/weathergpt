'use client';

import React from 'react';
import { History, ArrowUpRight, ArrowDownRight, Droplets } from 'lucide-react';
import { WeatherData, Language } from '@/types/weather';
import { t, getWeatherConditionDescription } from '@/lib/i18n';

interface HistoricalCompareProps {
  weather: WeatherData;
  lang: Language;
}

export const HistoricalCompare: React.FC<HistoricalCompareProps> = ({ weather, lang }) => {
  const { historical, current } = weather;
  if (!historical) return null;

  const tempDiffMax = Math.round(current.temperature - historical.tempMax);
  const isWarmer = tempDiffMax >= 0;

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-white">{t('lastYearCompare', lang)}</h3>
          <p className="text-xs text-slate-400">Historical comparison on {historical.date}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-slate-400 block mb-1">Max Temperature</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">{Math.round(historical.tempMax)}°C</span>
            <span className="text-slate-400">(vs {current.temperature}°C today)</span>
          </div>
        </div>

        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-slate-400 block mb-1">Min Temperature</span>
          <div className="text-lg font-bold text-white">{Math.round(historical.tempMin)}°C</div>
        </div>

        <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-slate-400 block mb-1">Year-on-Year Trend</span>
            <div className="flex items-center gap-1 font-bold text-sm">
              {isWarmer ? (
                <span className="text-amber-400 flex items-center">
                  +{tempDiffMax}°C warmer <ArrowUpRight className="w-4 h-4 ml-0.5" />
                </span>
              ) : (
                <span className="text-blue-400 flex items-center">
                  {tempDiffMax}°C cooler <ArrowDownRight className="w-4 h-4 ml-0.5" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
