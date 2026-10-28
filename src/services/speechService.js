/**
 * speechService.js
 * Browser Speech Synthesis Service with:
 * - English & Tamil support
 * - Automatic graceful fallback to English if Tamil voice is unavailable in the host browser
 * - Cancellation of in-flight speech
 * - Accessible auditory prompts for medication reminders & confirmations
 */

export const isSpeechSynthesisSupported = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
};

export const getAvailableVoices = () => {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
};

/**
 * Speaks text using the browser speech synthesis API.
 * @param {string} text - The text to speak
 * @param {Object} options - Language, pitch, rate
 * @returns {Promise<boolean>}
 */
export const speakText = (text, { lang = 'en-US', rate = 0.95, pitch = 1.0 } = {}) => {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) {
      resolve(false);
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop prior speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;

      const voices = window.speechSynthesis.getVoices();

      if (lang === 'ta-IN') {
        // Look for Tamil voice (ta-IN or any with Tamil in name)
        const tamilVoice = voices.find(
          (v) => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil')
        );

        if (tamilVoice) {
          utterance.voice = tamilVoice;
          utterance.lang = tamilVoice.lang;
        } else {
          // Graceful fallback to English if Tamil voice not installed on OS/browser
          utterance.lang = 'en-US';
          console.warn('[SpeechService] Tamil voice unavailable on device. Gracefully falling back to English voice engine.');
        }
      } else {
        const enVoice = voices.find(
          (v) => (v.lang.startsWith('en') || v.lang.includes('US') || v.lang.includes('GB')) && !v.name.includes('Google')
        ) || voices.find((v) => v.lang.startsWith('en'));

        if (enVoice) {
          utterance.voice = enVoice;
        }
        utterance.lang = 'en-US';
      }

      utterance.onend = () => resolve(true);
      utterance.onerror = (e) => {
        console.warn('[SpeechService] Speech synthesis event error:', e);
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[SpeechService] Speech synthesis invocation failed:', err);
      resolve(false);
    }
  });
};

export const stopSpeech = () => {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Generates the reminder announcement text in the selected language.
 */
export const buildMedicationReminderText = (medicine, lang = 'en-US') => {
  const time = medicine.reminderTime || 'now';
  const name = medicine.name || 'medicine';
  const dose = medicine.dosage || '';
  const meal = medicine.mealRelation ? `(${medicine.mealRelation})` : '';

  if (lang === 'ta-IN') {
    return `வணக்கம். இது ${time}. தயவுசெய்து உங்கள் மருத்துவர் பரிந்துரைத்த ${name} ${dose} மருந்தை எடுத்துக்கொள்ளுங்கள். ${meal}`;
  }

  return `It is ${time}. Please take your prescribed medicine, ${name} ${dose}, ${medicine.mealRelation || 'as prescribed'}.`;
};
