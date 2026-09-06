import { Language } from '@/types/weather';

export const translations = {
  en: {
    appName: 'WeatherGPT',
    tagline: 'AI Climate & Weather Intelligence Platform',
    searchPlaceholder: 'Search city or district (e.g. Gwalior, Delhi, London)...',
    currentWeather: 'Current Weather',
    feelsLike: 'Feels like',
    humidity: 'Humidity',
    windSpeed: 'Wind Speed',
    pressure: 'Pressure',
    uvIndex: 'UV Index',
    aqi: 'Air Quality (AQI)',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    hourlyForecast: 'Hourly Forecast',
    dailyForecast: '7-Day Forecast',
    foodSuggestions: 'Food & Drinks Recommendations',
    clothingSuggestions: 'Clothing & Outfit Tips',
    farmerAdvisory: 'Agriculture & Farmer Advisory',
    severeAlerts: 'Weather Alerts',
    lastYearCompare: 'This Day Last Year',
    quickCities: 'Popular Indian Cities',
    tripPlanner: 'Trip Planner',
    aiAssistant: 'AI Weather Chat',
    listen: 'Listen',
    speaking: 'Speaking...',
    voiceInput: 'Voice Search',
    shareCard: 'Share Weather Card',
    disasterTips: 'Disaster Safety Tips',
    downloadCard: 'Export Card Image',
    copySummary: 'Copy Weather Summary',
  },
  hi: {
    appName: 'मौसमGPT',
    tagline: 'एआई जलवायु एवं मौसम बुद्धिमत्ता प्लेटफ़ॉर्म',
    searchPlaceholder: 'शहर या ज़िला खोजें (जैसे: ग्वालियर, दिल्ली, भोपाल)...',
    currentWeather: 'वर्तमान मौसम',
    feelsLike: 'अनुभूत तापमान',
    humidity: 'आर्द्रता',
    windSpeed: 'हवा की गति',
    pressure: 'वायुमंडलीय दबाव',
    uvIndex: 'यूवी इंडेक्स',
    aqi: 'वायु गुणवत्ता (AQI)',
    sunrise: 'सूर्योदय',
    sunset: 'सूर्यास्त',
    hourlyForecast: 'प्रति घंटा पूर्वानुमान',
    dailyForecast: '7-दिवसीय पूर्वानुमान',
    foodSuggestions: 'भोजन एवं पेय पदार्थ सुझाव',
    clothingSuggestions: 'वेशभूषा एवं कपड़े सुझाव',
    farmerAdvisory: 'कृषि एवं किसान सलाह',
    severeAlerts: 'मौसम चेतावनियाँ',
    lastYearCompare: 'पिछले साल आज ही के दिन',
    quickCities: 'प्रमुख भारतीय शहर',
    tripPlanner: 'यात्रा योजनाकार',
    aiAssistant: 'एआई मौसम चैट',
    listen: 'सुनें',
    speaking: 'बोल रहा है...',
    voiceInput: 'आवाज़ से खोजें',
    shareCard: 'मौसम कार्ड साझा करें',
    disasterTips: 'आपदा सुरक्षा युक्तियाँ',
    downloadCard: 'कार्ड डाउनलोड करें',
    copySummary: 'सारांश कॉपी करें',
  }
};

export function t(key: keyof typeof translations['en'], lang: Language): string {
  return translations[lang][key] || translations['en'][key] || key;
}

export function getWeatherConditionDescription(code: number, lang: Language = 'en'): string {
  const map: Record<number, { en: string; hi: string }> = {
    0: { en: 'Clear Sky', hi: 'साफ़ आसमान' },
    1: { en: 'Mainly Clear', hi: 'मुख्यतः साफ़' },
    2: { en: 'Partly Cloudy', hi: 'आंशिक रूप से बादल' },
    3: { en: 'Overcast', hi: 'घने बादल' },
    45: { en: 'Foggy', hi: 'कोहरा' },
    48: { en: 'Depositing Rime Fog', hi: 'सघन कोहरा' },
    51: { en: 'Light Drizzle', hi: 'हल्की बूंदाबांदी' },
    53: { en: 'Moderate Drizzle', hi: 'मध्यम बूंदाबांदी' },
    55: { en: 'Dense Drizzle', hi: 'तेज़ बूंदाबांदी' },
    61: { en: 'Slight Rain', hi: 'हल्की वर्षा' },
    63: { en: 'Moderate Rain', hi: 'मध्यम वर्षा' },
    65: { en: 'Heavy Rain', hi: 'मूसलाधार बारिश' },
    71: { en: 'Slight Snow', hi: 'हल्की बर्फबारी' },
    73: { en: 'Moderate Snow', hi: 'मध्यम बर्फबारी' },
    75: { en: 'Heavy Snow', hi: 'तेज़ बर्फबारी' },
    80: { en: 'Rain Showers', hi: 'वर्षा की बौछारें' },
    95: { en: 'Thunderstorm', hi: 'गर्जन के साथ तूफान' },
    96: { en: 'Thunderstorm with Hail', hi: 'ओलावृष्टि के साथ तूफान' },
  };

  const item = map[code] || { en: 'Variable Weather', hi: 'परिवर्तनशील मौसम' };
  return lang === 'hi' ? item.hi : item.en;
}
