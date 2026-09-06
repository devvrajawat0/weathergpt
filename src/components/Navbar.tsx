'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CloudSun, Search, Mic, Languages, MessageSquare, Compass, Home, MapPin } from 'lucide-react';
import { GeoLocation, Language } from '@/types/weather';
import { geocodeCity } from '@/lib/geocoding';
import { t } from '@/lib/i18n';

interface NavbarProps {
  currentLocation: GeoLocation;
  onSelectLocation: (loc: GeoLocation) => void;
  lang: Language;
  onToggleLang: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLocation,
  onSelectLocation,
  lang,
  onToggleLang,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Debounced autocomplete search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await geocodeCity(searchQuery);
      setSuggestions(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVoiceInput = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice search is not supported on this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    recognition.start();
    setIsListening(true);

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
      const results = await geocodeCity(transcript);
      if (results.length > 0) {
        onSelectLocation(results[0]);
        setSuggestions([]);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  return (
    <header className="sticky top-0 z-50 px-4 py-3 bg-slate-950/70 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand Logo & Current Location Badge */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white tracking-wide">
            <div className="p-2 bg-blue-600/30 rounded-xl border border-blue-400/40 text-blue-400">
              <CloudSun className="w-6 h-6 animate-pulse" />
            </div>
            <span>
              Weather<span className="text-blue-400">GPT</span>
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-300 bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            <span>
              {currentLocation.name}
              {currentLocation.admin1 ? `, ${currentLocation.admin1}` : ''}
            </span>
          </div>
        </div>

        {/* Search Bar with Autocomplete Dropdown */}
        <div className="relative w-full md:max-w-md" ref={dropdownRef}>
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder', lang)}
              className="w-full pl-10 pr-10 py-2.5 text-sm glass-input placeholder-slate-400"
            />
            <button
              onClick={handleVoiceInput}
              title={t('voiceInput', lang)}
              className={`absolute right-3 p-1 rounded-full text-slate-400 hover:text-white transition ${
                isListening ? 'text-red-400 animate-bounce' : ''
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* Autocomplete Suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-2xl z-50 max-h-60 overflow-y-auto">
              {suggestions.map((loc) => (
                <button
                  key={`${loc.id}-${loc.latitude}-${loc.longitude}`}
                  onClick={() => {
                    onSelectLocation(loc);
                    setSearchQuery('');
                    setSuggestions([]);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-600/30 transition flex items-center justify-between border-b border-white/5 last:border-0"
                >
                  <span className="text-sm text-white font-medium">{loc.name}</span>
                  <span className="text-xs text-slate-400">
                    {loc.admin1 ? `${loc.admin1}, ` : ''}
                    {loc.country}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Actions & Language Toggle */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition"
          >
            <Home className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>AI Chat</span>
          </Link>

          <Link
            href="/trip-planner"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition"
          >
            <Compass className="w-4 h-4 text-purple-400" />
            <span>Trip Planner</span>
          </Link>

          {/* Hindi / English Language Switcher */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition"
          >
            <Languages className="w-4 h-4" />
            <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
