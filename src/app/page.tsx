'use client';

import React, { useState, useEffect } from 'react';
import { GeoLocation, WeatherData, Language } from '@/types/weather';
import { detectUserLocation, DEFAULT_LOCATION } from '@/lib/geocoding';
import { fetchWeatherData } from '@/lib/openmeteo';
import { WeatherCanvas } from '@/components/WeatherCanvas';
import { Navbar } from '@/components/Navbar';
import { HeroCard } from '@/components/HeroCard';
import { ForecastStrip } from '@/components/ForecastStrip';
import { AQIGauge } from '@/components/AQIGauge';
import { FoodClothingCard } from '@/components/FoodClothingCard';
import { FarmerAdvisoryCard } from '@/components/FarmerAdvisory';
import { AlertModal } from '@/components/AlertModal';
import { HistoricalCompare } from '@/components/HistoricalCompare';
import { FavoriteCities } from '@/components/FavoriteCities';
import { ShareWeatherCard } from '@/components/ShareWeatherCard';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const [location, setLocation] = useState<GeoLocation>(DEFAULT_LOCATION);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Language>('en');

  // Detect user IP location on first load
  useEffect(() => {
    async function initLocation() {
      setLoading(true);
      const userLoc = await detectUserLocation();
      setLocation(userLoc);
    }
    initLocation();
  }, []);

  // Fetch weather data whenever location changes
  useEffect(() => {
    async function loadWeather() {
      setLoading(true);
      try {
        const data = await fetchWeatherData(location);
        setWeather(data);
      } catch (err) {
        console.error('Failed to load weather data', err);
      } finally {
        setLoading(false);
      }
    }
    loadWeather();
  }, [location]);

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const weatherCode = weather?.current.weather_code || 0;
  const isDay = weather?.current.is_day ?? 1;

  return (
    <div className="relative min-h-screen flex flex-col z-10 selection:bg-blue-500 selection:text-white">
      {/* Dynamic Animated Canvas Background */}
      <WeatherCanvas weatherCode={weatherCode} isDay={isDay} />

      {/* Top Navbar */}
      <Navbar
        currentLocation={location}
        onSelectLocation={setLocation}
        lang={lang}
        onToggleLang={handleToggleLang}
      />

      {/* Severe Weather Alert Popup Modal */}
      {weather && (
        <AlertModal
          alerts={weather.alerts}
          weatherCode={weatherCode}
          lang={lang}
        />
      )}

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6 z-10">
        {loading && !weather ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            <p className="text-sm font-medium text-slate-300">
              Fetching real-time satellite weather for {location.name}...
            </p>
          </div>
        ) : weather ? (
          <>
            {/* Hero Card */}
            <HeroCard weather={weather} lang={lang} />

            {/* Quick Switch Favorite City Chips */}
            <FavoriteCities
              currentLocation={location}
              onSelectCity={setLocation}
              lang={lang}
            />

            {/* Air Quality & UV Index Cards */}
            <AQIGauge
              airQuality={weather.airQuality}
              uvIndex={weather.current.uv_index}
              lang={lang}
            />

            {/* 24-Hour Hourly & 7-Day Forecast */}
            <ForecastStrip weather={weather} lang={lang} />

            {/* Weather-Tailored Food & Clothing Suggestions */}
            <FoodClothingCard current={weather.current} lang={lang} />

            {/* Smart Farmer & Agriculture Advisory */}
            <FarmerAdvisoryCard
              current={weather.current}
              precipitationSum={weather.daily.precipitation_sum?.[0] || 0}
              lang={lang}
            />

            {/* Historical Compare & Shareable Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HistoricalCompare weather={weather} lang={lang} />
              <ShareWeatherCard weather={weather} lang={lang} />
            </div>
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="z-10 py-6 border-t border-white/10 text-center text-xs text-slate-400 bg-slate-950/70 backdrop-blur-md mt-10">
        <p>WeatherGPT Platform • Smart India Hackathon (SIH) Project</p>
        <p className="mt-1 text-slate-500">
          Powered by Open-Meteo High Precision Satellite & Meteorological Models
        </p>
      </footer>
    </div>
  );
}
