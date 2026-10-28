/**
 * speechService.js
 * Browser Web Speech API (window.speechSynthesis) wrapper.
 * - Language support: English, Tamil, Hindi, Malayalam, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, Urdu
 * - Fallback: Gracefully falls back to English when a specific regional voice package is missing on the client OS
 * - Provides play/stop controls, speech status callbacks, and elderly-friendly rate tuning (0.92x).
 */

export const isSpeechSynthesisSupported = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

export const getAvailableVoices = () => {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
};

/**
 * Maps app language code to BCP-47 speech tags
 */
const LANGUAGE_SPEECH_TAGS = {
  en: ['en-US', 'en-IN', 'en-GB'],
  ta: ['ta-IN', 'ta'],
  hi: ['hi-IN', 'hi'],
  ml: ['ml-IN', 'ml'],
  te: ['te-IN', 'te'],
  kn: ['kn-IN', 'kn'],
  bn: ['bn-IN', 'bn-BD'],
  mr: ['mr-IN', 'mr'],
  gu: ['gu-IN', 'gu'],
  pa: ['pa-IN', 'pa'],
  ur: ['ur-IN', 'ur-PK'],
  or: ['or-IN', 'or'],
  as: ['as-IN', 'as'],
  ne: ['ne-NP', 'ne-IN', 'ne'],
};

/**
 * Finds the best matching speech synthesis voice for a language code
 */
export const findBestVoice = (langCode = 'en') => {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const tags = LANGUAGE_SPEECH_TAGS[langCode] || ['en-US', 'en'];

  // Look for native voice match
  for (const tag of tags) {
    const matched = voices.find(
      (v) =>
        v.lang.toLowerCase() === tag.toLowerCase() ||
        v.lang.toLowerCase().startsWith(tag.toLowerCase().split('-')[0])
    );
    if (matched) return { voice: matched, fellBack: false, tag };
  }

  // Graceful fallback to default/English
  const englishVoice =
    voices.find((v) => v.lang === 'en-IN') ||
    voices.find((v) => v.lang.startsWith('en')) ||
    voices[0];

  return { voice: englishVoice, fellBack: langCode !== 'en', tag: 'en-US' };
};

/**
 * Speak text aloud with voice lookup and fallback handling
 */
export const speakText = ({
  text,
  lang = 'en',
  rate = 0.92, // Calm, clear tempo for accessible comprehension
  pitch = 1.0,
  onStart,
  onEnd,
  onError,
}) => {
  if (!isSpeechSynthesisSupported()) {
    if (onError) onError('Speech synthesis is not supported on this browser.');
    return { success: false, reason: 'unsupported' };
  }

  try {
    window.speechSynthesis.cancel(); // Stop stale utterances

    const utterance = new SpeechSynthesisUtterance(text);
    const voiceMatch = findBestVoice(lang);

    if (voiceMatch?.voice) {
      utterance.voice = voiceMatch.voice;
      utterance.lang = voiceMatch.fellBack ? 'en-US' : (voiceMatch.tag || 'en-US');
    } else {
      utterance.lang = lang;
    }

    utterance.rate = rate;
    utterance.pitch = pitch;

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    if (onError) utterance.onerror = onError;

    window.speechSynthesis.speak(utterance);
    return { success: true, fellBack: voiceMatch?.fellBack || false };
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    if (onError) onError(err);
    return { success: false, reason: err?.message };
  }
};

/**
 * Cancel ongoing speech playback
 */
export const stopSpeech = () => {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Builds localized reminder text for a scheduled dose
 */
export const buildMedicationReminderMessage = (med, langCode = 'en') => {
  const time = med.reminderTime || '8 AM';
  const name = med.name;
  const dose = med.dosage;
  const food = med.mealRelation || 'as prescribed';

  switch (langCode) {
    case 'ta':
      return `நேரம் ${time}. உங்கள் ${name}, அளவு ${dose}, ${food} எடுத்துக்கொள்ளவும்.`;
    case 'hi':
      return `समय ${time} है। कृपया अपनी दवा ${name}, खुराक ${dose}, ${food} लें।`;
    case 'ml':
      return `സമയം ${time}. ഡോക്ടർ നിർദ്ദേശിച്ച ${name}, ${dose} ${food} കഴിക്കുക.`;
    case 'te':
      return `సమయం ${time}. దయచేసి మీ మందు ${name}, మోతాదు ${dose}, ${food} తీసుకోండి.`;
    case 'kn':
      return `ಸಮಯ ${time}. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಔಷಧಿ ${name}, ಪ್ರಮಾಣ ${dose}, ${food} ತೆಗೆದುಕೊಳ್ಳಿ.`;
    case 'bn':
      return `সময় ${time}। আপনার ওষুধ ${name}, ডোজ ${dose}, ${food} গ্রহণ করুন।`;
    default:
      return `It is ${time}. Please take your prescribed medicine: ${name}, dose ${dose}, ${food}.`;
  }
};
