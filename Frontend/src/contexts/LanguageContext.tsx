import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { t as translate, changeLanguage, getInitialLanguage, setCurrentLanguage, Language } from '../i18n';
import { normalizeLanguageCode } from '../utils/languageDetection';

interface LanguageContextType {
  language: Language;
  currentLanguage: string; // For API calls (normalized)
  changeLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage());

  const handleLanguageChange = useCallback((lang: Language) => {
    changeLanguage(lang);
    setCurrentLanguage(lang);
    setLanguage(lang);
    // Store in localStorage for persistence
    localStorage.setItem('language', lang);
    localStorage.setItem('preferredLanguage', lang);
  }, []);

  const handleTranslate = useCallback((key: string, params?: Record<string, string | number>) => {
    return translate(key, params, language);
  }, [language]);

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = (localStorage.getItem('language') || localStorage.getItem('preferredLanguage')) as Language | null;
    if (savedLanguage && ['en', 'hi', 'mr', 'gu', 'pa', 'ta'].includes(savedLanguage)) {
      if (savedLanguage !== language) {
        setCurrentLanguage(savedLanguage);
        setLanguage(savedLanguage);
      }
    }
  }, []); // Only run on mount

  // Listen for language changes from other sources
  useEffect(() => {
    const handleLanguageChangeEvent = (event: CustomEvent) => {
      const newLang = event.detail.language as Language;
      if (newLang && newLang !== language) {
        setLanguage(newLang);
      }
    };

    window.addEventListener('languageChanged', handleLanguageChangeEvent as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChangeEvent as EventListener);
    };
  }, [language]);

  // Normalize language code for backend API calls
  const normalizedLanguage = normalizeLanguageCode(language);

  const value: LanguageContextType = {
    language,
    currentLanguage: normalizedLanguage, // Normalized for backend compatibility
    changeLanguage: handleLanguageChange,
    t: handleTranslate,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
 