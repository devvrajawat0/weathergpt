import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, LocationItem } from '../types';
import { sendChatMessage, searchLocations } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Send, Mic, MicOff, Bot, User, Sparkles, Volume2, RotateCcw, Loader2, MapPin, ArrowRight, Building2, Globe2 } from 'lucide-react';

interface ChatViewProps {
  currentLocation: LocationItem | null;
  initialPrompt?: string;
  onSelectLocation?: (location: LocationItem) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ currentLocation, initialPrompt, onSelectLocation }) => {
  const { speechEnabled } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello! I am **WeatherGPT** 🌤️, your conversational weather assistant.\n\nYou can ask me natural language questions for any district of India or world capital, like:\n- *"Will it rain in Delhi tomorrow?"*\n- *"What is the weather in Agra today?"*\n- *"Compare Delhi and Tokyo"*\n- *"What should I wear in Manali today?"*\n- *"Agricultural weather advice for Punjab farmers"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<LocationItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Handle initial prompt if redirected from Dashboard
  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  // Live Input Autocomplete Search
  useEffect(() => {
    let isCancelled = false;
    const fetchSuggestions = async () => {
      const text = input.trim();
      if (text.length >= 2) {
        try {
          const results = await searchLocations(text);
          if (!isCancelled) {
            setSuggestions(results.slice(0, 5));
            setShowSuggestions(results.length > 0);
          }
        } catch (e) {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
    return () => {
      isCancelled = true;
    };
  }, [input]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert("Web Speech API voice input is not supported in your browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('auto');

  // Fetch available Web Speech voices
  useEffect(() => {
    const updateVoices = () => {
      if (!('speechSynthesis' in window)) return;
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
    };

    updateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Clean Markdown symbols into natural spoken prose
  const sanitizeMarkdownForSpeech = (markdown: string): string => {
    return markdown
      .replace(/^#{1,6}\s+/gm, '') // Remove ### headings
      .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
      .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italics
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/\|/g, ', ') // Replace table separators with pauses
      .replace(/-{3,}/g, '')
      .replace(/^\s*[-+*]\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // High-Quality Human Voice Text-to-Speech Engine (Hindi, English, Hinglish)
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const cleanText = sanitizeMarkdownForSpeech(text);
    if (!cleanText) return;
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const available = voices.length > 0 ? voices : window.speechSynthesis.getVoices();

    // Check for Hindi Devanagari script or Hinglish words
    const isHindiOrHinglish = /[\u0900-\u097F]/.test(cleanText) || 
      /\b(mausam|baarish|barish|garmi|thand|hawa|aaj|kal|kaisa|kaisi|samay|temp|namaste)\b/i.test(cleanText);

    let chosenVoice: any = null;

    if (selectedVoiceURI !== 'auto') {
      chosenVoice = available.find((v: any) => v.voiceURI === selectedVoiceURI);
    }

    if (!chosenVoice) {
      if (isHindiOrHinglish) {
        chosenVoice = available.find((v: any) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')) ||
          available.find((v: any) => v.lang.includes('IN'));
      } else {
        chosenVoice = available.find((v: any) => v.name.includes('Natural') || v.name.includes('Google US English') || v.name.includes('Google UK English Female') || v.name.includes('Aria') || v.name.includes('Jenny')) ||
          available.find((v: any) => v.lang.startsWith('en')) ||
          available[0];
      }
    }

    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend?: string) => {
    const msgText = textToSend || input;
    if (!msgText.trim() || isSending) return;

    setShowSuggestions(false);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: msgText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsSending(true);

    try {
      const history = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));
      const response = await sendChatMessage(history, currentLocation);

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        locations: response.locations,
        weatherData: response.weatherData
      };

      setMessages(prev => [...prev, aiMessage]);

      if (speechEnabled) {
        speakText(response.reply);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ I encountered an error retrieving weather information. Please make sure your network connection is active.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-1',
        role: 'assistant',
        content: 'Conversation history reset. How can I help with weather forecasts or climate insights?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col glass-panel rounded-3xl border border-slate-700/60 shadow-2xl overflow-hidden relative">
      
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-lg shadow-md">
            🤖
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              WeatherGPT Conversational AI
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                700+ Districts & Capitals
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Natural Language Weather Assistant • All Indian Districts & Global Capitals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {voices.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                value={selectedVoiceURI}
                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer max-w-[170px] truncate"
                title="Select Voice & Language for Text-to-Speech"
              >
                <option value="auto" className="bg-slate-900 text-cyan-300 font-semibold">🌐 Auto-Detect Voice</option>
                <optgroup label="🇮🇳 Hindi & Hinglish">
                  {voices.filter((v: any) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')).map((v: any) => (
                    <option key={v.voiceURI} value={v.voiceURI} className="bg-slate-900 text-amber-300">
                      🇮🇳 {v.name.replace(/Microsoft|Google|Desktop/gi, '').trim()} ({v.lang})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🇮🇳 English (India)">
                  {voices.filter((v: any) => v.lang.includes('IN') && !v.lang.startsWith('hi')).map((v: any) => (
                    <option key={v.voiceURI} value={v.voiceURI} className="bg-slate-900 text-emerald-300">
                      🇮🇳 {v.name.replace(/Microsoft|Google|Desktop/gi, '').trim()} ({v.lang})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🇺🇸 English (US)">
                  {voices.filter((v: any) => v.lang.includes('US')).map((v: any) => (
                    <option key={v.voiceURI} value={v.voiceURI} className="bg-slate-900 text-blue-300">
                      🇺🇸 {v.name.replace(/Microsoft|Google|Desktop/gi, '').trim()} ({v.lang})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🇬🇧 English (UK)">
                  {voices.filter((v: any) => v.lang.includes('GB')).map((v: any) => (
                    <option key={v.voiceURI} value={v.voiceURI} className="bg-slate-900 text-purple-300">
                      🇬🇧 {v.name.replace(/Microsoft|Google|Desktop/gi, '').trim()} ({v.lang})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌐 All System Voices">
                  {voices.map((v: any) => (
                    <option key={`all-${v.voiceURI}`} value={v.voiceURI} className="bg-slate-900 text-slate-300">
                      🗣️ {v.name.replace(/Microsoft|Google|Desktop/gi, '').trim()} ({v.lang})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          <button
            onClick={handleClearHistory}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-xs flex items-center gap-1.5"
            title="Reset Chat History"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs flex-shrink-0 ${
                  isUser
                    ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white'
                    : 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'glass-card text-slate-100 border border-slate-700/60'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {/* Optional Interactive Location Cards to sync with Dashboard */}
                {!isUser && msg.locations && msg.locations.length > 0 && onSelectLocation && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" /> View on Dashboard:
                    </span>
                    {msg.locations.map((loc) => (
                      <button
                        key={loc.id || loc.name}
                        onClick={() => onSelectLocation(loc)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm group"
                      >
                        <span>📍 Open {loc.name} Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Optional TTS Audio button for Assistant */}
                {!isUser && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    <button
                      onClick={() => speakText(msg.content)}
                      className="hover:text-cyan-400 flex items-center gap-1 transition"
                      title="Read aloud"
                    >
                      <Volume2 className="w-3 h-3" /> Read Aloud
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="glass-card px-4 py-2.5 rounded-2xl animate-pulse">
              Analyzing query & querying live weather API...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* District & Capital Suggestion Chips Banner */}
      <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/60 flex flex-col gap-2 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 scrollbar-thin">
          <div className="flex items-center gap-1 text-cyan-400 font-bold text-[11px] uppercase tracking-wider flex-shrink-0">
            <Building2 className="w-3.5 h-3.5" /> Indian Districts:
          </div>
          {['Gwalior', 'Manali', 'Wayanad', 'Jaipur', 'Shimla', 'Indore', 'Visakhapatnam', 'Leh'].map((dst) => (
            <button
              key={dst}
              onClick={() => handleSend(`weather in ${dst}`)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-600/30 hover:border-cyan-500/50 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              📍 {dst}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-thin">
          <div className="flex items-center gap-1 text-amber-400 font-bold text-[11px] uppercase tracking-wider flex-shrink-0">
            <Globe2 className="w-3.5 h-3.5" /> World Capitals:
          </div>
          {['Tokyo', 'London', 'Paris', 'Washington D.C.', 'Berlin', 'Ottawa', 'Canberra'].map((cap) => (
            <button
              key={cap}
              onClick={() => handleSend(`weather in ${cap}`)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-600/30 hover:border-amber-500/50 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              🌍 {cap}
            </button>
          ))}
          <button
            onClick={() => handleSend("Compare Delhi and Tokyo")}
            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-500/40 hover:to-blue-500/40 text-cyan-200 border border-cyan-500/40 transition font-semibold"
          >
            ⚔️ Compare Delhi & Tokyo
          </button>
          <button
            onClick={() => handleSend("Food and drink suggestions for Delhi weather")}
            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-600/30 to-orange-600/30 hover:from-amber-500/40 hover:to-orange-500/40 text-amber-200 border border-amber-500/40 transition font-semibold"
          >
            🍲 Food & Drink Pairings
          </button>
          <button
            onClick={() => handleSend("Do I need an umbrella or jacket in Gwalior today?")}
            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-500/40 hover:to-teal-500/40 text-emerald-200 border border-emerald-500/40 transition font-semibold"
          >
            🎒 Weather Essentials (Gwalior)
          </button>
        </div>
      </div>

      {/* Live Autocomplete Suggestions Floating Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-20 left-4 right-4 z-50 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden p-2 max-h-48 overflow-y-auto space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800">
            <span>District & Capital Suggestions</span>
            <span>Click to Query</span>
          </div>
          {suggestions.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                const queryText = `weather in ${item.name}`;
                setInput(queryText);
                setShowSuggestions(false);
                handleSend(queryText);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 group-hover:scale-110 transition-transform">
                  {item.type === 'capital' ? '🌍' : '📍'}
                </span>
                <div>
                  <span className="text-sm font-semibold text-white group-hover:text-cyan-300">
                    {item.name}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">
                    {item.state ? item.state : item.country ? item.country : ''}
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 uppercase">
                {item.type}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Input Box Bar */}
      <div className="p-4 bg-slate-900/90 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleListen}
            className={`p-3 rounded-2xl border transition ${
              isListening
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-cyan-400'
            }`}
            title={isListening ? "Listening... click to stop" : "Click to speak query"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder={isListening ? "Listening... speak now!" : "Type district or capital name (e.g. Gwalior, Tokyo, Jaipur)..."}
            className="flex-1 bg-slate-950/90 text-white placeholder-slate-500 text-sm rounded-2xl px-4 py-3 border border-slate-700/80 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

    </div>
  );
};
