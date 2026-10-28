import React from 'react';
import { useElderMode } from '../context/ElderModeContext';
import { Eye, Heart, Languages, Sparkles } from 'lucide-react';

/**
 * ElderModeToggle
 * Accessible toggle component for switching between Standard and Elder-Friendly Mode.
 * Designed with large high-contrast targets, clear state indication, and language selection.
 */
export default function ElderModeToggle({ className = '' }) {
  const { elderMode, toggleElderMode, language, setLanguage } = useElderMode();

  return (
    <div
      className={`flex items-center gap-2.5 p-1.5 rounded-xl border transition-all ${
        elderMode
          ? 'bg-amber-100/90 border-amber-300 text-slate-900 shadow-xs'
          : 'bg-slate-100/80 hover:bg-slate-200/70 border-slate-200 text-slate-700'
      } ${className}`}
    >
      {/* Toggle Button */}
      <button
        type="button"
        onClick={toggleElderMode}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
          elderMode
            ? 'bg-amber-600 text-white shadow-2xs'
            : 'bg-white text-slate-800 hover:text-slate-900 shadow-2xs'
        }`}
        aria-pressed={elderMode}
        title="Toggle Elder-Friendly Mode (Bigger text, higher contrast, simple view)"
      >
        <Eye className="w-4 h-4" />
        <span>Elder Mode: {elderMode ? 'ON' : 'OFF'}</span>
      </button>

      {/* Language Switch: English / Tamil */}
      <div className="flex items-center gap-1 bg-white/90 rounded-lg px-2 py-1 border border-slate-300">
        <Languages className="w-3.5 h-3.5 text-slate-500" />
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-1.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
            language === 'en'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          EN
        </button>
        <span className="text-slate-300 text-[10px]">•</span>
        <button
          type="button"
          onClick={() => setLanguage('ta')}
          className={`px-1.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
            language === 'ta'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          தமிழ்
        </button>
      </div>
    </div>
  );
}
