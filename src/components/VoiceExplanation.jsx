import React, { useState } from 'react';
import {
  Volume2,
  Square,
  AlertCircle,
} from 'lucide-react';
import { speakText, stopSpeech, isSpeechSynthesisSupported } from '../utils/speechService';
import { getLanguageConfig } from '../utils/languageRegistry';

/**
 * VoiceExplanation
 * Clean audible speech trigger button with:
 * - Play / Stop toggle
 * - Active audio animation
 * - Multi-language voice lookup with graceful English fallback
 * - Unsupported browser notification
 */
export default function VoiceExplanation({
  text,
  language = 'en',
  label = 'Listen',
  className = '',
}) {
  const [speaking, setSpeaking] = useState(false);
  const [fellBackNotice, setFellBackNotice] = useState(false);

  const isSupported = isSpeechSynthesisSupported();

  const handleToggleSpeak = () => {
    if (!isSupported) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (speaking) {
      stopSpeech();
      setSpeaking(false);
      return;
    }

    setSpeaking(true);
    const result = speakText({
      text,
      lang: language,
      rate: 0.92,
      onStart: () => setSpeaking(true),
      onEnd: () => {
        setSpeaking(false);
        setFellBackNotice(false);
      },
      onError: () => {
        setSpeaking(false);
        setFellBackNotice(false);
      },
    });

    if (result.fellBack) {
      setFellBackNotice(true);
      setTimeout(() => setFellBackNotice(false), 5000);
    }
  };

  const langConfig = getLanguageConfig(language);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={handleToggleSpeak}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
          speaking
            ? 'bg-amber-600 text-white border-amber-700 animate-pulse'
            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
        }`}
        title={`Listen in ${langConfig.name} (Uses browser speech synthesis)`}
        aria-label="Listen to explanation"
      >
        {speaking ? (
          <>
            <Square className="w-3.5 h-3.5 text-white" />
            <span>Stop</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-teal-600" />
            <span>🔊 {label}</span>
          </>
        )}
      </button>

      {fellBackNotice && (
        <div className="absolute top-full right-0 mt-1.5 w-60 p-2 bg-slate-900 text-white rounded-lg text-[10px] z-50 shadow-md">
          {langConfig.name} voice pack not installed on this device. Playing in default system voice.
        </div>
      )}
    </div>
  );
}
