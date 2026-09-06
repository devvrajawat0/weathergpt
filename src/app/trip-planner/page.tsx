'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass, Plus, Trash2, Calendar, MapPin, Luggage, Volume2, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { GeoLocation, Language, TripItineraryDay } from '@/types/weather';
import { geocodeCity } from '@/lib/geocoding';
import { fetchWeatherData } from '@/lib/openmeteo';
import { speakText } from '@/lib/tts';
import { getWeatherConditionDescription } from '@/lib/i18n';

export default function TripPlannerPage() {
  const [cityInput, setCityInput] = useState('');
  const [selectedCities, setSelectedCities] = useState<string[]>(['Gwalior', 'Jaipur', 'Shimla']);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [days, setDays] = useState(5);
  const [itinerary, setItinerary] = useState<TripItineraryDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<Language>('en');

  const handleAddCity = async () => {
    if (!cityInput.trim()) return;
    const results = await geocodeCity(cityInput);
    if (results.length > 0) {
      const name = results[0].name;
      if (!selectedCities.includes(name)) {
        setSelectedCities((prev) => [...prev, name]);
      }
    }
    setCityInput('');
  };

  const handleRemoveCity = (cityToRemove: string) => {
    setSelectedCities((prev) => prev.filter((c) => c !== cityToRemove));
  };

  const handleGenerateItinerary = async () => {
    if (selectedCities.length === 0) return;
    setLoading(true);

    try {
      const allDays: TripItineraryDay[] = [];

      for (let i = 0; i < selectedCities.length; i++) {
        const cityName = selectedCities[i];
        const geos = await geocodeCity(cityName);
        if (geos.length > 0) {
          const w = await fetchWeatherData(geos[0]);
          
          for (let d = 0; d < Math.min(days, w.daily.time.length); d++) {
            const dateStr = w.daily.time[d];
            const maxT = Math.round(w.daily.temperature_2m_max[d] || 25);
            const minT = Math.round(w.daily.temperature_2m_min[d] || 15);
            const code = w.daily.weathercode[d] || 0;
            const rainSum = w.daily.precipitation_sum?.[d] || 0;

            const packing: string[] = [];
            let advisory = 'Smooth travel conditions expected.';

            if (code >= 51) {
              packing.push('Umbrella / Raincoat', 'Waterproof footwear', 'Extra socks');
              advisory = 'Rain expected. Allow extra transit time for slippery roadways.';
            } else if (maxT >= 32) {
              packing.push('Lightweight cotton wear', 'Sunglasses', 'Sunscreen SPF 50+', 'Water bottle');
              advisory = 'Stay hydrated and carry heat protection when sightseeing outdoors.';
            } else if (minT <= 15) {
              packing.push('Warm woolen jacket', 'Beanie cap', 'Thermal layers');
              advisory = 'Cold mornings and nights. Layer clothing for morning travel.';
            } else {
              packing.push('Casual cotton attire', 'Walking shoes', 'Sunglasses');
            }

            allDays.push({
              date: dateStr,
              city: cityName,
              weatherCode: code,
              tempMax: maxT,
              tempMin: minT,
              rainProbability: Math.min(100, Math.round(rainSum * 10)),
              packingTips: packing,
              travelAdvisory: advisory,
            });
          }
        }
      }

      setItinerary(allDays);
    } catch (e) {
      console.error('Failed to generate trip itinerary', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakDay = (item: TripItineraryDay) => {
    const text = `${item.city} on ${item.date}: Max temperature ${item.tempMax} degrees, min ${item.tempMin} degrees. ${item.travelAdvisory}. Recommended packing: ${item.packingTips.join(', ')}.`;
    speakText(text, lang);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white">
      {/* Header */}
      <header className="px-4 py-3 bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-slate-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base">Weather-Aware Trip Planner</h1>
              <p className="text-xs text-slate-400">Multi-City Itinerary & Smart Packing Guide</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setLang((prev) => (prev === 'en' ? 'hi' : 'en'))}
          className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl transition text-amber-300"
        >
          {lang === 'en' ? 'हिन्दी' : 'English'}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Controls Card */}
        <div className="glass-panel p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Luggage className="w-5 h-5 text-purple-400" /> Configure Your Journey
          </h2>

          {/* Add Cities input */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Destinations (Add Multiple Cities)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCity()}
                placeholder="Enter city or district (e.g. Jaipur, Manali, Goa)..."
                className="flex-1 px-4 py-2.5 text-sm glass-input placeholder-slate-400"
              />
              <button
                onClick={handleAddCity}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1 transition"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {/* City Chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCities.map((city) => (
              <span
                key={city}
                className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs rounded-xl flex items-center gap-2 font-medium"
              >
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                {city}
                <button
                  onClick={() => handleRemoveCity(city)}
                  className="hover:text-red-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Date & Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 text-sm glass-input text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Forecast Duration (Days)</label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full px-4 py-2 text-sm glass-input text-white bg-slate-900"
              >
                <option value={3}>3 Days</option>
                <option value={5}>5 Days</option>
                <option value={7}>7 Days</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateItinerary}
            disabled={loading || selectedCities.length === 0}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Sparkles className="w-5 h-5 text-amber-300" />
            )}
            <span>Generate Smart Weather Itinerary & Packing List</span>
          </button>
        </div>

        {/* Itinerary Results Grid */}
        {itinerary.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" /> Day-by-Day Forecast & Packing Guide
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {itinerary.map((item, idx) => (
                <div key={idx} className="glass-panel p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-white text-sm">{item.city}</span>
                      <span className="text-xs text-slate-400">({item.date})</span>
                    </div>

                    <button
                      onClick={() => handleSpeakDay(item)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 transition"
                      title="Listen audio tips"
                    >
                      <Volume2 className="w-4 h-4 text-purple-300" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">
                      Condition: {getWeatherConditionDescription(item.weatherCode, lang)}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {item.tempMax}°C / {item.tempMin}°C
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-white/5 p-2.5 rounded-lg border border-white/10">
                    {item.travelAdvisory}
                  </p>

                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-purple-300 block mb-1.5">
                      Smart Packing Recommendations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.packingTips.map((tip, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-xs px-2.5 py-1 bg-purple-500/15 border border-purple-500/30 text-purple-200 rounded-lg flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3 text-purple-400" /> {tip}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
