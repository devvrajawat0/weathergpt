'use client';

import React from 'react';
import { Wind, ShieldAlert, Activity, Sun } from 'lucide-react';
import { AirQualityData, Language } from '@/types/weather';
import { t } from '@/lib/i18n';

interface AQIGaugeProps {
  airQuality: AirQualityData;
  uvIndex: number;
  lang: Language;
}

export const AQIGauge: React.FC<AQIGaugeProps> = ({ airQuality, uvIndex, lang }) => {
  const { aqi, pm2_5, pm10, status, advisory } = airQuality;

  const getAQIColor = (val: number) => {
    if (val <= 50) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (val <= 100) return 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10';
    if (val <= 150) return 'text-amber-500 border-amber-500/40 bg-amber-500/10';
    if (val <= 200) return 'text-red-400 border-red-500/40 bg-red-500/10';
    if (val <= 300) return 'text-purple-400 border-purple-500/40 bg-purple-500/10';
    return 'text-rose-600 border-rose-600/40 bg-rose-600/10';
  };

  const getUVAdvisory = (uv: number) => {
    if (uv <= 2) return 'Low UV risk: No protection required for general outdoor activity.';
    if (uv <= 5) return 'Moderate UV: Wear sunglasses and apply SPF 30+ sunscreen around noon.';
    if (uv <= 7) return 'High UV hazard: Wear wide hats, UV sunglasses, and seek shade during 11 AM - 3 PM.';
    if (uv <= 10) return 'Very High UV danger: Avoid peak sun exposure; protective clothing essential.';
    return 'Extreme UV radiation: Skin and eye burn damage can occur in minutes!';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Air Quality Card */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">{t('aqi', lang)}</h3>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getAQIColor(aqi)}`}>
            {status}
          </span>
        </div>

        <div className="flex items-center gap-6 mb-4">
          <div className="text-4xl font-extrabold text-white tracking-tight">
            {aqi} <span className="text-xs font-normal text-slate-400">US AQI</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs flex-1">
            <div className="bg-white/5 p-2 rounded-lg border border-white/10">
              <span className="text-slate-400 block">PM2.5</span>
              <span className="font-semibold text-white">{pm2_5} µg/m³</span>
            </div>
            <div className="bg-white/5 p-2 rounded-lg border border-white/10">
              <span className="text-slate-400 block">PM10</span>
              <span className="font-semibold text-white">{pm10} µg/m³</span>
            </div>
          </div>
        </div>

        {/* AQI Health Advisory line */}
        <div className="flex items-start gap-2 p-3 bg-blue-950/40 border border-blue-500/20 rounded-xl text-xs text-blue-200">
          <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p>{advisory}</p>
        </div>
      </div>

      {/* UV Index Card */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-white">{t('uvIndex', lang)}</h3>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {uvIndex} / 12 Max
          </span>
        </div>

        <div className="mb-4">
          <div className="text-4xl font-extrabold text-white tracking-tight mb-2">
            {uvIndex} <span className="text-xs font-normal text-slate-400">Solar Index</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 rounded-full"
              style={{ width: `${Math.min(100, (uvIndex / 12) * 100)}%` }}
            />
          </div>
        </div>

        {/* UV Health Advisory line */}
        <div className="flex items-start gap-2 p-3 bg-amber-950/40 border border-amber-500/20 rounded-xl text-xs text-amber-200">
          <Activity className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>{getUVAdvisory(uvIndex)}</p>
        </div>
      </div>
    </div>
  );
};
