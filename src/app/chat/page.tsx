'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Send, Bot, User, ArrowLeft, Volume2, Sparkles, Loader2, Thermometer, Wind, Droplets } from 'lucide-react';
import { ChatMessage, Language } from '@/types/weather';
import { speakText } from '@/lib/tts';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Namaste! I am WeatherGPT Assistant. Ask me about weather conditions in any Indian district or global city, or compare temperatures between multiple cities (e.g. "Compare Gwalior and Leh").',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<Language>('en');

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, lang }),
      });

      const data = await res.json();

      if (res.ok) {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          weatherData: data.weatherData,
          cities: data.cities,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (e) {
      console.error('Chat request error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="px-4 py-3 bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-slate-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base">WeatherGPT AI Assistant</h1>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" /> Real-Time Open-Meteo Engine
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setLang((prev) => (prev === 'en' ? 'hi' : 'en'))}
          className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl transition text-amber-300"
        >
          {lang === 'en' ? 'हिन्दी' : 'English'}
        </button>
      </header>

      {/* Messages Thread */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl h-fit border border-emerald-500/30">
                <Bot className="w-5 h-5" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-900/40'
                  : 'glass-panel text-slate-100 rounded-bl-none border border-white/15'
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-1">
                <span className="text-[10px] opacity-70 font-semibold uppercase">
                  {msg.sender === 'user' ? 'You' : 'WeatherGPT AI'}
                </span>
                <span className="text-[10px] opacity-50">{msg.timestamp}</span>
              </div>

              <p className="whitespace-pre-line">{msg.text}</p>

              {/* Multi-City Weather Data Cards if returned */}
              {msg.weatherData && msg.weatherData.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/10">
                  {msg.weatherData.map((w, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs"
                    >
                      <div className="font-bold text-white text-sm mb-1">{w.location.name}</div>
                      <div className="text-lg font-extrabold text-blue-300 mb-2">
                        {w.current.temperature}°C <span className="text-xs font-normal text-slate-300">({w.current.condition})</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300 text-[11px]">
                        <span>Humidity: {w.current.relative_humidity}%</span>
                        <span>AQI: {w.airQuality.aqi}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {msg.sender === 'assistant' && (
                <button
                  onClick={() => speakText(msg.text, lang)}
                  className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Listen Response
                </button>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="p-2 bg-blue-600/30 text-blue-300 rounded-xl h-fit border border-blue-400/40">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-xs text-slate-400 p-4 glass-panel max-w-xs rounded-2xl">
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>Querying satellite climate models...</span>
          </div>
        )}
      </main>

      {/* Input Bar */}
      <footer className="p-4 bg-slate-900/90 border-t border-white/10 sticky bottom-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              lang === 'hi'
                ? 'मौसम या शहरों की तुलना के बारे में पूछें (जैसे: भोपाल और दिल्ली का मौसम)...'
                : 'Ask about weather in any city or district (e.g. "Rain in Gwalior tomorrow")...'
            }
            className="flex-1 px-4 py-3 text-sm glass-input placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl shadow-lg transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
