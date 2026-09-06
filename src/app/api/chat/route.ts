import { NextRequest, NextResponse } from 'next/server';
import { geocodeCity } from '@/lib/geocoding';
import { fetchWeatherData } from '@/lib/openmeteo';

export async function POST(req: NextRequest) {
  try {
    const { message, lang = 'en' } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Common Indian cities & world capitals regex for fast query intent extraction
    const citiesFound: string[] = [];

    // Simple rule-based & Regex parser fallback to extract cities from user query
    // e.g., "weather in Delhi", "compare Gwalior and Bhopal", "is it raining in Mumbai"
    const words = message.replace(/[?,!.]/g, '').split(/\s+/);
    
    // Check known words or run geocoder search on potential city names
    const queryLower = message.toLowerCase();
    
    // Quick regex checks for common keywords
    const cityCandidates = words.filter(
      (w) =>
        w.length > 2 &&
        !['weather', 'what', 'how', 'is', 'the', 'in', 'at', 'today', 'tomorrow', 'forecast', 'rain', 'temperature', 'compare', 'and', 'between', 'for', 'like'].includes(w.toLowerCase())
    );

    // Dynamic Geocoding execution for each candidate city (NO HARDCODING)
    for (const cand of cityCandidates.slice(0, 3)) {
      const geoResults = await geocodeCity(cand);
      if (geoResults.length > 0 && !citiesFound.includes(geoResults[0].name)) {
        citiesFound.push(geoResults[0].name);
      }
    }

    // Default fallback if no city identified in text: Gwalior
    if (citiesFound.length === 0) {
      citiesFound.push('Gwalior');
    }

    // Fetch real weather data for ALL identified cities from Open-Meteo
    const weatherResults = await Promise.all(
      citiesFound.map(async (cityName) => {
        const geos = await geocodeCity(cityName);
        const targetGeo = geos[0] || {
          id: 1270584,
          name: 'Gwalior',
          latitude: 26.2235,
          longitude: 78.1792,
          country: 'India',
          country_code: 'IN',
        };
        return await fetchWeatherData(targetGeo);
      })
    );

    // Call Groq API (if GROQ_API_KEY is configured) or construct structured natural language reply
    const groqKey = process.env.GROQ_API_KEY;
    let replyText = '';

    if (groqKey) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'system',
                content: `You are WeatherGPT AI. Formulate a helpful weather answer using ONLY the factual numbers provided in the JSON context. Never invent temperatures or weather facts. Reply in ${lang === 'hi' ? 'Hindi' : 'English'}.`,
              },
              {
                role: 'user',
                content: `User query: "${message}". Weather Data context: ${JSON.stringify(
                  weatherResults.map((w) => ({
                    city: w.location.name,
                    temp: w.current.temperature,
                    feelsLike: w.current.apparent_temperature,
                    condition: w.current.condition,
                    humidity: w.current.relative_humidity,
                    wind: w.current.wind_speed,
                    aqi: w.airQuality.aqi,
                  }))
                )}`,
              },
            ],
            temperature: 0.3,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          replyText = groqData.choices?.[0]?.message?.content || '';
        }
      } catch (e) {
        console.warn('Groq API call failed, using rule-based synthesis fallback', e);
      }
    }

    // High quality synthesis fallback if Groq API key is not provided or fails
    if (!replyText) {
      if (weatherResults.length > 1) {
        // Multi-city comparison
        const c1 = weatherResults[0];
        const c2 = weatherResults[1];
        if (lang === 'hi') {
          replyText = `तुलना: ${c1.location.name} में वर्तमान तापमान ${c1.current.temperature}°C (${c1.current.condition}) है और AQI ${c1.airQuality.aqi} है। जबकि ${c2.location.name} में तापमान ${c2.current.temperature}°C (${c2.current.condition}) और AQI ${c2.airQuality.aqi} है। ${
            c1.current.temperature > c2.current.temperature
              ? `${c1.location.name}, ${c2.location.name} से ${c1.current.temperature - c2.current.temperature}°C अधिक गर्म है।`
              : `${c2.location.name}, ${c1.location.name} से ${c2.current.temperature - c1.current.temperature}°C अधिक गर्म है।`
          }`;
        } else {
          replyText = `Comparison: In ${c1.location.name}, current temperature is ${c1.current.temperature}°C (${c1.current.condition}) with AQI ${c1.airQuality.aqi}. In comparison, ${c2.location.name} is ${c2.current.temperature}°C (${c2.current.condition}) with AQI ${c2.airQuality.aqi}. ${
            c1.current.temperature > c2.current.temperature
              ? `${c1.location.name} is ${c1.current.temperature - c2.current.temperature}°C warmer than ${c2.location.name}.`
              : `${c2.location.name} is ${c2.current.temperature - c1.current.temperature}°C warmer than ${c1.location.name}.`
          }`;
        }
      } else {
        const w = weatherResults[0];
        if (lang === 'hi') {
          replyText = `${w.location.name} में वर्तमान तापमान ${w.current.temperature}°C है (अनुभूत ${w.current.apparent_temperature}°C)। मौसम ${w.current.condition} है। हवा की गति ${w.current.wind_speed} किमी/घंटा, आर्द्रता ${w.current.relative_humidity}% और वायु गुणवत्ता सूचकांक (AQI) ${w.airQuality.aqi} (${w.airQuality.status}) है।`;
        } else {
          replyText = `In ${w.location.name}, the current temperature is ${w.current.temperature}°C (feels like ${w.current.apparent_temperature}°C) with ${w.current.condition}. Wind speed is ${w.current.wind_speed} km/h, humidity is ${w.current.relative_humidity}%, and Air Quality Index (AQI) is ${w.airQuality.aqi} (${w.airQuality.status}).`;
        }
      }
    }

    return NextResponse.json({
      reply: replyText,
      cities: citiesFound,
      weatherData: weatherResults,
    });
  } catch (error: any) {
    console.error('Chat API Route error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
