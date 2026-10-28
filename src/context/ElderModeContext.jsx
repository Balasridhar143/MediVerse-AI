import React, { createContext, useContext, useState, useEffect } from 'react';

const ElderModeContext = createContext(null);

export const ElderModeProvider = ({ children }) => {
  const [elderMode, setElderMode] = useState(() => {
    try {
      const saved = localStorage.getItem('pulsecare_elder_mode');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('pulsecare_language') || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pulsecare_elder_mode', elderMode.toString());
      if (elderMode) {
        document.documentElement.classList.add('elder-mode');
      } else {
        document.documentElement.classList.remove('elder-mode');
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [elderMode]);

  useEffect(() => {
    try {
      localStorage.setItem('pulsecare_language', language);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [language]);

  const toggleElderMode = () => setElderMode((prev) => !prev);

  return (
    <ElderModeContext.Provider
      value={{
        elderMode,
        setElderMode,
        toggleElderMode,
        language,
        setLanguage,
      }}
    >
      {children}
    </ElderModeContext.Provider>
  );
};

export const useElderMode = () => {
  const context = useContext(ElderModeContext);
  if (!context) {
    return {
      elderMode: false,
      setElderMode: () => {},
      toggleElderMode: () => {},
      language: 'en',
      setLanguage: () => {},
    };
  }
  return context;
};
