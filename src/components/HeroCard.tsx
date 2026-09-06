'use client';

import React, { useState } from 'react';
import { Thermometer, Wind, Droplets, Gauge, Sun, Volume2, Sunrise, Sunset, Eye } from 'lucide-react';
import { WeatherData, Language } from '@/types/weather';
import { t } from '@/lib/i18n';
import { speakText, stopSpeaking } from '@/lib/tts';

interface HeroCardProps {
  weather: WeatherData;
  lang: Language;
}

export const HeroCard: React.FC<HeroCardProps> = ({ weather, lang }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { location, current, daily } = weather;

  const maxTemp = daily.temperature_2m_max?.[0] ? Math.round(daily.temperature_2m_max[0]) : current.temperature + 3;
  const minTemp = daily.temperature_2m_min?.[0] ? Math.round(daily.temperature_2m_min[0]) : current.temperature - 4;

  const sunriseTime = daily.sunrise?.[0]
    ? new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '06:15 AM';
  const sunsetTime = daily.sunset?.[0]
    ? new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '06:45 PM';

  const handleSpeak = async () => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const text =
      lang === 'hi'
        ? `वर्तमान में ${location.name} में तापमान ${current.temperature} डिग्री सेल्सियस है। मौसम ${current.condition} है। हवा की गति ${current.wind_speed} किलोमीटर प्रति घंटा और आर्द्रता ${current.relative_humidity} प्रतिशत है।`
        : `Currently in ${location.name}, the temperature is ${current.temperature} degrees Celsius with ${current.condition}. Wind speed is ${current.wind_speed} kilometers per hour and humidity is ${current.relative_humidity} percent.`;

    await speakText(text, lang);
    setIsPlaying(false);
  };

  return (
    <div className="glass-panel p-6 sm:p-8 text-white relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {location.name}
            </h1>
            {location.country && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-white/10 rounded-full text-slate-300">
                {location.country_code || location.country}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300 mt-1 font-medium">
            {location.admin1 ? `${location.admin1} • ` : ''}
            {new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>

        <button
          onClick={handleSpeak}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border transition ${
            isPlaying
              ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
              : 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border-blue-400/40'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>{isPlaying ? t('speaking', lang) : t('listen', lang)}</span>
        </button>
      </div>

      {/* Main Temperature Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 items-center">
        <div className="flex items-center gap-4">
          <div className="text-6xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-100 to-blue-200">
            {current.temperature}°<span className="text-4xl">C</span>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-300 capitalize">{current.condition}</div>
            <div className="text-xs text-slate-300 mt-0.5">
              H: <span className="font-semibold text-white">{maxTemp}°C</span> • L:{' '}
              <span className="font-semibold text-white">{minTemp}°C</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {t('feelsLike', lang)} <span className="text-slate-200 font-semibold">{current.apparent_temperature}°C</span>
            </div>
          </div>
        </div>

        {/* Dynamic Metric Grid Cards */}
        <div className="grid grid-cols-2 gap-3 col-span-2">
          <div className="glass-card p-3.5 flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">{t('humidity', lang)}</div>
              <div className="text-sm font-bold text-white">{current.relative_humidity}%</div>
            </div>
          </div>

          <div className="glass-card p-3.5 flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-xl text-teal-400">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">{t('windSpeed', lang)}</div>
              <div className="text-sm font-bold text-white">{current.wind_speed} km/h</div>
            </div>
          </div>

          <div className="glass-card p-3.5 flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">{t('pressure', lang)}</div>
              <div className="text-sm font-bold text-white">{current.pressure} hPa</div>
            </div>
          </div>

          <div className="glass-card p-3.5 flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">{t('uvIndex', lang)}</div>
              <div className="text-sm font-bold text-white">{current.uv_index} / 12</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sunrise & Sunset Solar Timeline Arc */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
            <Sunrise className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 block">{t('sunrise', lang)}</span>
            <span className="font-semibold text-white">{sunriseTime}</span>
          </div>
        </div>

        {/* Visual Arc representation */}
        <div className="flex-1 max-w-xs h-1.5 bg-white/10 rounded-full relative overflow-hidden mx-2">
          <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-amber-400 via-blue-400 to-purple-500 rounded-full" />
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
            <Sunset className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 block">{t('sunset', lang)}</span>
            <span className="font-semibold text-white">{sunsetTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
