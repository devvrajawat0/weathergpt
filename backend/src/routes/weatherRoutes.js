import express from 'express';
import { getWeatherData } from '../services/weatherService.js';
import { generateSevereAlerts } from '../services/alertService.js';
import { INDIAN_DISTRICTS } from '../data/districts.js';
import { WORLD_CAPITALS } from '../data/capitals.js';

const router = express.Router();

/**
 * GET /api/weather/forecast?lat=...&lon=...
 */
router.get('/forecast', async (req, res) => {
  try {
    const { lat, lon, locationId } = req.query;

    let targetLat = parseFloat(lat);
    let targetLon = parseFloat(lon);

    if (isNaN(targetLat) || isNaN(targetLon)) {
      // Default to New Delhi if lat/lon not provided
      const defaultLoc = INDIAN_DISTRICTS.find(d => d.name.includes('Delhi')) || INDIAN_DISTRICTS[0];
      targetLat = defaultLoc.lat;
      targetLon = defaultLoc.lon;
    }

    const weatherData = await getWeatherData(targetLat, targetLon);

    // Find location metadata if possible
    let locMeta = null;
    if (locationId) {
      locMeta = INDIAN_DISTRICTS.find(d => d.id === locationId) || WORLD_CAPITALS.find(c => c.id === locationId);
    }
    if (!locMeta) {
      // Find closest district or capital
      const allLocs = [...INDIAN_DISTRICTS, ...WORLD_CAPITALS];
      let minDistance = Infinity;
      for (const item of allLocs) {
        const dist = Math.hypot(item.lat - targetLat, item.lon - targetLon);
        if (dist < minDistance) {
          minDistance = dist;
          locMeta = item;
        }
      }
    }

    const alerts = generateSevereAlerts(weatherData, locMeta || { name: 'Current Location' });

    res.json({
      success: true,
      location: locMeta || { name: 'Custom Location', lat: targetLat, lon: targetLon },
      weather: weatherData,
      alerts
    });
  } catch (error) {
    console.error("Error in /api/weather/forecast:", error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch weather data' });
  }
});

/**
 * GET /api/weather/alerts?state=...&country=...
 */
router.get('/alerts', async (req, res) => {
  try {
    const { state, country } = req.query;
    const allAlerts = [];

    // Filter districts or capitals
    let sampleLocations = [];
    if (state) {
      sampleLocations = INDIAN_DISTRICTS.filter(d => d.state.toLowerCase().includes(state.toLowerCase()));
    } else if (country) {
      sampleLocations = WORLD_CAPITALS.filter(c => c.country.toLowerCase().includes(country.toLowerCase()));
    } else {
      // Return featured major centers (e.g. Bhopal, Delhi, Mumbai, Kolkata, Chennai, Wayanad, Tokyo, London)
      sampleLocations = INDIAN_DISTRICTS.filter(d => 
        ['Bhopal', 'New Delhi', 'Mumbai (City & Suburban)', 'Kolkata', 'Chennai', 'Wayanad (Kalpetta)', 'Shimla', 'Jaisalmer'].some(n => d.name.includes(n))
      );
    }

    for (const loc of sampleLocations.slice(0, 8)) {
      try {
        const wData = await getWeatherData(loc.lat, loc.lon);
        const locAlerts = generateSevereAlerts(wData, loc);
        allAlerts.push(...locAlerts);
      } catch (err) {
        console.warn(`Could not check alerts for ${loc.name}:`, err.message);
      }
    }

    res.json({
      success: true,
      filter: { state, country },
      alertsCount: allAlerts.length,
      alerts: allAlerts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
