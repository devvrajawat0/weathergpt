import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { LocationItem, ForecastResponse } from './types';
import { fetchForecast } from './services/api';

import { Navbar } from './components/Navbar';
import { DynamicBackground } from './components/DynamicBackground';
import { Footer } from './components/Footer';

import { DashboardView } from './views/DashboardView';
import { ChatView } from './views/ChatView';
import { ExplorerView } from './views/ExplorerView';
import { AlertsView } from './views/AlertsView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // 15 minutes cache
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

// Default Location: New Delhi, National Capital Territory
const DEFAULT_LOCATION: LocationItem = {
  id: 'in-dl-1',
  name: 'New Delhi',
  state: 'Delhi',
  lat: 28.6139,
  lon: 77.2090,
  type: 'district'
};

const WeatherGPTApp: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'chat' | 'explorer' | 'alerts'>('dashboard');
  const [selectedLocation, setSelectedLocation] = useState<LocationItem>(DEFAULT_LOCATION);
  const [chatPrompt, setChatPrompt] = useState<string | undefined>(undefined);

  // Fetch forecast data using React Query
  const { data, isLoading, error } = useQuery<ForecastResponse>({
    queryKey: ['forecast', selectedLocation.lat, selectedLocation.lon, selectedLocation.id],
    queryFn: () => fetchForecast(selectedLocation.lat, selectedLocation.lon, selectedLocation.id),
  });

  const handleSelectLocation = (loc: LocationItem) => {
    setSelectedLocation(loc);
    setActiveView('dashboard');
  };

  const handleUseGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const customLoc: LocationItem = {
          id: `custom-${Date.now()}`,
          name: 'Your Location',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          type: 'custom'
        };
        setSelectedLocation(customLoc);
        setActiveView('dashboard');
      },
      (err) => {
        alert("Unable to retrieve your location. Please check browser permissions.");
      }
    );
  };

  const handleOpenChatWithPrompt = (prompt: string) => {
    setChatPrompt(prompt);
    setActiveView('chat');
  };

  const currentWeatherCategory = data?.weather?.current?.category || 'sunny';
  const isDay = data?.weather?.current?.isDay ?? true;
  const alertsCount = data?.alerts?.filter(a => a.severity !== 'green').length || 0;

  return (
    <div className="min-h-screen flex flex-col justify-between relative selection:bg-cyan-500 selection:text-white">
      {/* Weather Adaptive Animated Background */}
      <DynamicBackground category={currentWeatherCategory} isDay={isDay} />

      <div>
        {/* Navbar Header */}
        <Navbar
          activeView={activeView}
          setActiveView={setActiveView}
          onSelectLocation={handleSelectLocation}
          onUseGeolocation={handleUseGeolocation}
          alertsCount={alertsCount}
        />

        {/* View Switcher Container */}
        <main className="p-4 sm:p-6 lg:p-8">
          {activeView === 'dashboard' && (
            <DashboardView
              data={data || null}
              isLoading={isLoading}
              error={error as Error}
              onOpenChatWithPrompt={handleOpenChatWithPrompt}
            />
          )}

          {activeView === 'chat' && (
            <ChatView
              currentLocation={selectedLocation}
              initialPrompt={chatPrompt}
              onSelectLocation={(loc) => {
                handleSelectLocation(loc);
                setActiveView('dashboard');
              }}
            />
          )}

          {activeView === 'explorer' && (
            <ExplorerView
              onSelectLocation={handleSelectLocation}
            />
          )}

          {activeView === 'alerts' && (
            <AlertsView
              onOpenChatWithPrompt={handleOpenChatWithPrompt}
            />
          )}
        </main>
      </div>

      {/* Shared Footer */}
      <Footer />
    </div>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WeatherGPTApp />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
