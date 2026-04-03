"""
Translation Service - Handles multilingual translation
Supports Hindi, Marathi, and English using deep-translator or indic-transliteration
"""
from typing import Optional, Dict
import re

# Try to import translation libraries
try:
    from deep_translator import GoogleTranslator as DeepGoogleTranslator
    DEEP_TRANSLATOR_AVAILABLE = True
except ImportError:
    DEEP_TRANSLATOR_AVAILABLE = False
    DeepGoogleTranslator = None  # type: ignore
    print("Warning: deep-translator not available, translation will be limited")

try:
    from indic_transliteration import sanscript, transliterate
    INDIC_TRANSLITERATION_AVAILABLE = True
except ImportError:
    INDIC_TRANSLITERATION_AVAILABLE = False
    print("Warning: indic-transliteration not available")


class TranslatorService:
    """Service for translating text between languages"""
    
    def __init__(self):
        self.translator_cache: Dict[str, DeepGoogleTranslator] = {}
        self._initialize()
    
    def _initialize(self):
        """Initialize translation service"""
        if DEEP_TRANSLATOR_AVAILABLE:
            try:
                # Warm up translator cache for common directions
                self.translator_cache["hi->en"] = DeepGoogleTranslator(source="hi", target="en")
                self.translator_cache["mr->en"] = DeepGoogleTranslator(source="mr", target="en")
                self.translator_cache["auto->en"] = DeepGoogleTranslator(source="auto", target="en")
                self.translator_cache["en->hi"] = DeepGoogleTranslator(source="en", target="hi")
                self.translator_cache["en->mr"] = DeepGoogleTranslator(source="en", target="mr")
                print("✅ Translation service initialized (deep-translator)")
            except Exception as e:
                print(f"⚠️  Error initializing translator: {e}")
                self.translator_cache.clear()
    
    def _translate_with_deep_translator(self, text: str, source: str, target: str) -> Optional[str]:
        """Shared helper to perform translation using deep-translator"""
        if not DEEP_TRANSLATOR_AVAILABLE:
            return None
        
        # Normalize to lowercase ISO codes
        source = source or "auto"
        source = source.lower()
        target = target.lower()
        
        cache_key = f"{source}->{target}"
        try:
            translator = self.translator_cache.get(cache_key)
            if not translator:
                translator = DeepGoogleTranslator(source=source, target=target)
                self.translator_cache[cache_key] = translator
            return translator.translate(text)
        except Exception as e:
            print(f"Translation error ({source}->{target}): {e}")
            return None

    def detect_language(self, text: str) -> str:
        """
        Detect language of text
        
        Returns:
            Language code: 'hi', 'mr', or 'en'
        """
        # Check for Devanagari script (Hindi/Marathi)
        devanagari_pattern = re.compile(r'[\u0900-\u097F]')
        
        if devanagari_pattern.search(text):
            # Simple heuristic for Hindi vs Marathi
            marathi_indicators = ['आहे', 'मी', 'तू', 'आम्ही', 'तुम्ही', 'काय', 'कसे']
            hindi_indicators = ['है', 'मैं', 'तू', 'हम', 'आप', 'क्या', 'कैसे']
            
            marathi_count = sum(1 for indicator in marathi_indicators if indicator in text)
            hindi_count = sum(1 for indicator in hindi_indicators if indicator in text)
            
            if marathi_count > hindi_count:
                return "mr"
            return "hi"
        
        # Default to English for Latin script
        return "en"
    
    def translate_to_english(self, text: str, source_lang: Optional[str] = None) -> str:
        """
        Translate text to English (for LLM processing)
        
        Args:
            text: Text to translate
            source_lang: Source language code (auto-detect if None)
        
        Returns:
            Translated text in English
        """
        if not text or not text.strip():
            return text
        
        # If already English, return as-is
        detected = self.detect_language(text)
        if detected == "en":
            return text
        
        # If source_lang is English, return as-is
        if source_lang == "en":
            return text
        
        source = source_lang or detected
        
        translated = self._translate_with_deep_translator(text, source, "en")
        return translated if translated else text
    
    def translate_from_english(self, text: str, target_lang: str) -> str:
        """
        Translate text from English to target language
        
        Args:
            text: English text to translate
            target_lang: Target language code ('hi', 'mr', or 'en')
        
        Returns:
            Translated text in target language
        """
        if not text or not text.strip():
            return text
        
        # If target is English, return as-is
        if target_lang == "en":
            return text
        
        translated = self._translate_with_deep_translator(text, "en", target_lang)
        return translated if translated else text
    
    def translate(self, text: str, source_lang: Optional[str] = None, target_lang: str = "en") -> str:
        """
        Translate text between languages
        
        Args:
            text: Text to translate
            source_lang: Source language code (auto-detect if None)
            target_lang: Target language code
        
        Returns:
            Translated text
        """
        if not text or not text.strip():
            return text
        
        # Auto-detect source language if not provided
        if source_lang is None:
            source_lang = self.detect_language(text)
        
        # If same language, return as-is
        if source_lang == target_lang:
            return text
        
        translated = self._translate_with_deep_translator(text, source_lang, target_lang)
        return translated if translated else text
    
    def transliterate(self, text: str, from_script: str = "devanagari", to_script: str = "latin") -> str:
        """
        Transliterate text between scripts (e.g., Devanagari to Latin)
        
        Args:
            text: Text to transliterate
            from_script: Source script
            to_script: Target script
        
        Returns:
            Transliterated text
        """
        if not INDIC_TRANSLITERATION_AVAILABLE:
            return text
        
        try:
            return transliterate(text, from_script, to_script)
        except Exception as e:
            print(f"Transliteration error: {e}")
            return text


# Global instance
translator_service = TranslatorService()

