import Anthropic from '@anthropic-ai/sdk';
import { getWeatherData } from './weatherService.js';
import { INDIAN_DISTRICTS } from '../data/districts.js';
import { WORLD_CAPITALS } from '../data/capitals.js';

let anthropicClient = null;
if (process.env.ANTHROPIC_API_KEY) {
  try {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  } catch (e) {
    console.warn("Failed to initialize Anthropic client:", e.message);
  }
}

const ALIASES = {
  'dilli': 'new delhi',
  'delhi': 'new delhi',
  'banglore': 'bengaluru',
  'bangalore': 'bengaluru',
  'bombay': 'mumbai',
  'calcutta': 'kolkata',
  'madras': 'chennai',
  'gurgaon': 'gurugram',
  'trivandrum': 'thiruvananthapuram',
  'pondicherry': 'puducherry',
  'cochin': 'kochi',
  'baroda': 'vadodara',
  'banaras': 'varanasi',
  'kashi': 'varanasi'
};

/**
 * Helper to match location names in query string
 */
function findLocationsInText(text) {
  const queryLower = text.toLowerCase();
  const matched = [];

  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const checkPhraseInQuery = (phrase) => {
    if (!phrase || phrase.length < 3) return false;
    const pattern = new RegExp(`\\b${escapeRegExp(phrase.toLowerCase())}\\b`, 'i');
    if (pattern.test(queryLower)) return true;
    
    for (const [alias, canonical] of Object.entries(ALIASES)) {
      if (phrase.toLowerCase().includes(canonical) && new RegExp(`\\b${escapeRegExp(alias)}\\b`, 'i').test(queryLower)) {
        return true;
      }
    }
    return false;
  };

  const getVariations = (rawName) => {
    const variations = [rawName];
    const cleanMain = rawName.split('(')[0].trim();
    variations.push(cleanMain);

    if (rawName.includes('(')) {
      const insideParen = rawName.split('(')[1].replace(')', '').trim();
      variations.push(insideParen);
      insideParen.split('&').forEach(part => variations.push(part.trim()));
      insideParen.split(' ').forEach(part => variations.push(part.trim()));
    }

    const prefixes = ['new', 'old', 'north', 'south', 'east', 'west', 'central'];
    const parts = cleanMain.split(' ');
    if (parts.length > 1 && prefixes.includes(parts[0].toLowerCase())) {
      variations.push(parts.slice(1).join(' '));
    }

    return variations.filter(v => v && v.length >= 3);
  };

  // 1. Check Indian districts & cities
  for (const d of INDIAN_DISTRICTS) {
    const variations = getVariations(d.name);
    if (variations.some(v => checkPhraseInQuery(v))) {
      if (!matched.some(m => m.id === d.id)) {
        matched.push(d);
      }
    }
  }

  // 2. Check World Capitals
  for (const c of WORLD_CAPITALS) {
    const variations = getVariations(c.name);
    if (variations.some(v => checkPhraseInQuery(v))) {
      if (!matched.some(m => m.id === c.id)) {
        matched.push(c);
      }
    }
  }

  // 3. Check State names if no direct district matched
  if (matched.length === 0) {
    for (const d of INDIAN_DISTRICTS) {
      if (d.state && checkPhraseInQuery(d.state)) {
        if (!matched.some(m => m.id === d.id)) {
          matched.push(d);
          break;
        }
      }
    }
  }

  return matched;
}

const STOP_WORDS = new Set([
  'weather', 'forecast', 'today', 'tomorrow', 'tell', 'me', 'about', 'how', 'is',
  'what', 'will', 'it', 'rain', 'raining', 'rains', 'snow', 'snowing', 'sunny',
  'cloudy', 'hot', 'cold', 'warm', 'windy', 'humid', 'a', 'an', 'the', 'for', 'of',
  'in', 'at', 'to', 'near', 'around', 'climate', 'temperature', 'temp', 'condition',
  'conditions', 'compare', 'vs', 'and', 'please', 'give', 'info', 'information',
  'report', 'now', 'current', 'right', 'should', 'i', 'wear', 'cloth', 'clothes',
  'clothing', 'outfit', 'umbrella', 'farmer', 'agri', 'crop', 'irrigation',
  'farming', 'advice', 'advisory', 'city', 'district', 'town', 'place'
]);

function extractLocationCandidates(text) {
  const candidates = [];
  const lower = text.toLowerCase();

  const compareMatch = lower.match(/(?:compare|between)?\s*([a-z\s]+?)\s*(?:\bvs\b|\bv\/s\b|\band\b|\bwith\b|\bor\b|,)\s*([a-z\s]+)/i);
  if (compareMatch) {
    const c1 = compareMatch[1].replace(/^(?:compare|between|weather|forecast|in|for|at|about)\s+/i, '').split(/\s+/).filter(w => !STOP_WORDS.has(w)).join(' ');
    const c2 = compareMatch[2].replace(/(?:weather|forecast|today|tomorrow|now)$/i, '').split(/\s+/).filter(w => !STOP_WORDS.has(w)).join(' ');
    if (c1.length >= 2) candidates.push(c1);
    if (c2.length >= 2) candidates.push(c2);
  }

  const prepMatches = lower.match(/(?:in|at|for|near|around|of|about)\s+([a-z\s]+?)(?:\s+(?:today|tomorrow|now|yesterday|forecast|weather|rain|temperature|this|next)|$)/gi);
  if (prepMatches) {
    for (const match of prepMatches) {
      const clean = match.replace(/^(in|at|for|near|around|of|about)\s+/i, '').trim();
      const filtered = clean.split(/\s+/).filter(w => !STOP_WORDS.has(w)).join(' ');
      if (filtered.length >= 2) candidates.push(filtered);
    }
  }

  if (candidates.length === 0) {
    const words = text.replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/).filter(w => w.length >= 2 && !STOP_WORDS.has(w.toLowerCase()));
    if (words.length > 0) {
      candidates.push(words.join(' '));
      if (words.length > 1) {
        words.forEach(w => candidates.push(w));
      }
    }
  }

  return Array.from(new Set(candidates));
}

async function geocodeLocationOnline(name) {
  if (!name || name.length < 2) return null;
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const r = data.results[0];
      return {
        id: `geo-${r.id}`,
        name: r.name,
        state: r.admin1 || r.country || '',
        country: r.country || 'Global',
        lat: r.latitude,
        lon: r.longitude,
        type: 'custom'
      };
    }
  } catch (err) {}
  return null;
}

export async function resolveTargetLocations(lastUserMsg, currentLocation = null) {
  const candidates = extractLocationCandidates(lastUserMsg);
  let targetLocations = [];

  if (candidates.length >= 2) {
    for (const cand of candidates) {
      const locs = findLocationsInText(cand);
      if (locs.length > 0) {
        if (!targetLocations.some(t => t.id === locs[0].id)) {
          targetLocations.push(locs[0]);
        }
      } else {
        const geo = await geocodeLocationOnline(cand);
        if (geo) targetLocations.push(geo);
      }
    }
  }

  if (targetLocations.length === 0) {
    targetLocations = findLocationsInText(lastUserMsg);
  }

  if (targetLocations.length === 0 && candidates.length > 0) {
    for (const candidate of candidates.slice(0, 3)) {
      const geoLoc = await geocodeLocationOnline(candidate);
      if (geoLoc && !targetLocations.some(t => Math.hypot(t.lat - geoLoc.lat, t.lon - geoLoc.lon) < 0.1)) {
        targetLocations.push(geoLoc);
      }
    }
  }

  const uniqueLocations = [];
  for (const loc of targetLocations) {
    if (!uniqueLocations.some(u => u.name === loc.name || Math.hypot(u.lat - loc.lat, u.lon - loc.lon) < 0.2)) {
      uniqueLocations.push(loc);
    }
  }

  // STEP 1 RULE: If NO location is found in the message, do not guess or default — return [] so caller asks "Which city would you like weather for?"
  return uniqueLocations;
}

/**
 * Main AI Chat Processor
 */
export async function processChatQuery(messages, currentLocation = null) {
  const lastUserMsg = messages[messages.length - 1]?.content || "";

  // 1. Identify locations mentioned in query (with online geocoding fallback)
  let targetLocations = await resolveTargetLocations(lastUserMsg, currentLocation);

  if (targetLocations.length === 0) {
    return {
      reply: "Which city would you like weather for?",
      locations: [],
      weatherData: []
    };
  }

  // 2. Fetch live weather context for up to 2 target locations
  const weatherContexts = [];
  for (const loc of targetLocations.slice(0, 2)) {
    try {
      const data = await getWeatherData(loc.lat, loc.lon);
      weatherContexts.push({
        location: loc.name + (loc.state ? `, ${loc.state}` : loc.country ? `, ${loc.country}` : ''),
        locObj: loc,
        weather: data
      });
    } catch (err) {
      console.warn(`Could not fetch weather context for ${loc.name}:`, err.message);
    }
  }

  if (weatherContexts.length === 0) {
    return {
      reply: "Which city would you like weather for?",
      locations: [],
      weatherData: []
    };
  }

  // 3. If Anthropic client exists, call Claude API with live context
  if (anthropicClient && process.env.ANTHROPIC_API_KEY) {
    try {
      const systemPrompt = `You are WeatherGPT, a natural-language weather assistant for Indian districts and world capitals.

STEP 1 — LOCATION EXTRACTION (always do this first, before anything else):
- Scan the user's message and extract every location name mentioned — Indian districts/cities (e.g. Bhopal, Manali, Wayanad, Jaipur, Agra, Gwalior) or World Capitals (e.g. Tokyo, Paris, London, Washington).
- Standardize alternative spellings to canonical names (e.g. "Dilli" → Delhi, "Banglore" → Bengaluru, "Bombay" → Mumbai, "Calcutta" → Kolkata).
- If multiple locations are extracted (e.g. "Delhi and Tokyo", "compare Bhopal vs Jaipur"), keep ALL of them in order.
- If no city is found in the message: Do NOT guess or default. Return asking: "Which city would you like weather for?"

STEP 2 — INTENT CLASSIFICATION:
Classify user query into:
- COMPARISON (2+ cities requested)
- FORECAST (multi-day outlook, rain probability, upcoming weather)
- CLOTHING / OUTDOOR ADVICE (what to wear, umbrella needed, activity safety)
- FARMING / AGRI ADVICE (irrigation, spraying, harvest warnings)
- GENERAL_OVERVIEW (standard current weather query)

STEP 3 — DATA FETCHING & SYNTHESIS:
Use fetched Open-Meteo weather JSON. Extract:
- Temperature (°C), Feels-like (°C)
- Condition (Sunny, Rain, Thunderstorm, Fog, Clear)
- Humidity (%), Wind Speed (km/h)
- AQI (US AQI value + Severity label)
- Daily High/Low and Rain Probability (%) for forecast queries

STEP 4 — RESPONSE FORMATTING:
- Single city: Return clean structured markdown with Current Conditions, Key Metrics, and Advice.
- Multi-city: Return markdown table comparing Temperature, Condition, Humidity, Wind Speed, AQI, and Precipitation side by side, followed by a recommendation.
- Forecast: Return 3 to 7 day breakdown table with High/Low temperatures and Rain Probability %.

STEP 5 — GUARDRAILS & SCHEMAS:
- Strict output format in JSON wrapper when requested, or clear readable markdown.
- Never hardcode or fallback to Bhopal or any city unless explicitly named in user input.

Real live weather data fetched for the user's query:
${JSON.stringify(weatherContexts, null, 2)}`;

      const formattedMessages = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      const response = await anthropicClient.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        system: systemPrompt,
        messages: formattedMessages
      });

      const replyText = response.content[0]?.text || "Which city would you like weather for?";
      return {
        reply: replyText,
        locations: weatherContexts.map(w => w.locObj),
        weatherData: weatherContexts.map(w => ({ name: w.location, current: w.weather.current, aqi: w.weather.aqi }))
      };
    } catch (error) {
      console.error("Anthropic API call failed, using intelligent fallback engine:", error.message);
    }
  }

  // 4. Intelligent Fallback Weather Response Generator (No API Key Required)
  const queryLower = lastUserMsg.toLowerCase();
  let reply = "";

  if (weatherContexts.length === 0) {
    reply = "I couldn't fetch live weather data for the specified location right now. Please try searching for a specific district in India (e.g. Bhopal, Jaipur, Wayanad) or a world capital (e.g. Tokyo, Paris).";
    return { reply, locations: [], weatherData: [] };
  }

  const primary = weatherContexts[0];
  const pLoc = primary.location;
  const pCurr = primary.weather.current;
  const pAqi = primary.weather.aqi;
  const pDaily = primary.weather.daily;

  // Scenario A: Comparison between 2 locations
  if (weatherContexts.length >= 2) {
    const sec = weatherContexts[1];
    const sLoc = sec.location;
    const sCurr = sec.weather.current;

    const tempDiff = (pCurr.temp - sCurr.temp).toFixed(1);
    const warmerLoc = pCurr.temp > sCurr.temp ? pLoc : sLoc;

    reply = `### 🌤️ Weather Comparison: **${pLoc}** vs **${sLoc}**

Here is the real-time weather comparison between **${pLoc}** and **${sLoc}**:

| Weather Parameter | ${pLoc} | ${sLoc} |
| :--- | :--- | :--- |
| **Current Temperature** | **${pCurr.temp}°C** (Feels like ${pCurr.feelsLike}°C) | **${sCurr.temp}°C** (Feels like ${sCurr.feelsLike}°C) |
| **Condition** | ${pCurr.condition} | ${sCurr.condition} |
| **Humidity** | ${pCurr.humidity}% | ${sCurr.humidity}% |
| **Wind Speed** | ${pCurr.windSpeed} km/h | ${sCurr.windSpeed} km/h |
| **Air Quality (AQI)** | ${pAqi.usAqi} (${pAqi.label}) | ${sec.weather.aqi.usAqi} (${sec.weather.aqi.label}) |
| **Precipitation** | ${pCurr.precipitation} mm | ${sCurr.precipitation} mm |

#### 📊 Key Insights & Recommendation:
- **Temperature Difference**: **${warmerLoc}** is currently warmer by **${Math.abs(tempDiff)}°C**.
- **Comfort & Travel**: ${pCurr.temp > 32 ? `Stay hydrated in ${pLoc} as temperatures are warm.` : `Enjoy pleasant weather conditions in ${pLoc}.`}
- **Air Quality**: ${pAqi.usAqi > 150 ? `⚠️ Outdoor mask advised in ${pLoc} due to elevated AQI (${pAqi.usAqi}).` : `Air quality is fair.`}`;
  } 
  // Scenario B: Rain / Rain forecast query
  else if (queryLower.includes('rain') || queryLower.includes('precipitation') || queryLower.includes('umbrella')) {
    const rainToday = pDaily[0]?.precipProbability || 0;
    const rainTomorrow = pDaily[1]?.precipProbability || 0;

    reply = `### 🌧️ Rain Forecast for **${pLoc}**

- **Current Condition**: ${pCurr.condition} with **${pCurr.precipitation} mm** recorded precipitation.
- **Today's Rain Chance**: **${rainToday}%** chance of rainfall (Max Temp: ${pDaily[0]?.maxTemp}°C).
- **Tomorrow's Rain Chance**: **${rainTomorrow}%** chance of rain (Max Temp: ${pDaily[1]?.maxTemp}°C).

#### 🎒 Travel & Clothing Advice:
${rainToday > 40 || rainTomorrow > 40 
  ? `- ☔ **Umbrella Recommended**: High chance of rain. Carry rain gear and drive carefully on wet roads.`
  : `- ☀️ **Low Rain Risk**: Rain is unlikely today. Good conditions for outdoor travel.`}
${pAqi.usAqi > 100 ? `- 😷 **Air Quality**: AQI is ${pAqi.usAqi} (${pAqi.label}). Sensitive groups should limit prolonged outdoor exertion.` : ''}`;
  }
  // Scenario C: Agriculture / Farmer advice query
  else if (queryLower.includes('farmer') || queryLower.includes('agri') || queryLower.includes('crop') || queryLower.includes('irrigation')) {
    reply = `### 🌾 Agricultural Weather Advisory for **${pLoc}**

- **Current Temp**: ${pCurr.temp}°C (Feels like ${pCurr.feelsLike}°C)
- **Relative Humidity**: ${pCurr.humidity}%
- **Wind Speed**: ${pCurr.windSpeed} km/h
- **7-Day Rain Summary**: ${pDaily.slice(0, 5).reduce((acc, d) => acc + (d.precipitationSum || 0), 0).toFixed(1)} mm accumulated rain expected.

#### 🚜 Farming & Field Management Guidance:
1. **Irrigation Schedule**: ${pDaily[0]?.precipProbability > 50 ? "Postpone artificial irrigation as moderate to heavy rainfall is expected today." : "Soil moisture is normal. Regular irrigation can proceed early morning or late evening."}
2. **Pesticide Spraying**: ${pCurr.windSpeed > 20 ? "⚠️ Avoid spraying pesticides/fertilizers today due to high wind speeds (" + pCurr.windSpeed + " km/h) causing spray drift." : "Wind conditions are suitable for pesticide and fertilizer application."}
3. **Harvesting & Storage**: ${pDaily[1]?.precipProbability > 60 ? "Protect harvested crops in dry storage to prevent moisture damage from upcoming rain." : "Weather is suitable for field preparation and crop harvesting."}`;
  }
  // Scenario D: General / Tomorrow / Current Weather Summary
  else {
    const today = pDaily[0] || {};
    const tomorrow = pDaily[1] || {};

    const foodAdvice = pCurr.temp >= 28 
      ? "🥤 **Coolers**: Chilled Mango Lassi, Nimbu Pani, Kulfi, Watermelon Juice"
      : (today.precipProbability || 0) > 40
      ? "☕ **Rainy Comfort**: Crispy Samosas, Onion Pakodas, Masala Chai, Bhutta (Roasted Corn)"
      : "🍲 **Comfort Meals**: Hot Ginger Tea, Samosas, Gajar ka Halwa, Hot Soup";

    reply = `### 🌤️ Weather Overview for **${pLoc}**

Currently in **${pLoc}**, it is **${pCurr.temp}°C** with **${pCurr.condition}**.

#### 📊 Quick Weather Breakdown:
- **Temperature**: Current **${pCurr.temp}°C** | High: **${today.maxTemp}°C** | Low: **${today.minTemp}°C** (Feels like ${pCurr.feelsLike}°C)
- **Air Quality (AQI)**: **${pAqi.usAqi}** (${pAqi.label}) ${pAqi.usAqi > 150 ? '⚠️ Unhealthy' : '✅ Safe'}
- **Wind & Pressure**: ${pCurr.windSpeed} km/h | Pressure: ${pCurr.pressure} hPa
- **Tomorrow's Forecast**: ${tomorrow.condition} with High of **${tomorrow.maxTemp}°C**, Low of **${tomorrow.minTemp}°C** (${tomorrow.precipProbability}% rain probability).

#### 💡 Smart Tips:
- **Clothing**: ${pCurr.temp > 30 ? "Lightweight, breathable cotton clothes are ideal." : pCurr.temp < 18 ? "Warm jacket or sweater recommended." : "Comfortable casual clothing."}
- **Outdoors**: ${pCurr.uvIndex >= 6 ? "☀️ High UV Index (" + pCurr.uvIndex + "). Wear sunscreen and sunglasses." : "UV Index is moderate."}

#### 🍲 Weather-Based Food & Drink Suggestions:
- ${foodAdvice}`;
  }

  return {
    reply,
    locations: weatherContexts.map(w => w.locObj),
    weatherData: weatherContexts.map(w => ({ name: w.location, current: w.weather.current, aqi: w.weather.aqi }))
  };
}
