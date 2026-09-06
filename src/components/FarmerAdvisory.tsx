'use client';

import React from 'react';
import { Sprout, Droplet, Shield, AlertTriangle } from 'lucide-react';
import { CurrentWeather, Language } from '@/types/weather';
import { getFarmerAdvisory } from '@/lib/suggestions';
import { t } from '@/lib/i18n';

interface FarmerAdvisoryProps {
  current: CurrentWeather;
  precipitationSum?: number;
  lang: Language;
}

export const FarmerAdvisoryCard: React.FC<FarmerAdvisoryProps> = ({
  current,
  precipitationSum = 0,
  lang,
}) => {
  const advisory = getFarmerAdvisory(current, precipitationSum, lang);

  return (
    <div className="glass-panel p-5 border border-emerald-500/30">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{t('farmerAdvisory', lang)}</h3>
            <p className="text-xs text-slate-400">Crop, irrigation & pest risk management</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
          Smart AgTech
        </span>
      </div>

      {advisory.alertNote && (
        <div className="mb-4 p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span className="font-medium">{advisory.alertNote}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 mb-1">
            <Droplet className="w-4 h-4" /> Irrigation Advice
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">{advisory.irrigation}</p>
        </div>

        <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-300 mb-1">
            <Sprout className="w-4 h-4" /> Crop Management
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">{advisory.cropCare}</p>
        </div>

        <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300 mb-1">
            <Shield className="w-4 h-4" /> Pest & Disease Risk
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">{advisory.pestRisk}</p>
        </div>
      </div>
    </div>
  );
};
