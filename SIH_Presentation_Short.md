# 🚀 WeatherGPT — SIH Hackathon Pitch & Q&A (Short & Content-Driven)

---

## 🎙️ 5-MINUTE PRESENTATION SCRIPT (3 SPEAKERS)

### 👤 SPEAKER 1: Problem & UI/UX Canvas (0:00 – 1:30)
- **Greeting**: *"Respected Judges, we are Team WeatherGPT presenting **WeatherGPT** — an AI-powered climate intelligence platform."*
- **Problem**: 
  1. Standard apps show raw numbers (`32°C, 70% humidity`) but fail to advise *what to eat, what to wear, or when to irrigate*.
  2. Legacy apps suffer from hardcoded location bugs and miss rural district micro-climates.
  3. Lack of multi-lingual accessibility for non-English users across India.
- **UI/UX Solution**:
  - **60 FPS Canvas Physics**: Real-time atmospheric particle engine (rain streaks + lightning, snow drift, cloud haze, solar flares) synced with WMO weather codes.
  - **100% Hindi Toggle & TTS Audio**: 1-tap full language transformation with Web Speech text-to-speech audio synthesis.

---

### 👤 SPEAKER 2: Tech Stack, Satellite API & Interactive Maps (1:30 – 3:00)
- **Tech Stack**: Built with Next.js 14 App Router, TypeScript, Tailwind CSS, and Leaflet JS.
- **Dynamic Geocoding**: Zero hardcoding. Live queries against Open-Meteo Geocoding API for 700+ Indian districts & global capitals.
- **Satellite Data Engine**: Parallel REST calls fetching US AQI, PM2.5, PM10, UV solar index, 24h hourly strips, 7-day daily forecasts, and solar arc timelines.
- **Navigation Map & Alerts**: Leaflet JS map with live marker positioning, multi-city travel route lines, and severe weather popup alert modals.

---

### 👤 SPEAKER 3: AI Chat, AgTech Advisory, Trip Planner & Pitch Close (3:00 – 4:30)
- **WeatherGPT AI Assistant**: Groq (Llama 3.1) + live Open-Meteo data synthesis. Answers any city query on the fly and performs multi-city comparisons (*"Compare Gwalior, Leh and Mumbai"*).
- **🌱 AgTech Farmer Advisory**: Rules engine computing irrigation schedules, crop protection, and frost warnings from rain, temp & humidity.
- **🧭 Multi-City Trip Planner**: Fetches satellite data in parallel, generates city-specific outfit recommendations (cotton for hot cities, woolens for cold, raincoats for wet), and lists top famous sightseeing spots (*Gwalior Fort, Hawa Mahal, Solang Valley*).
- **Closing**: PWA-ready, deployed live at `devvrajawat0.github.io/weathergpt/`, ready for national scaling. Thank you!

---

## 🎯 JUDGES Q&A CHEAT SHEET (CRISP 1-LINE ANSWERS)

1. **How do you prevent AI weather hallucinations?**  
   *Answer*: We decouple LLM generation from data fetching. Real Open-Meteo satellite JSON is injected into context; the LLM only formats the text.

2. **Why choose Open-Meteo over OpenWeatherMap?**  
   *Answer*: Open-Meteo offers keyless 10k daily calls, 1km–11km spatial satellite resolution, integrated AQI, and historical archive APIs.

3. **How did you fix the single-city geocoding bug?**  
   *Answer*: Queries dynamically hit Open-Meteo Geocoding API (`search?name={query}`) on the fly before every weather request. Zero hardcoded cities.

4. **Does the 60 FPS background lag budget phones?**  
   *Answer*: No. It uses GPU-accelerated HTML5 Canvas with capped particle physics (<3% CPU overhead).

5. **How does the Farmer Advisory work?**  
   *Answer*: A rules engine checks rain, temp & humidity — stopping irrigation when rain >5mm and issuing frost warnings below 5°C.

6. **How do non-English users use it?**  
   *Answer*: 1-click 100% Hindi UI toggle combined with native Web Speech text-to-speech audio readout.

7. **How do trip clothing recommendations vary per city?**  
   *Answer*: Parallel satellite calls evaluate each destination's live temp & rain — recommending cottons for >30°C, woolens for <16°C, and rain gear for rain.

8. **Where are API keys stored?**  
   *Answer*: Server-side in `.env.local` inside Next.js API routes (`/api/chat`, `/api/tts`), keeping client bundles 100% leak-proof.

9. **How will this scale during monsoons or cyclones?**  
   *Answer*: Client-side PWA caching via Service Workers (`sw.js`) and Vercel Edge CDN distribution handle millions of requests smoothly.

10. **What is the post-SIH roadmap?**  
    *Answer*: IoT soil sensor integration, regional voice dialects (Tamil, Telugu, Marathi via Sarvam AI), and SMS emergency disaster alerts.
