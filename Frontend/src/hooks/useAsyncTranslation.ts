import { useState, useEffect } from 'react';

export function useAsyncTranslation(t: (key: string, params?: Record<string, string | number>) => Promise<string>) {
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Error | null>(null);

  // Function to translate a single key
  const translate = async (key: string, params?: Record<string, string | number>): Promise<string> => {
    try {
      setLoading(prev => ({ ...prev, [key]: true }));
      const result = await t(key, params);
      setTranslations(prev => ({ ...prev, [key]: result }));
      return result;
    } catch (err) {
      setError(err as Error);
      return key; // Return the key as fallback
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Function to translate multiple keys at once
  const translateMany = async (keys: string[], paramsList?: Record<string, string | number>[]) => {
    try {
      keys.forEach(key => {
        setLoading(prev => ({ ...prev, [key]: true }));
      });
      
      const translations = await Promise.all(
        keys.map((key, index) => 
          t(key, paramsList ? paramsList[index] : undefined)
        )
      );
      
      const newTranslations = keys.reduce((acc, key, index) => ({
        ...acc,
        [key]: translations[index]
      }), {});
      
      setTranslations(prev => ({
        ...prev,
        ...newTranslations
      }));
      
      return translations;
    } catch (err) {
      setError(err as Error);
      return keys; // Return keys as fallback
    } finally {
      const resetLoading = keys.reduce((acc, key) => ({
        ...acc,
        [key]: false
      }), {});
      
      setLoading(prev => ({
        ...prev,
        ...resetLoading
      }));
    }
  };

  // Function to check if a translation is loading
  const isLoading = (key: string) => loading[key] === true;

  // Function to get a translation (synchronously if available)
  const getTranslation = (key: string, defaultValue: string = key): string => {
    return translations[key] || defaultValue;
  };

  // Function to preload translations
  const preloadTranslations = async (keys: string[]) => {
    const keysToLoad = keys.filter(key => !translations[key]);
    if (keysToLoad.length > 0) {
      await translateMany(keysToLoad);
    }
  };

  return {
    t: translate,
    translate,
    translateMany,
    getTranslation,
    isLoading,
    loading,
    error,
    preloadTranslations
  };
}
