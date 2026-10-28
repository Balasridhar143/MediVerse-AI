import React, { useState } from 'react';
import { Languages, AlertCircle } from 'lucide-react';
import { SUPPORTED_LANGUAGES, getLanguageConfig } from '../utils/languageRegistry';

/**
 * UniversalLanguageSelector
 * Accessible language dropdown supporting 14 Indian & Regional languages:
 * English, Tamil, Hindi, Malayalam, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, Urdu, Odia, Assamese, Nepali.
 * 
 * Safety & Honesty Constraint:
 * If user selects an unpopulated language (e.g. Odia/Assamese), displays an immediate,
 * honest notification: "This language is not currently available."
 */
export default function UniversalLanguageSelector({
  language,
  onChangeLanguage,
  className = '',
}) {
  const [unavailNotice, setUnavailNotice] = useState(false);

  const handleSelect = (code) => {
    const config = getLanguageConfig(code);
    if (!config.available) {
      setUnavailNotice(true);
      setTimeout(() => setUnavailNotice(false), 4500);
      return;
    }
    setUnavailNotice(false);
    onChangeLanguage(code);
  };

  const currentConfig = getLanguageConfig(language);

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="inline-flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
        <Languages className="w-3.5 h-3.5 text-teal-700 shrink-0" />
        <span className="font-bold text-slate-700 hidden sm:inline text-[11px] uppercase tracking-wider">
          Language:
        </span>
        <select
          value={language}
          onChange={(e) => handleSelect(e.target.value)}
          className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer text-xs"
          aria-label="Select Medical Language"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeName} ({lang.name}) {!lang.available ? '— Coming Soon' : ''}
            </option>
          ))}
        </select>
      </div>

      {unavailNotice && (
        <div className="absolute top-full right-0 mt-1.5 w-64 p-2 bg-amber-50 border border-amber-300 rounded-lg shadow-md text-[11px] text-amber-900 z-50 flex items-start gap-1.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>This language is not currently available. Retaining previous selection.</span>
        </div>
      )}
    </div>
  );
}
