const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Helper to fetch data from external APIs via https
function fetchHttps(targetUrl) {
  return new Promise((resolve, reject) => {
    https.get(targetUrl, { headers: { 'User-Agent': 'WeatherGPT-SIH26068/1.0' } }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ error: 'Failed to parse API response', raw: body });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Database helper
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { settings: {}, savedLocations: [], customAlerts: [], chatHistory: [] };
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB:', err);
    return { settings: {}, savedLocations: [], customAlerts: [], chatHistory: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}

// MASSIVE INDIAN GEOGRAPHY & CITIES KNOWLEDGE DATABASE
const POPULAR_LOCATIONS = [
  // North India & Himalayas
  { name: "Delhi, India", lat: 28.6139, lon: 77.2090, keywords: ["delhi", "dilli", "ncr", "new delhi"] },
  { name: "Shimla, Himachal Pradesh", lat: 31.1048, lon: 77.1734, keywords: ["shimla", "simla"] },
  { name: "Manali, Himachal Pradesh", lat: 32.2432, lon: 77.1892, keywords: ["manali"] },
  { name: "Dharamshala, Himachal Pradesh", lat: 32.2190, lon: 76.3234, keywords: ["dharamshala", "mcleodganj"] },
  { name: "Srinagar, Jammu & Kashmir", lat: 34.0837, lon: 74.7973, keywords: ["srinagar", "kashmir"] },
  { name: "Jammu, Jammu & Kashmir", lat: 32.7266, lon: 74.8570, keywords: ["jammu"] },
  { name: "Leh, Ladakh", lat: 34.1526, lon: 77.5771, keywords: ["leh", "ladakh"] },
  { name: "Dehradun, Uttarakhand", lat: 30.3165, lon: 78.0322, keywords: ["dehradun"] },
  { name: "Mussoorie, Uttarakhand", lat: 30.4598, lon: 78.0644, keywords: ["mussoorie"] },
  { name: "Nainital, Uttarakhand", lat: 29.3919, lon: 79.4542, keywords: ["nainital"] },
  { name: "Rishikesh, Uttarakhand", lat: 30.0869, lon: 78.2676, keywords: ["rishikesh"] },
  { name: "Haridwar, Uttarakhand", lat: 29.9457, lon: 78.1642, keywords: ["haridwar"] },
  { name: "Chandigarh, UT", lat: 30.7333, lon: 76.7794, keywords: ["chandigarh"] },
  { name: "Amritsar, Punjab", lat: 31.6340, lon: 74.8723, keywords: ["amritsar"] },
  { name: "Ludhiana, Punjab", lat: 30.9010, lon: 75.8573, keywords: ["ludhiana"] },
  { name: "Gurgaon (Gurugram), Haryana", lat: 28.4595, lon: 77.0266, keywords: ["gurgaon", "gurugram"] },
  { name: "Noida, UP", lat: 28.5355, lon: 77.3910, keywords: ["noida"] },

  // West & Central India
  { name: "Mumbai, Maharashtra", lat: 19.0760, lon: 72.8777, keywords: ["mumbai", "bombay", "bandra", "andheri"] },
  { name: "Pune, Maharashtra", lat: 18.5204, lon: 73.8567, keywords: ["pune", "poona"] },
  { name: "Nagpur, Maharashtra", lat: 21.1458, lon: 79.0882, keywords: ["nagpur"] },
  { name: "Nashik, Maharashtra", lat: 19.9975, lon: 73.7898, keywords: ["nashik"] },
  { name: "Ahmedabad, Gujarat", lat: 23.0225, lon: 72.5714, keywords: ["ahmedabad", "amdavad"] },
  { name: "Surat, Gujarat", lat: 21.1702, lon: 72.8311, keywords: ["surat"] },
  { name: "Vadodara, Gujarat", lat: 22.3072, lon: 73.1812, keywords: ["vadodara", "baroda"] },
  { name: "Jaipur, Rajasthan", lat: 26.9124, lon: 75.7873, keywords: ["jaipur"] },
  { name: "Udaipur, Rajasthan", lat: 24.5854, lon: 73.7125, keywords: ["udaipur"] },
  { name: "Jodhpur, Rajasthan", lat: 26.2389, lon: 73.0243, keywords: ["jodhpur"] },
  { name: "Bhopal, MP", lat: 23.2599, lon: 77.4126, keywords: ["bhopal"] },
  { name: "Indore, MP", lat: 22.7196, lon: 75.8577, keywords: ["indore"] },
  { name: "Gwalior, MP", lat: 26.2183, lon: 78.1828, keywords: ["gwalior"] },
  { name: "Panaji, Goa", lat: 15.4909, lon: 73.8278, keywords: ["goa", "panaji", "panjim"] },

  // East & North-East India
  { name: "Lucknow, UP", lat: 26.8467, lon: 80.9462, keywords: ["lucknow", "lakhnau"] },
  { name: "Varanasi, UP", lat: 25.3176, lon: 82.9739, keywords: ["varanasi", "banaras", "kashi"] },
  { name: "Agra, UP", lat: 27.1767, lon: 78.0081, keywords: ["agra"] },
  { name: "Kanpur, UP", lat: 26.4499, lon: 80.3319, keywords: ["kanpur"] },
  { name: "Prayagraj (Allahabad), UP", lat: 25.4358, lon: 81.8463, keywords: ["allahabad", "prayagraj"] },
  { name: "Kolkata, West Bengal", lat: 22.5726, lon: 88.3639, keywords: ["kolkata", "calcutta"] },
  { name: "Darjeeling, West Bengal", lat: 27.0410, lon: 88.2663, keywords: ["darjeeling"] },
  { name: "Patna, Bihar", lat: 25.5941, lon: 85.1376, keywords: ["patna"] },
  { name: "Ranchi, Jharkhand", lat: 23.3441, lon: 85.3096, keywords: ["ranchi"] },
  { name: "Bhubaneswar, Odisha", lat: 20.2961, lon: 85.8245, keywords: ["bhubaneswar"] },
  { name: "Raipur, Chhattisgarh", lat: 21.2514, lon: 81.6296, keywords: ["raipur"] },
  { name: "Guwahati, Assam", lat: 26.1445, lon: 91.7362, keywords: ["guwahati"] },
  { name: "Shillong, Meghalaya", lat: 25.5788, lon: 91.8933, keywords: ["shillong"] },
  { name: "Gangtok, Sikkim", lat: 27.3389, lon: 88.6065, keywords: ["gangtok"] },

  // South India
  { name: "Bangalore (Bengaluru), Karnataka", lat: 12.9716, lon: 77.5946, keywords: ["bangalore", "bengaluru"] },
  { name: "Mysore, Karnataka", lat: 12.2958, lon: 76.6394, keywords: ["mysore"] },
  { name: "Chennai, Tamil Nadu", lat: 13.0827, lon: 80.2707, keywords: ["chennai", "madras"] },
  { name: "Coimbatore, Tamil Nadu", lat: 11.0168, lon: 76.9558, keywords: ["coimbatore"] },
  { name: "Ooty, Tamil Nadu", lat: 11.4102, lon: 76.6950, keywords: ["ooty"] },
  { name: "Hyderabad, Telangana", lat: 17.3850, lon: 78.4867, keywords: ["hyderabad"] },
  { name: "Visakhapatnam, AP", lat: 17.6868, lon: 83.2185, keywords: ["visakhapatnam", "vizag"] },
  { name: "Kochi, Kerala", lat: 9.9312, lon: 76.2673, keywords: ["kochi", "cochin"] },
  { name: "Thiruvananthapuram, Kerala", lat: 8.5241, lon: 76.9366, keywords: ["trivandrum", "thiruvananthapuram"] }
];

// Smart Location Extractor from User Question
async function extractLocationAndFetchWeather(userQuery, defaultContext = {}) {
  const q = (userQuery || '').toLowerCase().trim();
  const db = readDB();

  let targetLocation = null;

  for (let item of POPULAR_LOCATIONS) {
    if (item.keywords.some(kw => q.includes(kw))) {
      targetLocation = { name: item.name, lat: item.lat, lon: item.lon };
      break;
    }
  }

  if (!targetLocation && db.savedLocations && db.savedLocations.length > 0) {
    for (let loc of db.savedLocations) {
      const nameClean = loc.name.toLowerCase();
      const firstWord = nameClean.split(',')[0].trim();
      if (q.includes(firstWord) && firstWord.length > 2) {
        targetLocation = { name: loc.name, lat: loc.lat, lon: loc.lon };
        break;
      }
    }
  }

  if (!targetLocation) {
    const stopWords = ["weather", "temperature", "temp", "baarish", "barish", "rain", "today", "tomorrow", "kaisa", "kaisi", "kaise", "hogi", "hoga", "kya", "alert", "warning", "weekend", "hindi", "batao", "bataoo", "bataiaye", "mein", "ka", "ki", "ko", "par", "se", "umbrella", "chhata", "chata", "raincoat", "hawa", "climate", "haalat", "report", "please", "should", "carry", "best", "visit", "trip", "going", "to", "pehne", "pehna", "kapde", "clothing", "dress", "suggest", "outfit", "wear", "clothes", "food", "khana", "khaane", "snack", "breakfast", "lunch", "dinner", "chai", "tea", "coffee", "dish", "eat", "eating", "sath", "saath", "rakhein", "rakhe", "rakhna", "lejaayein", "lejana", "le", "aaj", "kal", "abhi", "chahiye", "karein", "karo", "hai", "hain", "hu", "hoon", "bhi", "kuch", "pehan", "pehno", "pehnu", "jaayein", "jaun", "jaana", "jana", "ghoomne", "travel", "yatra", "tour", "vacation", "need", "take", "bring", "recommend"];
    
    const match = q.match(/(?:in|me|at|near|ka|ki|for|to)\s+([a-z\s]+)/i);
    let candidateWord = null;

    if (match) {
      const words = match[1].trim().split(/\s+/).map(w => w.replace(/[^a-z]/g, ''));
      candidateWord = words.find(w => w.length >= 3 && !stopWords.includes(w));
    }

    if (!candidateWord) {
      const words = q.split(/\s+/).map(w => w.replace(/[^a-z]/g, ''));
      candidateWord = words.find(w => w.length >= 3 && !stopWords.includes(w));
    }

    if (candidateWord && candidateWord.length >= 3) {
      try {
        const geoData = await fetchHttps(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(candidateWord)}&count=5&language=en&format=json`);
        if (geoData.results && geoData.results.length > 0) {
          const indianResult = geoData.results.find(r => r.country === 'India') || geoData.results[0];
          const placeName = `${indianResult.name}${indianResult.admin1 ? ', ' + indianResult.admin1 : ''}${indianResult.country ? ', ' + indianResult.country : ''}`;
          targetLocation = { name: placeName, lat: indianResult.latitude, lon: indianResult.longitude };

          db.savedLocations = db.savedLocations || [];
          if (!db.savedLocations.some(l => l.name === placeName)) {
            db.savedLocations.push({ name: placeName, lat: indianResult.latitude, lon: indianResult.longitude, type: 'District', country: indianResult.country || 'India' });
            writeDB(db);
          }
        }
      } catch (err) {
        console.error('Dynamic geocoding error:', err);
      }
    }
  }

  if (!targetLocation) {
    let rawName = defaultContext.locationName ? defaultContext.locationName.replace(/\s*\([^)]*\)/g, '').trim() : 'Gwalior, Madhya Pradesh';
    if (rawName.includes('Iraq') || rawName.includes('Nāhī') || rawName.includes('Nahi') || rawName.includes('Suriname') || rawName.includes('Cajana')) {
      rawName = 'Gwalior, Madhya Pradesh';
    }
    targetLocation = {
      name: rawName || 'Gwalior, Madhya Pradesh',
      lat: (rawName === 'Gwalior, Madhya Pradesh' ? 26.2183 : (defaultContext.lat || 26.2183)),
      lon: (rawName === 'Gwalior, Madhya Pradesh' ? 78.1772 : (defaultContext.lon || 78.1772))
    };
  }

  try {
    const weatherRes = await fetchHttps(`https://api.open-meteo.com/v1/forecast?latitude=${targetLocation.lat}&longitude=${targetLocation.lon}&current_weather=true&hourly=precipitation_probability,relativehumidity_2m&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`);
    
    const cur = weatherRes.current_weather || {};
    const rainProb = weatherRes.hourly && weatherRes.hourly.precipitation_probability ? weatherRes.hourly.precipitation_probability[0] || 10 : 10;
    const humidity = weatherRes.hourly && weatherRes.hourly.relativehumidity_2m ? weatherRes.hourly.relativehumidity_2m[0] || 60 : 60;
    const maxTemp = weatherRes.daily && weatherRes.daily.temperature_2m_max ? Math.round(weatherRes.daily.temperature_2m_max[0]) : Math.round(cur.temperature + 4);
    const minTemp = weatherRes.daily && weatherRes.daily.temperature_2m_min ? Math.round(weatherRes.daily.temperature_2m_min[0]) : Math.round(cur.temperature - 4);
    const uvIndex = weatherRes.daily && weatherRes.daily.uv_index_max ? Math.round(weatherRes.daily.uv_index_max[0]) : 5;

    return {
      locationName: targetLocation.name,
      temp: cur.temperature !== undefined ? Math.round(cur.temperature) : (defaultContext.temp || 28),
      maxTemp: maxTemp,
      minTemp: minTemp,
      weatherCode: cur.weathercode !== undefined ? cur.weathercode : 0,
      windSpeed: cur.windspeed !== undefined ? Math.round(cur.windspeed) : 12,
      rainProb: rainProb,
      humidity: humidity,
      uvIndex: uvIndex,
      aqi: defaultContext.aqi || 45
    };
  } catch (err) {
    console.error('Weather fetch error for location:', err);
    return {
      locationName: targetLocation.name,
      temp: defaultContext.temp || 28,
      maxTemp: 32,
      minTemp: 24,
      weatherCode: 0,
      windSpeed: 12,
      rainProb: 15,
      humidity: 60,
      uvIndex: 5,
      aqi: 45
    };
  }
}

// ENHANCED CLOTHING & OUTFIT ADVISORY ENGINE
function generateClothingRecommendation(temp, rainProb, humidity, uvIndex, weatherCode) {
  let advice = [];
  let isRainy = rainProb > 40 || [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode);
  let isSnowy = [71, 73, 75, 77, 85, 86].includes(weatherCode);

  if (temp >= 35) {
    advice.push("👕 **Garmi Advice:** Dhile light-colored cotton shirt/t-shirt aur breathable trousers pehne.");
    advice.push("🕶️ Direct dhoop se bachne ke liye sunglasses, cap, aur SPF 30+ sunscreen lagayein.");
  } else if (temp >= 28 && temp < 35) {
    advice.push("👕 **Warm Weather:** Lightweight cotton clothing best rahegi.");
    if (humidity > 70) {
      advice.push("💧 High humidity hai, moisture-wicking fabric pehne taaki pasine se rahat mile.");
    }
  } else if (temp >= 20 && temp < 28) {
    advice.push("👕 **Pleasant Mausam:** Comfortable casualwear (T-shirt, jeans, light cotton shirt) pehne. Outdoor activities ke liye perfect mausam hai.");
  } else if (temp >= 12 && temp < 20) {
    advice.push("🧥 **Thand / Chilly:** Light sweater, denim jacket, ya hoodie pehne. Shaam aur subah thand badh sakti hai.");
  } else if (temp < 12 || isSnowy) {
    advice.push("🧥 **Coldwave / Severe Cold:** Heavy woolen jacket, thermals, muffler, aur gloves pehne. Apne aap ko garm rakhein.");
  }

  if (isRainy) {
    advice.push("☔ **Rain & Footwear:** Waterproof jacket/raincoat aur water-resistant sandals/crocs pehne. Heavy denim ya thick cotton se bachein jo geela hone par sukhne me time leta hai.");
  }

  return advice.join("\n");
}

// WEATHER-BASED FOOD & BEVERAGE ADVISORY ENGINE
function generateFoodRecommendation(temp, rainProb, humidity, weatherCode) {
  let advice = [];
  let isRainy = rainProb > 40 || [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode);

  if (isRainy) {
    advice.push("🥟 **Monsoon & Rainy Delicacies:** Garma-Garam Pyaz/Aloo Pakode, Bedai-Kachori (Gwalior Special!), Adrak Wali Cutting Chai, aur Hot Soup.");
  } else if (temp >= 32) {
    advice.push("🥤 **Beat The Heat Refreshments:** Chilled Lassi, Aam Panna, Nariyal Paani (Coconut Water), Watermelon/Cucumber Salad, aur Ice Cream.");
  } else if (temp <= 18) {
    advice.push("☕ **Winter Warming Foods:** Hot Masala Chai/Coffee, Gwalior Famous Poha Jalebi, Garam Samosa, Tomato Soup, aur Gajar ka Halwa.");
  } else {
    advice.push("🍲 **Pleasant Mausam Delicacies:** Gwalior Special Poha-Jalebi, Garam Samosa, Cold Coffee, Bedai-Kachori, aur Street Snacks.");
  }

  return advice.join("\n");
}

// HUMANIZED HINGLISH SPEECH GENERATOR
function generateHumanizedHinglishSpeech(location, temp, rainProb, conditionText, category, carryUmbrella, clothingAdvice = '', foodAdvice = '') {
  const locName = (location || '').replace(/\s*\([^)]*\)/g, '').split(',')[0].trim() || 'Gwalior';
  let speechParts = [];

  if (category === 'trip') {
    speechParts.push(rainProb > 40
      ? `${locName} trip ke liye baarish ki sambhavna ${rainProb} percent hai. Raincoat ya chhata zaroor saath rakhein.`
      : `${locName} trip ke liye mausam bilkul pleasant hai. Temperature ${temp} degree celsius hai.`);
  } else if (category === 'food') {
    speechParts.push(`${locName} me temperature ${temp} degree celsius hai.`);
  } else if (category === 'clothing') {
    speechParts.push(`${locName} me abhi temperature ${temp} degree celsius hai.`);
  } else if (category === 'umbrella') {
    speechParts.push(carryUmbrella
      ? `Haan bilkul! Aaj ${locName} me rain probability ${rainProb} percent hai, so chhata ya raincoat zaroor saath le jaana.`
      : `Nahi, aaj ${locName} me chhata ki zaroorat nahi hai. Mausam saaf rahega aur rain chance ${rainProb} percent hai.`);
  } else {
    speechParts.push(`Namaste! Abhi ${locName} me temperature lagbhag ${temp} degree celsius hai aur mausam ${conditionText} hai. ${carryUmbrella ? 'Baarish ki sambhavna hai, so chhata saath rakhein.' : 'Outdoor movement ke liye mausam acha hai.'}`);
  }

  // Outfit speech part
  if (temp > 32) {
    speechParts.push("Kapdo me lightweight cotton clothes pehne.");
  } else if (temp < 18) {
    speechParts.push("Kapdo me woolen jacket ya hoodie pehne.");
  } else {
    speechParts.push("Kapdo me comfortable casual wear pehne.");
  }

  // Food speech part (reads through food suggestions!)
  if (rainProb > 40) {
    speechParts.push("Aur khaane me garma-garam Pakode, Bedai-Kachori aur Adrak Chai enjoy karein!");
  } else if (temp > 32) {
    speechParts.push("Aur khaane peene me chilled Lassi, Aam Panna aur Nariyal Paani lein!");
  } else if (temp < 18) {
    speechParts.push("Aur khaane me hot Masala Chai, Garam Samosa aur Poha Jalebi lein!");
  } else {
    speechParts.push("Aur food me Gwalior famous Poha Jalebi, Samosa aur Cold Coffee try karein!");
  }

  return speechParts.join(" ");
}

// AI Engine for Multilingual Chat Processing
async function processWeatherGPTChat(query, defaultContext = {}, language = 'hinglish') {
  const q = (query || '').toLowerCase().trim();

  const weatherContext = await extractLocationAndFetchWeather(query, defaultContext);

  const location = weatherContext.locationName;
  const temp = weatherContext.temp;
  const maxTemp = weatherContext.maxTemp;
  const minTemp = weatherContext.minTemp;
  const weatherCode = weatherContext.weatherCode;
  const rainProb = weatherContext.rainProb;
  const aqi = weatherContext.aqi;
  const humidity = weatherContext.humidity;
  const windSpeed = weatherContext.windSpeed;
  const uvIndex = weatherContext.uvIndex;

  let conditionText = 'Saaf Aakash (Clear Sky)';
  let isRainy = rainProb > 40 || [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode);
  let isSnowy = [71, 73, 75, 77, 85, 86].includes(weatherCode);
  let isThunder = [95, 96, 99].includes(weatherCode);
  let isCloudy = [1, 2, 3, 45, 48].includes(weatherCode);

  if (isThunder) conditionText = 'Bijli aur Toofan (Thunderstorm)';
  else if (isSnowy) conditionText = 'Barafbaari (Snowfall)';
  else if (isRainy) conditionText = 'Baarish (Rainy)';
  else if (isCloudy) conditionText = 'Baadal (Cloudy)';

  const carryUmbrella = isRainy || rainProb >= 45;
  const umbrellaAdvice = carryUmbrella
    ? '☔ Haan, aaj chhata (umbrella) saath rakhein! Baarish hone ki sambhavna hai.'
    : '☀️ Nahin, aaj chhata ki zarurat nahi hai. Mausam saaf rahne ki ummeed hai.';

  const clothingAdvice = generateClothingRecommendation(temp, rainProb, humidity, uvIndex, weatherCode);
  const foodAdvice = generateFoodRecommendation(temp, rainProb, humidity, weatherCode);

  let responseText = '';
  let category = 'general';

  const isTrip = q.includes('trip') || q.includes('travel') || q.includes('visit') || q.includes('ghoomne') || q.includes('tour') || q.includes('yatra') || q.includes('going to') || q.includes('vacation');
  const isOutfit = q.includes('pehne') || q.includes('pehna') || q.includes('kapde') || q.includes('clothing') || q.includes('dress') || q.includes('outfit') || q.includes('wear') || q.includes('clothes');
  const isFood = q.includes('food') || q.includes('khana') || q.includes('khaane') || q.includes('snack') || q.includes('breakfast') || q.includes('lunch') || q.includes('dinner') || q.includes('chai') || q.includes('tea') || q.includes('coffee') || q.includes('dish') || q.includes('eat') || q.includes('eating');
  const isUmbrella = q.includes('umbrella') || q.includes('chhata') || q.includes('chata') || q.includes('raincoat');

  if (isTrip) {
    category = 'trip';
    const tripAdvisory = (rainProb > 50 || isThunder)
      ? `✈️ **Trip Advisory for ${location}:**\n⚠️ Rain probability is high (**${rainProb}%**). Outdoor sightseeing me baarish disruptions ho sakti hain, so keep umbrella/raincoat handy and prefer indoor venues.`
      : temp > 36
      ? `✈️ **Trip Advisory for ${location}:**\n☀️ Temperature is warm (**${temp}°C**). Morning aur evening times travel & sightseeing ke liye best rahenge. Carry water bottle aur sunglasses!`
      : `✈️ **Trip Advisory for ${location}:**\n✅ Mausam bilkul pleasant aur perfect hai! Travel & outdoor sightseeing happily plan kar sakte hain (${temp}°C, Rain chance ${rainProb}%).`;

    responseText = `${tripAdvisory}\n\n📍 **${location} Live Weather Overview:**\n• 🌡️ **Temperature:** ${temp}°C (High: ${maxTemp}°C / Low: ${minTemp}°C)\n• 🌤️ **Condition:** ${conditionText}\n• 🌧️ **Baarish Chance:** ${rainProb}%\n• 💨 **Wind Speed:** ${windSpeed} km/h\n\n👔 **Recommended Trip Outfit:**\n${clothingAdvice}\n\n${foodAdvice}`;
  }
  else if (isFood) {
    category = 'food';
    responseText = `🍲 **Weather-Based Food & Refreshment Recommendation for ${location}:**\n\n${foodAdvice}\n\n📍 **Current Weather Details:**\n• 🌡️ **Temperature:** ${temp}°C (Max: ${maxTemp}°C / Min: ${minTemp}°C)\n• 🌤️ **Condition:** ${conditionText}\n• 🌧️ **Rain Chance:** ${rainProb}%\n• 💧 **Humidity:** ${humidity}%\n\n👔 **Clothing Tip:**\n${clothingAdvice}`;
  }
  else if (isOutfit) {
    category = 'clothing';
    responseText = `👔 **Outfit & Dress Recommendation for ${location}:**\n\n${clothingAdvice}\n\n📍 **Current Weather Details:**\n• 🌡️ **Temperature:** ${temp}°C (Max: ${maxTemp}°C / Min: ${minTemp}°C)\n• 🌤️ **Condition:** ${conditionText}\n• 🌧️ **Rain Chance:** ${rainProb}%\n• 💧 **Humidity:** ${humidity}%\n\n${foodAdvice}`;
  }
  else if (isUmbrella) {
    category = 'umbrella';
    responseText = `${umbrellaAdvice}\n\n📍 **${location} Weather Summary:**\n• 🌧️ **Rain Probability:** ${rainProb}%\n• 🌡️ **Temperature:** ${temp}°C\n• 🌤️ **Condition:** ${conditionText}\n\n👔 **Outfit Advisory:**\n${clothingAdvice}\n\n${foodAdvice}`;
  }
  else if (q.includes('kaisa') || q.includes('weather') || q.includes('mausam') || q.includes('today') || q.includes('aaj') || q.includes('how is')) {
    category = 'today';
    responseText = `📍 **${location} Live Weather Report:**\n\n• 🌡️ **Temperature:** ${temp}°C (Max: ${maxTemp}°C / Min: ${minTemp}°C)\n• 🌤️ **Condition:** ${conditionText}\n• 🌧️ **Baarish Chance:** ${rainProb}%\n• 💧 **Humidity:** ${humidity}%\n• 💨 **Wind Speed:** ${windSpeed} km/h\n\n👔 **Clothing Advisory:**\n${clothingAdvice}\n\n${foodAdvice}`;
  }
  else if (q.includes('baarish') || q.includes('barish') || q.includes('rain') || q.includes('kal') || q.includes('tomorrow') || q.includes('monsoon')) {
    category = 'rain';
    responseText = `🌧️ **Rain & Monsoon Forecast for ${location}:**\n\n• Live Rain Chance: **${rainProb}%**\n• Condition: **${conditionText}**\n• Expected High: **${maxTemp}°C**\n\n${rainProb > 45 ? '⚠️ Heavy rain advisory: Waterlogging aur traffic disruption se bachne ke liye raincoat/umbrella tayyar rakhein.' : '✅ Abhi heavy rainfall ki badi warning nahi hai.'}\n\n👔 **Footwear & Outfit:**\n${clothingAdvice}`;
  }
  else if (q.includes('temp') || q.includes('temperature') || q.includes('garmi') || q.includes('sardi') || q.includes('thand')) {
    category = 'temperature';
    responseText = `🌡️ **Temperature Details for ${location}:**\n\n• Current Temp: **${temp}°C**\n• Expected High: **${maxTemp}°C**\n• Expected Low: **${minTemp}°C**\n• RealFeel: **${temp + 2}°C**\n\n👔 **Outfit Advisory:**\n${clothingAdvice}`;
  }
  else if (q.includes('alert') || q.includes('warning') || q.includes('khatra') || q.includes('cyclone') || q.includes('storm')) {
    category = 'alert';
    if (isThunder) {
      responseText = `⚠️ **CRITICAL WEATHER ALERT:**\n\n📍 ${location} me **Thunderstorm Warning** active hai! Bijli kadakne aur heavy rain ki sambhavna hai. Khule maidaan me na khade ho.`;
    } else if (temp > 38) {
      responseText = `⚠️ **HEATWAVE WARNING:**\n\n📍 ${location} me high temperature (**${temp}°C**) hai! Direct dhoop se bachein.`;
    } else {
      responseText = `✅ **No Emergency Warnings:**\n\n📍 ${location} ke liye abhi koi severe disaster alert active nahi hai. Mausam normal hai.`;
    }
  }
  else if (q.includes('hindi') || q.includes('हिंदी')) {
    category = 'hindi';
    responseText = `🇮🇳 **मौसम रिपोर्ट (${location}):**\n\n• वर्तमान तापमान: **${temp}°C** (अधिकतम: ${maxTemp}°C / न्यूनतम: ${minTemp}°C)\n• मौसम स्थिति: **${conditionText}**\n• बारिश की संभावना: **${rainProb}%**\n• हवा की गति: **${windSpeed} किमी/घंटा**\n\n👔 **कपड़ों की सलाह:**\n${clothingAdvice}\n\n${carryUmbrella ? '👉 सलाह: बाहर जाते समय छाता साथ रखें।' : '👉 सलाह: मौसम सुहावना है।'}`;
  }
  else {
    responseText = `📍 **${location}** Weather Summary:\n\n• Temperature: **${temp}°C** (${conditionText})\n• Max/Min: **${maxTemp}°C / ${minTemp}°C**\n• Precipitation Chance: **${rainProb}%**\n\n👔 **Outfit Advice:**\n${clothingAdvice}`;
  }

  // Generate Humanized Hinglish Voice Text
  const speechText = generateHumanizedHinglishSpeech(location, temp, rainProb, conditionText, category, carryUmbrella, clothingAdvice, foodAdvice);

  return {
    text: responseText,
    speechText: speechText,
    category: category,
    umbrellaNeeded: carryUmbrella,
    rainProbability: rainProb,
    temperature: temp,
    maxTemp: maxTemp,
    minTemp: minTemp,
    clothingAdvice: clothingAdvice,
    location: location,
    condition: conditionText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

// HTTP Request Handler
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // --- REST API ENDPOINTS ---

  // 1. Live Weather Proxy Endpoint
  if (pathname === '/api/weather' && method === 'GET') {
    const lat = parsedUrl.query.lat || 26.2183;
    const lon = parsedUrl.query.lon || 78.1772;
    
    const targetUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,precipitation_probability,weathercode,windspeed_10m,surface_pressure&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max&timezone=auto`;
    
    try {
      const data = await fetchHttps(targetUrl);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch live weather data', details: err.message }));
    }
    return;
  }

  // 2. Air Quality Proxy Endpoint
  if (pathname === '/api/aqi' && method === 'GET') {
    const lat = parsedUrl.query.lat || 26.2183;
    const lon = parsedUrl.query.lon || 78.1772;
    
    const targetUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone&timezone=auto`;
    
    try {
      const data = await fetchHttps(targetUrl);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch AQI data', details: err.message }));
    }
    return;
  }

  // 3. Geocoding Search Endpoint (Prioritizes Indian Cities/Districts)
  if (pathname === '/api/geocoding' && method === 'GET') {
    const query = parsedUrl.query.q || '';
    if (!query) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ results: [] }));
      return;
    }
    
    const targetUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;
    
    try {
      const data = await fetchHttps(targetUrl);
      if (data.results && data.results.length > 0) {
        data.results = data.results.filter(r => r.country === 'India');
      } else {
        data.results = [];
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to search locations', details: err.message }));
    }
    return;
  }

  // 4. AI Chat Processing Endpoint
  if (pathname === '/api/chat' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const userQuery = payload.query || '';
        const defaultContext = payload.context || {};
        const language = payload.language || 'hinglish';

        const botResponse = await processWeatherGPTChat(userQuery, defaultContext, language);

        // Save to DB history
        const db = readDB();
        const userMsg = { id: Date.now(), sender: 'user', text: userQuery, time: botResponse.timestamp };
        const botMsg = { id: Date.now() + 1, sender: 'bot', ...botResponse };
        
        db.chatHistory = db.chatHistory || [];
        db.chatHistory.push(userMsg, botMsg);
        if (db.chatHistory.length > 50) db.chatHistory = db.chatHistory.slice(-50);
        writeDB(db);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(botResponse));
      } catch (err) {
        console.error('Chat Error:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload or server error' }));
      }
    });
    return;
  }

  // 5. Database CRUD Endpoints
  if (pathname === '/api/db' && method === 'GET') {
    const dbData = readDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(dbData));
    return;
  }

  if (pathname === '/api/db' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const db = readDB();

        if (payload.action === 'saveLocation') {
          db.savedLocations = db.savedLocations || [];
          if (!db.savedLocations.some(l => l.name === payload.location.name)) {
            db.savedLocations.push(payload.location);
          }
        } else if (payload.action === 'updateSettings') {
          db.settings = { ...db.settings, ...payload.settings };
        } else if (payload.action === 'addAlert') {
          db.customAlerts = db.customAlerts || [];
          db.customAlerts.push(payload.alert);
        } else if (payload.action === 'clearChat') {
          db.chatHistory = [];
        }

        writeDB(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, db }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to update DB' }));
      }
    });
    return;
  }

  // --- STATIC FILE SERVING ---
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  const extname = path.extname(filePath);
  
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err, indexContent) => {
          if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌤️ WeatherGPT SIH26068 Server is Live on Port ${PORT}`);
  console.log(`🌐 Dashboard URL: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
