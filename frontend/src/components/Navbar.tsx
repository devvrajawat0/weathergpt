import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Sun, Moon, Volume2, VolumeX, Bot, LayoutDashboard, Globe, AlertTriangle, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { LocationItem } from '../types';
import { searchLocations } from '../services/api';

interface NavbarProps {
  activeView: 'dashboard' | 'chat' | 'explorer' | 'alerts';
  setActiveView: (view: 'dashboard' | 'chat' | 'explorer' | 'alerts') => void;
  onSelectLocation: (location: LocationItem) => void;
  onUseGeolocation: () => void;
  alertsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  onSelectLocation,
  onUseGeolocation,
  alertsCount = 0
}) => {
  const { isDark, toggleTheme, speechEnabled, toggleSpeech } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchLocations(searchQuery);
          setSearchResults(results);
          setIsOpen(true);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setIsOpen(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (loc: LocationItem) => {
    onSelectLocation(loc);
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-700/40 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand & Logo */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <button 
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-2.5 group focus:outline-none"
            aria-label="Go to WeatherGPT Home Dashboard"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              🌤️
            </div>
            <div className="text-left">
              <span className="text-xl font-extrabold bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                WeatherGPT
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-cyan-400/80 block uppercase -mt-1">
                SIH26068 AI Engine
              </span>
            </div>
          </button>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-400 transition"
              title="Toggle Light/Dark Theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-indigo-400" />}
            </button>
          </div>
        </div>

        {/* Global Instant Search Bar */}
        <div ref={searchRef} className="relative w-full md:max-w-md">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indian District (e.g. Delhi, Wayanad) or World Capital..."
              className="w-full bg-slate-900/90 text-slate-100 text-sm placeholder-slate-400 rounded-full pl-10 pr-10 py-2 border border-slate-700/60 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all"
            />
            <button
              onClick={onUseGeolocation}
              className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
              title="Use current geolocation"
            >
              <MapPin className="w-4 h-4" />
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto backdrop-blur-xl">
              <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                Matching Locations ({searchResults.length})
              </div>
              {searchResults.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => handleSelect(loc)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-800/80 flex items-center justify-between border-b border-slate-800/50 last:border-0 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">
                      {loc.type === 'district' ? '🇮🇳' : '🌐'}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{loc.name}</div>
                      <div className="text-xs text-slate-400">
                        {loc.state ? `District in ${loc.state}` : `Capital of ${loc.country}`}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                    {loc.type === 'district' ? 'District' : 'Capital'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Tabs & Controls */}
        <div className="flex items-center gap-1.5 w-full md:w-auto justify-center">
          <nav className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeView === 'dashboard'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveView('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeView === 'chat'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Chat AI</span>
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            </button>

            <button
              onClick={() => setActiveView('explorer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeView === 'explorer'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Explorer</span>
            </button>

            <button
              onClick={() => setActiveView('alerts')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeView === 'alerts'
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>IMD Alerts</span>
              {alertsCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-bold rounded-full animate-bounce">
                  {alertsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Desktop Toggles */}
          <div className="hidden md:flex items-center gap-1.5 ml-2 border-l border-slate-800 pl-2">
            <button
              onClick={toggleSpeech}
              className={`p-2 rounded-lg border transition ${
                speechEnabled
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title={speechEnabled ? "Voice Output (TTS) Enabled" : "Voice Output Disabled"}
            >
              {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-amber-400 hover:bg-slate-700 transition"
              title="Toggle Light/Dark Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
