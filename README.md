# 🌤️ WeatherGPT - AI Climate & Weather Intelligence Platform (SIH Project)

**WeatherGPT** is a production-grade, AI-powered weather dashboard and climate advisory web application built for the **Smart India Hackathon (SIH)**. It provides real-time satellite weather tracking, dynamic canvas visual particle physics, air quality & UV indices, weather-tailored Indian food & clothing suggestions, agricultural farmer advisories, a multi-city trip planner, text-to-speech audio synthesis, and severe weather disaster safety alerts.

---

## 🌟 Key Features

1. **Dynamic Geocoding (No Hardcoding)**: Uses Open-Meteo Geocoding API (`https://geocoding-api.open-meteo.com/v1/search`) dynamically for every city/district search and chat query across all 28 Indian States & 8 Union Territories as well as global locations.
2. **Interactive 60 FPS Particle Canvas**: Custom HTML5 Canvas rendering dynamic weather visual effects (Rain streak splatters, Lightning flashes, Drifting snow, Volumetric fog, Sun ray flares, Clear night starfields) synced with live WMO weather codes.
3. **AI Chat Assistant (WeatherGPT)**: Natural language weather Q&A powered by Groq (Llama 3.1) and fallback synthesis. Supports multi-city comparisons (e.g., *"Compare weather between Gwalior, Leh and Mumbai"*).
4. **Food & Clothing Recommendations Panel**: Rule-based mapping of temperature, humidity & conditions to classic Indian delicacies (e.g. *Hot Pakoras & Masala Chai* for rain, *Chilled Lassi & Nimbu Pani* for heatwaves) and outfit choices.
5. **Smart Agriculture & Farmer Advisory**: Gives real-time field irrigation guidance, crop management directives, and pest infestation risk warnings calculated from rainfall, humidity, and temperature.
6. **Multi-City Trip & Packing Planner**: Allows users to configure multi-city travel itineraries across date ranges with day-by-day weather forecasts and packing checklists.
7. **Air Quality Index (AQI) & UV Index**: Integrated Open-Meteo Air Quality API delivering US AQI, PM2.5, PM10 metrics and one-line health advisories.
8. **Text-to-Speech (TTS) Pipeline**: Hybrid audio player using Sarvam AI Bulbul v3 for natural Indian-accented speech, Google Cloud TTS fallback, and native Web Speech API.
9. **Hindi & English Dual Localization**: Toggle all UI text, advisories, and chat replies between English and हिन्दी.
10. **PWA Ready**: Web app manifest (`manifest.json`) and service worker (`sw.js`) enabling one-click mobile installation.

---

## 📁 Project Folder Structure

```
weather-gpt/
├── index.html                   # Instant browser preview bundle
├── public/
│   ├── manifest.json            # PWA manifest
│   └── sw.js                     # Offline Service Worker
├── src/
│   ├── app/                     # Next.js 14 App Router
│   │   ├── page.tsx             # Main Weather Dashboard
│   │   ├── chat/page.tsx        # WeatherGPT AI Chat Panel
│   │   ├── trip-planner/page.tsx# Multi-City Trip Itinerary
│   │   └── api/
│   │       ├── chat/route.ts    # Groq / Llama Weather AI Parser
│   │       └── tts/route.ts     # Sarvam AI / Google Cloud TTS Route
│   ├── components/
│   │   ├── WeatherCanvas.tsx    # HTML5 Particle Physics Canvas
│   │   ├── HeroCard.tsx         # Current Temp & Sunrise/Sunset Arc
│   │   ├── ForecastStrip.tsx    # Hourly & 7-Day Forecast Cards
│   │   ├── AQIGauge.tsx         # Air Quality & UV Index Cards
│   │   ├── FoodClothingCard.tsx # Weather-tailored Food & Outfit Picks
│   │   ├── FarmerAdvisory.tsx   # Smart AgTech Farmer Guidance
│   │   ├── AlertModal.tsx       # Severe Weather Popup Warning Modal
│   │   ├── HistoricalCompare.tsx# "This Day Last Year" Weather Compare
│   │   ├── FavoriteCities.tsx   # Quick-Switch Indian City Chips
│   │   └── ShareWeatherCard.tsx # Shareable Image / Summary Exporter
│   └── lib/
│       ├── openmeteo.ts         # Satellite Weather & AQI Client
│       ├── geocoding.ts         # Dynamic Geocoding Engine
│       ├── suggestions.ts       # Food, Clothing & Farmer Rules
│       ├── i18n.ts              # English & Hindi Dictionaries
│        font/                   
│       └── tts.ts               # Multi-engine Audio Synthesizer
├── .env.example                 # Reference API Keys
└── package.json                 # Next.js 14 Dependencies
```

---

## ⚡ How to Run Locally

### Prerequisites
- Node.js (v18.0 or higher) installed on your system.

### Steps
1. Navigate to the project directory:
   ```bash
   cd C:\Users\HP\.gemini\antigravity\scratch\weather-gpt
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` (Copy from `.env.example`):
   ```bash
   cp .env.example .env.local
   ```
   *(Add your `GROQ_API_KEY`, `SARVAM_API_KEY` optional)*

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Instant Preview**: You can also open `index.html` directly in any web browser without running any commands!

---

## 🚀 Deploy to Vercel

1. Push your repository to GitHub / GitLab.
2. Go to [Vercel Dashboard](https://vercel.com) and click **Add New Project**.
3. Import your `weather-gpt` repository.
4. Add environment variables (`GROQ_API_KEY`, `SARVAM_API_KEY`, `GOOGLE_CLOUD_TTS_KEY`) under **Environment Variables**.
5. Click **Deploy**. Vercel will automatically build and deploy your application to a global CDN!

---

## 📄 License
Created for Smart India Hackathon (SIH). Open Source MIT License.
