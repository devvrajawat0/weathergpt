export interface GeoLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string; // State / Province
  admin2?: string; // District
}

export interface CurrentWeather {
  temperature: number;
  apparent_temperature: number;
  relative_humidity: number;
  wind_speed: number;
  wind_direction: number;
  weather_code: number;
  condition: string;
  is_day: number;
  pressure: number;
  uv_index: number;
  precipitation: number;
  time: string;
}

export interface HourlyForecast {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  precipitation_probability: number[];
  weathercode: number[];
}

export interface DailyForecast {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
  weathercode: number[];
  uv_index_max: number[];
  precipitation_sum: number[];
}

export interface AirQualityData {
  aqi: number;
  pm2_5: number;
  pm10: number;
  us_aqi: number;
  european_aqi: number;
  advisory: string;
  status: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
}

export interface WeatherData {
  location: GeoLocation;
  current: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast;
  airQuality: AirQualityData;
  alerts: WeatherAlert[];
  historical?: HistoricalData;
}

export interface WeatherAlert {
  id: string;
  headline: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  description: string;
  instruction: string;
}

export interface HistoricalData {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  weatherCode: number;
}

export interface FoodClothingSuggestion {
  food: string[];
  drinks: string[];
  clothing: string[];
  accessories: string[];
  reason: string;
}

export interface FarmerAdvisory {
  irrigation: string;
  cropCare: string;
  pestRisk: string;
  alertNote?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  weatherData?: WeatherData[];
  cities?: string[];
}

export interface TripItineraryDay {
  date: string;
  city: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  rainProbability: number;
  packingTips: string[];
  travelAdvisory: string;
}

export type Language = 'en' | 'hi';
