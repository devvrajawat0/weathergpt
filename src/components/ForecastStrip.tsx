'use client';

import React from 'react';
import { Calendar, Clock, CloudRain, Sun, Cloud, CloudLightning, CloudSnow } from 'lucide-react';
import { WeatherData, Language } from '@/types/weather';
import { t, getWeatherConditionDescription } from '@/lib/i18n';

interface ForecastStripProps {
  weather: WeatherData;
  lang: Language;
}

export const ForecastStrip: React.FC<ForecastStripProps> = ({ weather, lang }) => {
  const { hourly, daily } = weather;

  const getWeatherIcon = (code: number) => {
    if (code >= 95) return <CloudLightning className="w-5 h-5 text-amber-400" />;
    if (code >= 71) return <CloudSnow className="w-5 h-5 text-cyan-300" />;
    if (code >= 51) return <CloudRain className="w-5 h-5 text-blue-400" />;
    if (code >= 2) return <Cloud className="w-5 h-5 text-slate-300" />;
    return <Sun className="w-5 h-5 text-amber-300" />;
  };

  return (
    <div className="space-y-6">
      {/* 24-Hour Hourly Scrollable Strip */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-200">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>{t('hourlyForecast', lang)}</span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {hourly.time.map((timeStr, idx) => {
            const date = new Date(timeStr);
            const hourFormatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const temp = Math.round(hourly.temperature_2m[idx] || 0);
            const rainProb = hourly.precipitation_probability[idx] || 0;
            const code = hourly.weathercode[idx] || 0;

            return (
              <div
                key={timeStr}
                className="flex-shrink-0 w-20 glass-card p-3 text-center flex flex-col items-center justify-between gap-2"
              >
                <span className="text-xs text-slate-300 font-medium">{hourFormatted}</span>
                <div className="my-1">{getWeatherIcon(code)}</div>
                <span className="text-sm font-bold text-white">{temp}°C</span>
                {rainProb > 10 ? (
                  <span className="text-[10px] text-blue-300 font-semibold flex items-center gap-0.5">
                    <CloudRain className="w-3 h-3" /> {rainProb}%
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">0%</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-Day Daily Forecast List */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-200">
          <Calendar className="w-4 h-4 text-purple-400" />
          <span>{t('dailyForecast', lang)}</span>
        </div>

        <div className="space-y-2.5">
          {daily.time.slice(0, 7).map((timeStr, idx) => {
            const date = new Date(timeStr);
            const dayName =
              idx === 0
                ? lang === 'hi'
                  ? 'आज'
                  : 'Today'
                : date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short' });

            const maxT = Math.round(daily.temperature_2m_max[idx] || 0);
            const minT = Math.round(daily.temperature_2m_min[idx] || 0);
            const code = daily.weathercode[idx] || 0;
            const desc = getWeatherConditionDescription(code, lang);
            const rainSum = daily.precipitation_sum?.[idx] || 0;

            return (
              <div
                key={timeStr}
                className="glass-card px-4 py-3 flex items-center justify-between text-sm gap-4"
              >
                <div className="w-24 font-semibold text-white">{dayName}</div>
                <div className="flex items-center gap-2 w-36">
                  {getWeatherIcon(code)}
                  <span className="text-xs text-slate-300 truncate">{desc}</span>
                </div>
                {rainSum > 0 ? (
                  <span className="text-xs text-blue-300 font-medium hidden sm:inline">
                    {rainSum.toFixed(1)} mm
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 hidden sm:inline">-</span>
                )}
                <div className="flex items-center gap-3 font-medium">
                  <span className="text-white font-bold">{maxT}°</span>
                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden hidden xs:block">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-amber-400 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(20, (maxT / 45) * 100))}%` }}
                    />
                  </div>
                  <span className="text-slate-400 text-xs">{minT}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
