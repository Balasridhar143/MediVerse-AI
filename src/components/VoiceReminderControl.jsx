import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Languages,
  Play,
  Square,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  isSpeechSynthesisSupported,
  getAvailableVoices,
  speakText,
  stopSpeech,
} from '../utils/speechService';

/**
 * VoiceReminderControl
 * Dedicated speech synthesis control bar for Elder Care & Medication Safety.
 * Supports:
 * - Voice Reminder ON / OFF toggle
 * - Language selection: English (US/IN) or Tamil (தமிழ்)
 * - Automatic fallback notification if Tamil browser voice is missing
 * - "Test Voice Prompt" button with real-time speech indicator
 */
export default function VoiceReminderControl({
  voiceEnabled,
  onToggleVoice,
  voiceLang,
  onChangeLang,
}) {
  const [supported, setSupported] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fallbackWarning, setFallbackWarning] = useState(false);
  const [hasTamilVoice, setHasTamilVoice] = useState(false);

  useEffect(() => {
    const isSup = isSpeechSynthesisSupported();
    setSupported(isSup);

    if (isSup) {
      const checkVoices = () => {
        const voices = getAvailableVoices();
        const hasTa = voices.some(
          (v) =>
            v.lang.toLowerCase().includes('ta') ||
            v.name.toLowerCase().includes('tamil') ||
            v.lang === 'ta-IN'
        );
        setHasTamilVoice(hasTa);
      };

      checkVoices();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = checkVoices;
      }
    }
  }, []);

  const handleTestSpeech = () => {
    if (!voiceEnabled) return;

    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
      return;
    }

    const testText =
      voiceLang === 'ta-IN'
        ? 'இது காலை 8 மணி. மருத்துவர் பரிந்துரைத்தபடி உங்கள் காலை மருந்தை எடுத்துக்கொள்ளவும்.'
        : 'It is 8 AM. Please take your morning medicine as prescribed.';

    setIsPlaying(true);
    const result = speakText({
      text: testText,
      lang: voiceLang,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });

    if (result.fellBack) {
      setFallbackWarning(true);
      setTimeout(() => setFallbackWarning(false), 6000);
    }
  };

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Left: Icon & Description */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              voiceEnabled ? 'bg-teal-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-500'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm">
                🔊 Audible Voice Reminders (Speech Synthesis)
              </h4>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  voiceEnabled
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {voiceEnabled ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Audibly reads dose instructions when medication or appointment time arrives
            </p>
          </div>
        </div>

        {/* Right: Controls & Language Picker */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {voiceEnabled && (
            <>
              {/* Language Selection */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
                <Languages className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={voiceLang}
                  onChange={(e) => {
                    onChangeLang(e.target.value);
                    if (e.target.value === 'ta-IN' && !hasTamilVoice) {
                      setFallbackWarning(true);
                      setTimeout(() => setFallbackWarning(false), 6000);
                    }
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                  aria-label="Select voice language"
                >
                  <option value="en-US">English (Indian/US)</option>
                  <option value="ta-IN">Tamil (தமிழ்)</option>
                </select>
              </div>

              {/* Test Voice Prompt Button */}
              <button
                onClick={handleTestSpeech}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  isPlaying
                    ? 'bg-amber-600 text-white border-amber-700 animate-pulse'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Speaking...' : 'Test Voice'}</span>
              </button>
            </>
          )}

          {/* Master ON/OFF Button */}
          <button
            onClick={onToggleVoice}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
              voiceEnabled
                ? 'bg-teal-600 hover:bg-teal-700 text-white border-teal-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            Voice: {voiceEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Browser Support / Fallback Warning Notification */}
      {!supported && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Web Speech Synthesis is not supported on this browser. Voice prompts will be silent.
          </span>
        </div>
      )}

      {fallbackWarning && (
        <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-[11px] text-teal-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            Native Tamil speech voice not detected in your operating system. System gracefully fell back to default English pronunciation.
          </span>
        </div>
      )}
    </div>
  );
}
