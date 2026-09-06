'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Shield, Info } from 'lucide-react';
import { WeatherAlert, Language } from '@/types/weather';
import { getDisasterSafetyTips } from '@/lib/suggestions';
import { t } from '@/lib/i18n';

interface AlertModalProps {
  alerts: WeatherAlert[];
  weatherCode: number;
  lang: Language;
}

export const AlertModal: React.FC<AlertModalProps> = ({ alerts, weatherCode, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const activeAlert = alerts.find((a) => !dismissedAlerts.includes(a.id));

  useEffect(() => {
    if (activeAlert) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [activeAlert]);

  if (!isOpen || !activeAlert) return null;

  const safetyTips = getDisasterSafetyTips(weatherCode, lang);

  const handleDismiss = () => {
    setDismissedAlerts((prev) => [...prev, activeAlert.id]);
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg glass-panel p-6 border-red-500/50 shadow-2xl shadow-red-950/50 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-500/30 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/40 animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                {activeAlert.severity} WEATHER WARNING
              </span>
              <h2 className="text-lg font-bold text-white">{activeAlert.headline}</h2>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Description */}
        <p className="text-sm text-slate-200 leading-relaxed mb-4">{activeAlert.description}</p>

        <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200 mb-4">
          <span className="font-bold text-white block mb-1">Official Directive:</span>
          {activeAlert.instruction}
        </div>

        {/* Disaster Safety Tips */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>{t('disasterTips', lang)}</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300 pl-4 list-disc">
            {safetyTips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-xl shadow-lg transition"
        >
          Acknowledge & Dismiss Alert
        </button>
      </div>
    </div>
  );
};
