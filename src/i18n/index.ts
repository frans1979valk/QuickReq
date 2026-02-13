import { en } from './en';
import { nl } from './nl';

export type Language = 'en' | 'nl';
export type TranslationKey = keyof typeof en;

const translations = { en, nl };

let currentLanguage: Language = 'en';

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
};

export const getCurrentLanguage = (): Language => {
  const saved = localStorage.getItem('language') as Language;
  return saved && translations[saved] ? saved : 'en';
};

export const t = (key: TranslationKey, params?: Record<string, string>): string => {
  let text = translations[currentLanguage][key] || translations.en[key] || key;
  
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{${param}}`, value);
    });
  }
  
  return text;
};

// Initialize language on load
currentLanguage = getCurrentLanguage();