'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, Download, CloudSun } from 'lucide-react';
import { WeatherData, Language } from '@/types/weather';
import { t } from '@/lib/i18n';

interface ShareWeatherCardProps {
  weather: WeatherData;
  lang: Language;
}

export const ShareWeatherCard: React.FC<ShareWeatherCardProps> = ({ weather, lang }) => {
  const [copied, setCopied] = useState(false);
  const { location, current } = weather;

  const summaryText = `🌤️ WeatherGPT Update for ${location.name}, ${location.country}:
Temperature: ${current.temperature}°C (Feels like ${current.apparent_temperature}°C)
Condition: ${current.condition}
Humidity: ${current.relative_humidity}% | Wind: ${current.wind_speed} km/h | AQI: ${weather.airQuality.aqi}
Generated via WeatherGPT App`;

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Weather in ${location.name}`,
          text: summaryText,
          url: window.location.href,
        });
      } catch (e) {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">{t('shareCard', lang)}</h3>
        </div>
      </div>

      {/* Styled Exportable Summary Card */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/80 to-slate-900 border border-blue-400/30 text-white mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 font-bold text-sm text-blue-300">
            <CloudSun className="w-4 h-4" />
            <span>WeatherGPT Snapshot</span>
          </div>
          <span className="text-[10px] text-slate-400">{new Date().toLocaleDateString()}</span>
        </div>

        <div className="text-xl font-bold text-white mb-1">{location.name}</div>
        <div className="text-2xl font-extrabold text-blue-300 mb-2">
          {current.temperature}°C <span className="text-xs font-normal text-slate-300">({current.condition})</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 pt-2 border-t border-white/10">
          <div>Humidity: <strong className="text-white">{current.relative_humidity}%</strong></div>
          <div>Wind: <strong className="text-white">{current.wind_speed}km/h</strong></div>
          <div>AQI: <strong className="text-white">{weather.airQuality.aqi}</strong></div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center gap-2 transition"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied to Clipboard!' : t('copySummary', lang)}</span>
        </button>

        <button
          onClick={handleShare}
          className="py-2 px-4 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};
