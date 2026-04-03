const LIBRETRANSLATE_API = 'https://libretranslate.de';

export type Language = 'en' | 'hi' | 'mr' | 'gu' | 'pa' | 'ta';

// Map our language codes to LibreTranslate language codes
const languageMap: Record<Language, string> = {
  en: 'en',
  hi: 'hi',
  mr: 'mr',
  gu: 'gu',
  pa: 'pa',
  ta: 'ta'
};

// Cache for translations to avoid unnecessary API calls
const translationCache: Record<string, string> = {};

/**
 * Translate text using LibreTranslate API
 * @param text Text to translate
 * @param targetLang Target language code
 * @param sourceLang Source language code (default: 'en')
 * @returns Translated text
 */
export async function translateText(
  text: string,
  targetLang: Language,
  sourceLang: Language = 'en'
): Promise<string> {
  // Return original text if source and target languages are the same
  if (sourceLang === targetLang) {
    return text;
  }

  // Check cache first
  const cacheKey = `${sourceLang}-${targetLang}-${text}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  try {
    const response = await fetch(`${LIBRETRANSLATE_API}/translate`, {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: languageMap[sourceLang],
        target: languageMap[targetLang],
        format: 'text',
        api_key: '' // No API key needed for public instance
      }),
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Translation failed with status: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.translatedText;

    // Cache the translation
    if (translatedText) {
      translationCache[cacheKey] = translatedText;
    }

    return translatedText || text; // Return original text if translation fails
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
}

/**
 * Batch translate multiple texts
 * @param texts Array of texts to translate
 * @param targetLang Target language code
 * @param sourceLang Source language code (default: 'en')
 * @returns Array of translated texts
 */
export async function batchTranslateTexts(
  texts: string[],
  targetLang: Language,
  sourceLang: Language = 'en'
): Promise<string[]> {
  // Skip translation if source and target languages are the same
  if (sourceLang === targetLang) {
    return texts;
  }

  // Process translations in parallel
  const translationPromises = texts.map(text => 
    translateText(text, targetLang, sourceLang)
  );

  return Promise.all(translationPromises);
}
