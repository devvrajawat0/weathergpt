/**
 * WeatherGPT Conversational AI Interface Module
 * Supports multilingual natural language queries (Hinglish / Hindi / English)
 * Features Web Speech Synthesis text-to-speech, interactive prompt chips, structured visual weather cards,
 * and dual mode (Node Backend + GitHub Pages static client-side fallback).
 */

class WeatherGPTChatClient {
  constructor() {
    this.chatContainer = document.getElementById('chat-messages');
    this.inputField = document.getElementById('chat-input-text');
    this.sendBtn = document.getElementById('chat-send-btn');
    this.ttsToggle = document.getElementById('tts-toggle-btn');
    this.voiceSelect = document.getElementById('tts-voice-select');
    this.micBtn = document.getElementById('mic-input-btn');
    this.ttsEnabled = true;

    this.initEventListeners();
    this.initVoiceList();
  }

  initVoiceList() {
    if (!('speechSynthesis' in window)) return;
    
    const populateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!this.voiceSelect || voices.length === 0) return;

      const currentVal = this.voiceSelect.value;
      const indianOrHindi = voices.filter(v => 
        v.lang.includes('hi') || 
        v.lang.includes('en-IN') || 
        v.name.toLowerCase().includes('india') || 
        v.name.toLowerCase().includes('hindi')
      );

      if (indianOrHindi.length > 0 && this.voiceSelect.options.length <= 3) {
        indianOrHindi.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.name;
          opt.innerText = `🔊 ${v.name.replace(/Microsoft |Google /g, '')} (${v.lang})`;
          this.voiceSelect.appendChild(opt);
        });
        if (currentVal) this.voiceSelect.value = currentVal;
      }
    };

    populateVoices();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
  }

  initEventListeners() {
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this.handleSendMessage());
    }

    if (this.inputField) {
      this.inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleSendMessage();
      });
    }

    if (this.ttsToggle) {
      this.ttsToggle.addEventListener('click', () => {
        this.ttsEnabled = !this.ttsEnabled;
        this.ttsToggle.classList.toggle('bg-blue-600', this.ttsEnabled);
        this.ttsToggle.classList.toggle('bg-slate-700', !this.ttsEnabled);
        const icon = this.ttsToggle.querySelector('i');
        if (icon) {
          icon.setAttribute('data-lucide', this.ttsEnabled ? 'volume-2' : 'volume-x');
          if (window.lucide) lucide.createIcons();
        }
      });
    }

    if (this.voiceSelect) {
      this.voiceSelect.addEventListener('change', () => {
        if (this.ttsEnabled) {
          this.speakText("Voice accent updated. WeatherGPT voice test active.");
        }
      });
    }

    if (this.micBtn) {
      this.micBtn.addEventListener('click', () => this.handleVoiceInput());
    }

    document.querySelectorAll('.chat-prompt-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const text = e.currentTarget.getAttribute('data-prompt') || e.currentTarget.innerText;
        if (this.inputField) {
          this.inputField.value = text;
          this.handleSendMessage();
        }
      });
    });
  }

  async handleSendMessage(customQuery = null) {
    const text = customQuery || (this.inputField ? this.inputField.value.trim() : '');
    if (!text) return;

    if (this.inputField) this.inputField.value = '';

    this.appendMessage('user', text);
    const typingId = this.showTypingIndicator();

    try {
      const weatherContext = window.AppState ? window.AppState.getWeatherContext() : {};
      
      let data;
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: text,
            context: weatherContext,
            language: window.AppState ? window.AppState.language : 'hinglish'
          })
        });
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error('Fallback to client NLP');
        }
      } catch (backendErr) {
        data = await this.clientSideWeatherGPTNLP(text, weatherContext);
      }

      this.removeTypingIndicator(typingId);
      this.appendBotResponseCard(data);

      if (this.ttsEnabled && data.speechText) {
        this.speakText(data.speechText);
      }

    } catch (err) {
      console.error('Chat Error:', err);
      this.removeTypingIndicator(typingId);
      this.appendMessage('bot', '⚠️ Maaf kijiye, weather details load karne me problem aayi. Kripya punah prayas karein.');
    }
  }

  async clientSideWeatherGPTNLP(query, context = {}) {
    const q = query.toLowerCase().trim();
    let location = (context.locationName || 'Gwalior, Madhya Pradesh').replace(/\s*\([^)]*\)/g, '').trim();
    if (!location) location = 'Gwalior, Madhya Pradesh';
    let temp = Math.round(context.temp || 28);
    let maxTemp = context.maxTemp || Math.round(temp + 4);
    let minTemp = context.minTemp || Math.round(temp - 4);
    let rainProb = context.rainProb || 15;
    let humidity = context.humidity || 60;
    let windSpeed = context.windSpeed || 12;

    // Detect Indian location mentioned in query
    const stopWords = ["weather", "temperature", "temp", "baarish", "barish", "rain", "today", "tomorrow", "kaisa", "kaisi", "kaise", "hogi", "hoga", "kya", "alert", "warning", "weekend", "hindi", "batao", "bataoo", "bataiaye", "mein", "ka", "ki", "ko", "par", "se", "umbrella", "chhata", "chata", "raincoat", "hawa", "climate", "haalat", "report", "please", "should", "carry", "best", "visit", "trip", "going", "to", "pehne", "pehna", "kapde", "clothing", "dress", "suggest", "outfit", "wear", "clothes", "food", "khana", "khaane", "snack", "breakfast", "lunch", "dinner", "chai", "tea", "coffee", "dish", "eat", "eating", "sath", "saath", "rakhein", "rakhe", "rakhna", "lejaayein", "lejana", "le", "aaj", "kal", "abhi", "chahiye", "karein", "karo", "hai", "hain", "hu", "hoon", "bhi", "kuch", "pehan", "pehno", "pehnu", "jaayein", "jaun", "jaana", "jana", "ghoomne", "travel", "yatra", "tour", "vacation", "need", "take", "bring", "recommend"];
    const match = q.match(/(?:in|me|at|near|ka|ki|for|to)\s+([a-z\s]+)/i);
    let candidateWord = match ? match[1].trim().split(/\s+/).find(w => w.length >= 3 && !stopWords.includes(w)) : null;

    if (!candidateWord) {
      candidateWord = q.split(/\s+/).map(w => w.replace(/[^a-z]/g, '')).find(w => w.length >= 3 && !stopWords.includes(w));
    }

    if (candidateWord) {
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(candidateWord)}&count=5&language=en&format=json`);
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results[0]) {
          const indianResult = geoData.results.find(r => r.country === 'India') || geoData.results[0];
          location = `${indianResult.name}${indianResult.admin1 ? ', ' + indianResult.admin1 : ''}`;
          
          const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${indianResult.latitude}&longitude=${indianResult.longitude}&current_weather=true&hourly=precipitation_probability,relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
          const wData = await wRes.json();
          if (wData.current_weather) {
            temp = Math.round(wData.current_weather.temperature);
            windSpeed = Math.round(wData.current_weather.windspeed || 12);
          }
          if (wData.daily && wData.daily.temperature_2m_max) {
            maxTemp = Math.round(wData.daily.temperature_2m_max[0]);
            minTemp = Math.round(wData.daily.temperature_2m_min[0]);
          }
          if (wData.hourly && wData.hourly.precipitation_probability) {
            rainProb = wData.hourly.precipitation_probability[0] || 15;
          }
        }
      } catch (e) {
        console.warn('Client NLP fetch failed:', e);
      }
    } else {
      location = 'Gwalior, Madhya Pradesh';
    }

    const carryUmbrella = rainProb >= 40;
    const umbrellaAdvice = carryUmbrella
      ? '☔ Haan, aaj chhata (umbrella) saath rakhein! Baarish hone ki sambhavna hai.'
      : '☀️ Nahin, aaj chhata ki zarurat nahi hai. Mausam saaf rahne ki ummeed hai.';

    let outfitTip = temp > 32 ? '👕 Light cotton clothes pehno, garmi zyada hai.' : temp < 18 ? '🧥 Woolen jacket pehno, thand hai.' : '👕 Comfortable casual clothes pehno.';
    let foodTip = rainProb > 40
      ? '🥟 **Food Suggestion:** Garma-Garam Pakode, Bedai-Kachori (Gwalior Special) aur Adrak Chai enjoy karein!'
      : temp > 32
      ? '🥤 **Food Suggestion:** Chilled Lassi, Aam Panna aur Nariyal Paani lein!'
      : temp < 18
      ? '☕ **Food Suggestion:** Hot Masala Chai, Garam Samosa aur Poha-Jalebi lein!'
      : '🍲 **Food Suggestion:** Gwalior Special Poha-Jalebi, Samosa aur Cold Coffee try karein!';

    let speechFood = rainProb > 40
      ? 'Aur khaane me garma-garam Pakode, Bedai-Kachori aur Adrak Chai enjoy karein!'
      : temp > 32
      ? 'Aur khaane peene me chilled Lassi, Aam Panna aur Nariyal Paani lein!'
      : temp < 18
      ? 'Aur khaane me hot Masala Chai, Garam Samosa aur Poha Jalebi lein!'
      : 'Aur food me Gwalior famous Poha Jalebi, Samosa aur Cold Coffee try karein!';

    let responseText = '';
    let speechText = '';

    const isTrip = q.includes('trip') || q.includes('travel') || q.includes('visit') || q.includes('ghoomne') || q.includes('tour') || q.includes('yatra') || q.includes('going to') || q.includes('vacation');
    const isOutfit = q.includes('pehne') || q.includes('pehna') || q.includes('kapde') || q.includes('clothing') || q.includes('dress') || q.includes('outfit') || q.includes('wear') || q.includes('clothes');
    const isFood = q.includes('food') || q.includes('khana') || q.includes('khaane') || q.includes('snack') || q.includes('chai') || q.includes('eat');
    const isUmbrella = q.includes('umbrella') || q.includes('chhata') || q.includes('chata') || q.includes('raincoat');

    if (isTrip) {
      const tripAdvisory = carryUmbrella
        ? `✈️ **Trip Advisory for ${location}:**\n⚠️ Rain chance is high (**${rainProb}%**). Outdoor places visit karne par umbrella/raincoat zaroor carry karein.`
        : `✈️ **Trip Advisory for ${location}:**\n✅ Mausam bilkul pleasant hai! Outdoor travel & sightseeing comfortably enjoy karein (${temp}°C, Rain chance ${rainProb}%).`;
      responseText = `${tripAdvisory}\n\n📍 **${location} Live Weather Overview:**\n• 🌡️ **Temperature:** ${temp}°C (High: ${maxTemp}°C / Low: ${minTemp}°C)\n• 🌧️ **Baarish Chance:** ${rainProb}%\n• 💨 **Wind:** ${windSpeed} km/h\n\n👔 **Trip Outfit Tip:**\n👉 ${outfitTip}\n\n${foodTip}`;
      speechText = `${location} trip ke liye temperature ${temp} degree celsius hai. ${outfitTip} ${speechFood}`;
    } else if (isFood) {
      responseText = `🍲 **Food & Refreshment Recommendation for ${location}:**\n\n${foodTip}\n\n📍 **Live Weather Details:**\n• 🌡️ **Temperature:** ${temp}°C (High: ${maxTemp}°C / Low: ${minTemp}°C)\n• 🌧️ **Baarish Chance:** ${rainProb}%\n\n👔 **Outfit Tip:**\n👉 ${outfitTip}`;
      speechText = `${location} me temperature ${temp} degree celsius hai. ${speechFood} ${outfitTip}`;
    } else if (isOutfit) {
      responseText = `👔 **Outfit & Dress Recommendation for ${location}:**\n\n👉 ${outfitTip}\n\n📍 **Live Weather Details:**\n• 🌡️ **Temperature:** ${temp}°C (High: ${maxTemp}°C / Low: ${minTemp}°C)\n• 🌧️ **Baarish Chance:** ${rainProb}%\n• 💧 **Humidity:** ${humidity}%\n\n${foodTip}`;
      speechText = `${location} me temperature ${temp} degree celsius hai. ${outfitTip} ${speechFood}`;
    } else if (isUmbrella) {
      responseText = `${umbrellaAdvice}\n\n📍 **${location}** me rain probability **${rainProb}%** hai aur temperature **${temp}°C** hai.\n👉 ${outfitTip}\n\n${foodTip}`;
      speechText = (carryUmbrella ? `${location} me baarish ki sambhavna hai, chhata saath rakhein.` : `${location} me aaj chhata ki zaroorat nahi hai.`) + ` ${outfitTip} ${speechFood}`;
    } else if (q.includes('baarish') || q.includes('rain') || q.includes('kal') || q.includes('monsoon')) {
      responseText = `🌧️ **Rain & Monsoon Forecast for ${location}:**\n\n• Live Rain Chance: **${rainProb}%**\n• Current Temp: **${temp}°C**\n\n${rainProb > 40 ? '⚠️ Rain warning active. Keep umbrella ready.' : '✅ Heavy rainfall alert active nahi hai.'}\n\n${foodTip}`;
      speechText = `${location} me baarish ki sambhavna ${rainProb} percent hai. ${speechFood}`;
    } else {
      responseText = `📍 **${location}** Weather Report:\n\n• 🌡️ **Temperature:** ${temp}°C (High: ${maxTemp}°C / Low: ${minTemp}°C)\n• 🌧️ **Baarish Chance:** ${rainProb}%\n• 💧 **Humidity:** ${humidity}%\n• 💨 **Wind:** ${windSpeed} km/h\n\n👉 ${outfitTip}\n${carryUmbrella ? '👉 Chhata saath me rakhein.' : '👉 Outside activities ke liye mausam acha hai.'}\n\n${foodTip}`;
      speechText = `${location} me temperature ${temp} degree celsius hai. Rain probability ${rainProb} percent hai. ${outfitTip} ${speechFood}`;
    }

    return {
      text: responseText,
      speechText: speechText,
      umbrellaNeeded: carryUmbrella,
      rainProbability: rainProb,
      temperature: temp,
      maxTemp: maxTemp,
      minTemp: minTemp,
      location: location,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  handleVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition API supported in Chrome browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;

    this.micBtn.classList.add('animate-pulse', 'bg-red-500');

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (this.inputField) {
        this.inputField.value = transcript;
        this.handleSendMessage();
      }
    };

    recognition.onerror = () => {
      this.micBtn.classList.remove('animate-pulse', 'bg-red-500');
    };

    recognition.onend = () => {
      this.micBtn.classList.remove('animate-pulse', 'bg-red-500');
    };

    recognition.start();
  }

  cleanTextForSpeech(text) {
    if (!text) return '';
    return text
      .replace(/\s*\([\d\.\s°NSEW,′'-]+\)/gi, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/°C/g, ' degree celsius ')
      .replace(/%/g, ' percent ')
      .replace(/km\/h/g, ' kilometer per hour ')
      .replace(/AQI/g, ' Air Quality Index ')
      .replace(/UV/gi, ' UV Index ')
      .replace(/[\n\r]+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const clean = this.cleanTextForSpeech(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();
    const selectedValue = this.voiceSelect ? this.voiceSelect.value : 'auto';

    let chosenVoice = null;

    if (selectedValue !== 'auto' && selectedValue !== 'hi-IN' && selectedValue !== 'en-IN') {
      chosenVoice = voices.find(v => v.name === selectedValue);
    }

    if (!chosenVoice) {
      if (selectedValue === 'en-IN' || selectedValue === 'auto') {
        // High quality Indian English / natural Hinglish synthesizers
        chosenVoice = voices.find(v => v.lang === 'en-IN' || v.name.includes('Google Indian English') || v.name.includes('Neerja') || v.name.includes('Prabhat')) ||
                      voices.find(v => v.lang.startsWith('hi')) ||
                      voices.find(v => v.lang.includes('IN'));
      } else if (selectedValue === 'hi-IN') {
        chosenVoice = voices.find(v => v.lang.startsWith('hi') || v.name.includes('Google हिन्दी') || v.name.includes('Kalpana') || v.name.includes('Hemant')) ||
                      voices.find(v => v.lang === 'en-IN');
      }
    }

    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    } else {
      utterance.lang = selectedValue === 'hi-IN' ? 'hi-IN' : 'en-IN';
    }

    utterance.rate = 1.04;
    utterance.pitch = 1.02;

    window.speechSynthesis.speak(utterance);
  }

  appendMessage(sender, text) {
    if (!this.chatContainer) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex w-full mb-4 ${sender === 'user' ? 'justify-end' : 'justify-start'}`;

    if (sender === 'user') {
      msgDiv.innerHTML = `
        <div class="chat-bubble-user px-4 py-3 max-w-[80%] text-sm md:text-base leading-relaxed">
          <p>${this.escapeHtml(text)}</p>
        </div>
      `;
    } else {
      msgDiv.innerHTML = `
        <div class="flex gap-3 max-w-[85%]">
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg">
            <i data-lucide="bot" class="w-4 h-4"></i>
          </div>
          <div class="chat-bubble-bot px-4 py-3 text-sm md:text-base leading-relaxed">
            <p>${this.formatMarkdown(text)}</p>
          </div>
        </div>
      `;
    }

    this.chatContainer.appendChild(msgDiv);
    if (window.lucide) lucide.createIcons();
    this.scrollToBottom();
  }

  appendBotResponseCard(data) {
    if (!this.chatContainer) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex w-full mb-4 justify-start';

    const isUmbrella = data.umbrellaNeeded;

    msgDiv.innerHTML = `
      <div class="flex gap-3 max-w-[90%] md:max-w-[80%]">
        <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg border border-blue-400/30">
          <i data-lucide="sparkles" class="w-5 h-5 text-amber-300"></i>
        </div>
        <div class="chat-bubble-bot p-4 text-sm md:text-base leading-relaxed w-full space-y-3">
          <div class="whitespace-pre-line text-slate-100">${this.formatMarkdown(data.text)}</div>

          <div class="mt-3 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs md:text-sm">
            <div class="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50 flex items-center gap-2">
              <i data-lucide="${isUmbrella ? 'umbrella' : 'sun'}" class="${isUmbrella ? 'text-amber-400' : 'text-amber-300'} w-5 h-5"></i>
              <div>
                <div class="text-slate-400 text-[10px] uppercase font-semibold">Umbrella Advisory</div>
                <div class="font-bold text-slate-200">${isUmbrella ? 'Chhata Saath Rakhein ☔' : 'No Umbrella Needed ☀️'}</div>
              </div>
            </div>
            
            <div class="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50 flex items-center gap-2">
              <i data-lucide="cloud-rain" class="text-sky-400 w-5 h-5"></i>
              <div>
                <div class="text-slate-400 text-[10px] uppercase font-semibold">Rain Prob</div>
                <div class="font-bold text-sky-300">${data.rainProbability}% Chance</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.chatContainer.appendChild(msgDiv);
    if (window.lucide) lucide.createIcons();
    this.scrollToBottom();
  }

  showTypingIndicator() {
    if (!this.chatContainer) return null;
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = id;
    typingDiv.className = 'flex w-full mb-4 justify-start';
    typingDiv.innerHTML = `
      <div class="flex gap-3 items-center">
        <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700">
          <i data-lucide="bot" class="w-4 h-4 animate-spin"></i>
        </div>
        <div class="chat-bubble-bot px-4 py-2 text-slate-400 text-xs flex items-center gap-1.5">
          <span>WeatherGPT soch raha hai</span>
          <span class="animate-bounce">.</span>
          <span class="animate-bounce delay-100">.</span>
          <span class="animate-bounce delay-200">.</span>
        </div>
      </div>
    `;
    this.chatContainer.appendChild(typingDiv);
    if (window.lucide) lucide.createIcons();
    this.scrollToBottom();
    return id;
  }

  removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  scrollToBottom() {
    if (this.chatContainer) {
      this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
  }

  setLanguage(lang) {
    this.language = lang;
  }

  formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-300 font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  }
}

window.WeatherChat = null;
window.AIChatApp = null;
document.addEventListener('DOMContentLoaded', () => {
  const chatClient = new WeatherGPTChatClient();
  window.WeatherChat = chatClient;
  window.AIChatApp = chatClient;
});
