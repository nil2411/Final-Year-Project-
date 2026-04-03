/**
 * Language Detection Utility
 * Detects language from text input for all supported languages
 * Supports: en, hi, mr, gu, pa, ta
 */

export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'gu' | 'pa' | 'ta';

// Unicode ranges for different scripts
const DEVANAGARI_RANGE = /[\u0900-\u097F]/;  // Hindi, Marathi
const GUJARATI_RANGE = /[\u0A80-\u0AFF]/;     // Gujarati
const GURMUKHI_RANGE = /[\u0A00-\u0A7F]/;     // Punjabi
const TAMIL_RANGE = /[\u0B80-\u0BFF]/;        // Tamil

// Language-specific indicators
const MARATHI_INDICATORS = ['आहे', 'मी', 'तू', 'आम्ही', 'तुम्ही', 'काय', 'कसे', 'आणि', 'पण', 'म्हणून'];
const HINDI_INDICATORS = ['है', 'मैं', 'तू', 'हम', 'आप', 'क्या', 'कैसे', 'और', 'लेकिन', 'इसलिए'];
const GUJARATI_INDICATORS = ['છે', 'હું', 'તું', 'અમે', 'તમે', 'શું', 'કેવી', 'અને', 'પણ', 'તેથી'];
const PUNJABI_INDICATORS = ['ਹੈ', 'ਮੈਂ', 'ਤੂੰ', 'ਅਸੀਂ', 'ਤੁਸੀਂ', 'ਕੀ', 'ਕਿਵੇਂ', 'ਅਤੇ', 'ਪਰ', 'ਇਸਲਈ'];
const TAMIL_INDICATORS = ['உள்ளது', 'நான்', 'நீ', 'நாங்கள்', 'நீங்கள்', 'என்ன', 'எப்படி', 'மற்றும்', 'ஆனால்', 'எனவே'];

/**
 * Detects the language of the input text
 * @param text - The text to detect language from
 * @returns Detected language code
 */
export function detectLanguage(text: string): SupportedLanguage {
  if (!text || !text.trim()) {
    return 'en';
  }

  // Check for Tamil script
  if (TAMIL_RANGE.test(text)) {
    return 'ta';
  }

  // Check for Gurmukhi script (Punjabi)
  if (GURMUKHI_RANGE.test(text)) {
    return 'pa';
  }

  // Check for Gujarati script
  if (GUJARATI_RANGE.test(text)) {
    return 'gu';
  }

  // Check for Devanagari script (Hindi/Marathi)
  if (DEVANAGARI_RANGE.test(text)) {
    // Count indicators for each language
    const marathiCount = MARATHI_INDICATORS.filter(indicator => text.includes(indicator)).length;
    const hindiCount = HINDI_INDICATORS.filter(indicator => text.includes(indicator)).length;
    const gujaratiCount = GUJARATI_INDICATORS.filter(indicator => text.includes(indicator)).length;
    const punjabiCount = PUNJABI_INDICATORS.filter(indicator => text.includes(indicator)).length;

    // Return language with highest indicator count
    const counts: Record<string, number> = {
      mr: marathiCount,
      hi: hindiCount,
      gu: gujaratiCount,
      pa: punjabiCount,
    };

    const maxLang = Object.entries(counts).reduce((a, b) => (counts[a[0]] > counts[b[0]] ? a : b))[0];
    
    if (counts[maxLang] > 0) {
      return maxLang as SupportedLanguage;
    }

    // Default to Hindi for Devanagari if no clear indicators
    return 'hi';
  }

  // Default to English for Latin script or unknown
  return 'en';
}

/**
 * Normalizes language code for backend compatibility
 * Maps gu, pa, ta to hi (Hindi) for backend compatibility
 * @param code - Language code to normalize
 * @returns Normalized language code
 */
export function normalizeLanguageCode(code: string): 'en' | 'hi' | 'mr' {
  const mapping: Record<string, 'en' | 'hi' | 'mr'> = {
    gu: 'hi',  // Gujarati -> Hindi (both Devanagari-based)
    pa: 'hi',  // Punjabi -> Hindi
    ta: 'en',  // Tamil -> English (fallback)
  };

  return mapping[code] || (code as 'en' | 'hi' | 'mr');
}

/**
 * Validates if a language code is supported
 * @param code - Language code to validate
 * @returns True if supported
 */
export function isValidLanguage(code: string): code is SupportedLanguage {
  return ['en', 'hi', 'mr', 'gu', 'pa', 'ta'].includes(code);
}

/**
 * Gets the language name from code
 * @param code - Language code
 * @returns Language name
 */
export function getLanguageName(code: string): string {
  const langMap: Record<string, string> = {
    en: 'English',
    hi: 'Hindi',
    mr: 'Marathi',
    gu: 'Gujarati',
    pa: 'Punjabi',
    ta: 'Tamil',
  };
  return langMap[code] || 'English';
}

