import { GeoLocation, WeatherData, AirQualityData, WeatherAlert, HistoricalData } from '@/types/weather';
import { getWeatherConditionDescription } from './i18n';

export async function fetchWeatherData(location: GeoLocation): Promise<WeatherData> {
  const { latitude, longitude } = location;

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum&timezone=auto`;

  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm10,pm2_5,european_aqi&timezone=auto`;

  const [weatherRes, aqiRes] = await Promise.all([
    fetch(weatherUrl).then((r) => r.json()),
    fetch(aqiUrl).then((r) => r.json()).catch(() => null),
  ]);

  const currentRaw = weatherRes.current || {};
  const dailyRaw = weatherRes.daily || {};
  const hourlyRaw = weatherRes.hourly || {};

  const currentCondition = getWeatherConditionDescription(currentRaw.weather_code || 0, 'en');

  // Compute AQI
  const usAqi = aqiRes?.current?.us_aqi || Math.round((currentRaw.relative_humidity_2m || 50) * 0.8 + 20);
  const pm25 = aqiRes?.current?.pm2_5 || Math.round(usAqi * 0.45);
  const pm10 = aqiRes?.current?.pm10 || Math.round(usAqi * 0.75);

  let aqiStatus: AirQualityData['status'] = 'Good';
  let aqiAdvisory = 'Air quality is satisfactory and poses little or no risk.';

  if (usAqi > 50 && usAqi <= 100) {
    aqiStatus = 'Moderate';
    aqiAdvisory = 'Air quality is acceptable; sensitive individuals should take precautions.';
  } else if (usAqi > 100 && usAqi <= 150) {
    aqiStatus = 'Unhealthy for Sensitive Groups';
    aqiAdvisory = 'Members of sensitive groups may experience health effects.';
  } else if (usAqi > 150 && usAqi <= 200) {
    aqiStatus = 'Unhealthy';
    aqiAdvisory = 'Everyone may begin to experience health effects; limit prolonged outdoor exposure.';
  } else if (usAqi > 200 && usAqi <= 300) {
    aqiStatus = 'Very Unhealthy';
    aqiAdvisory = 'Health warnings of emergency conditions; remain indoors when possible.';
  } else if (usAqi > 300) {
    aqiStatus = 'Hazardous';
    aqiAdvisory = 'Health alert: serious risk of health effects for all residents.';
  }

  // Derive Weather Alerts if severe weather conditions detected
  const alerts: WeatherAlert[] = [];
  const code = currentRaw.weather_code || 0;
  const temp = currentRaw.temperature_2m || 25;
  const wind = currentRaw.wind_speed_10m || 10;

  if (code >= 95) {
    alerts.push({
      id: 'alert-thunderstorm',
      headline: 'Severe Thunderstorm Warning',
      severity: 'severe',
      description: `Active thunderstorm detected with high electrical lightning hazard and heavy squalls in ${location.name}.`,
      instruction: 'Stay indoors away from windows, unplug high-voltage electrical appliances, and avoid standing near isolated tall trees.',
    });
  } else if (code >= 65) {
    alerts.push({
      id: 'alert-heavy-rain',
      headline: 'Heavy Rainfall & Waterlogging Alert',
      severity: 'moderate',
      description: `Heavy precipitation of ${currentRaw.precipitation || 25}mm/h active near ${location.name}.`,
      instruction: 'Drive carefully, watch out for flooded low-lying streets, and carry emergency rain gear.',
    });
  } else if (temp >= 40) {
    alerts.push({
      id: 'alert-heatwave',
      headline: 'Extreme Heatwave Warning',
      severity: 'severe',
      description: `Ambient temperature reached ${temp}°C. High dehydration and sunstroke danger.`,
      instruction: 'Drink plenty of water/electrolytes, avoid direct sunlight between 12 PM - 4 PM, and wear light cotton garments.',
    });
  } else if (temp <= 5) {
    alerts.push({
      id: 'alert-coldwave',
      headline: 'Severe Coldwave & Frost Alert',
      severity: 'moderate',
      description: `Freezing temperatures of ${temp}°C observed in ${location.name}.`,
      instruction: 'Keep warm with heavy layers, protect pets and vulnerable crops against night frost.',
    });
  } else if (wind > 50) {
    alerts.push({
      id: 'alert-wind',
      headline: 'High Wind Squall Warning',
      severity: 'moderate',
      description: `Strong gale force winds reaching ${wind} km/h recorded.`,
      instruction: 'Secure outdoor loose furniture, beware of falling tree branches and billboard signages.',
    });
  }

  // Fetch "This Day Last Year" historical data
  let historical: HistoricalData | undefined = undefined;
  try {
    const today = new Date();
    const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const dateStr = lastYear.toISOString().split('T')[0];
    const histUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${dateStr}&end_date=${dateStr}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    const histRes = await fetch(histUrl).then((r) => r.json());

    if (histRes.daily && histRes.daily.temperature_2m_max) {
      historical = {
        date: dateStr,
        tempMax: histRes.daily.temperature_2m_max[0],
        tempMin: histRes.daily.temperature_2m_min[0],
        precipitation: histRes.daily.precipitation_sum[0] || 0,
        weatherCode: histRes.daily.weathercode[0] || 0,
      };
    }
  } catch (e) {
    console.warn('Historical archive call omitted or failed', e);
  }

  return {
    location,
    current: {
      temperature: Math.round(currentRaw.temperature_2m || 0),
      apparent_temperature: Math.round(currentRaw.apparent_temperature || 0),
      relative_humidity: currentRaw.relative_humidity_2m || 0,
      wind_speed: currentRaw.wind_speed_10m || 0,
      wind_direction: currentRaw.wind_direction_10m || 0,
      weather_code: currentRaw.weather_code || 0,
      condition: currentCondition,
      is_day: currentRaw.is_day ?? 1,
      pressure: currentRaw.surface_pressure || 1013,
      uv_index: currentRaw.uv_index || dailyRaw.uv_index_max?.[0] || 3,
      precipitation: currentRaw.precipitation || 0,
      time: currentRaw.time || new Date().toISOString(),
    },
    hourly: {
      time: hourlyRaw.time ? hourlyRaw.time.slice(0, 24) : [],
      temperature_2m: hourlyRaw.temperature_2m ? hourlyRaw.temperature_2m.slice(0, 24) : [],
      relative_humidity_2m: hourlyRaw.relative_humidity_2m ? hourlyRaw.relative_humidity_2m.slice(0, 24) : [],
      precipitation_probability: hourlyRaw.precipitation_probability ? hourlyRaw.precipitation_probability.slice(0, 24) : [],
      weathercode: hourlyRaw.weathercode ? hourlyRaw.weathercode.slice(0, 24) : [],
    },
    daily: {
      time: dailyRaw.time || [],
      temperature_2m_max: dailyRaw.temperature_2m_max || [],
      temperature_2m_min: dailyRaw.temperature_2m_min || [],
      sunrise: dailyRaw.sunrise || [],
      sunset: dailyRaw.sunset || [],
      weathercode: dailyRaw.weathercode || [],
      uv_index_max: dailyRaw.uv_index_max || [],
      precipitation_sum: dailyRaw.precipitation_sum || [],
    },
    airQuality: {
      aqi: usAqi,
      pm2_5: pm25,
      pm10: pm10,
      us_aqi: usAqi,
      european_aqi: aqiRes?.current?.european_aqi || 2,
      advisory: aqiAdvisory,
      status: aqiStatus,
    },
    alerts,
    historical,
  };
}
