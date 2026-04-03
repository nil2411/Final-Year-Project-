"""
Language detection and utility functions
Supports: en, hi, mr, gu, pa, ta
"""
from typing import Optional
import re

# Supported language codes
SUPPORTED_LANGUAGES = ["en", "hi", "mr", "gu", "pa", "ta"]

# Unicode ranges for different scripts
DEVANAGARI_RANGE = r'[\u0900-\u097F]'  # Hindi, Marathi
GUJARATI_RANGE = r'[\u0A80-\u0AFF]'     # Gujarati
GURMUKHI_RANGE = r'[\u0A00-\u0A7F]'     # Punjabi
TAMIL_RANGE = r'[\u0B80-\u0BFF]'        # Tamil

# Language-specific indicators
MARATHI_INDICATORS = ['आहे', 'मी', 'तू', 'आम्ही', 'तुम्ही', 'काय', 'कसे', 'आणि', 'पण', 'म्हणून']
HINDI_INDICATORS = ['है', 'मैं', 'तू', 'हम', 'आप', 'क्या', 'कैसे', 'और', 'लेकिन', 'इसलिए']
GUJARATI_INDICATORS = ['છે', 'હું', 'તું', 'અમે', 'તમે', 'શું', 'કેવી', 'અને', 'પણ', 'તેથી']
PUNJABI_INDICATORS = ['ਹੈ', 'ਮੈਂ', 'ਤੂੰ', 'ਅਸੀਂ', 'ਤੁਸੀਂ', 'ਕੀ', 'ਕਿਵੇਂ', 'ਅਤੇ', 'ਪਰ', 'ਇਸਲਈ']
TAMIL_INDICATORS = ['உள்ளது', 'நான்', 'நீ', 'நாங்கள்', 'நீங்கள்', 'என்ன', 'எப்படி', 'மற்றும்', 'ஆனால்', 'எனவே']


def detect_language(text: str) -> str:
    """
    Enhanced language detection based on script and indicators
    Returns: 'en', 'hi', 'mr', 'gu', 'pa', or 'ta'
    """
    if not text or not text.strip():
        return "en"
    
    text_lower = text.lower()
    
    # Check for Tamil script
    if re.search(TAMIL_RANGE, text):
        return "ta"
    
    # Check for Gurmukhi script (Punjabi)
    if re.search(GURMUKHI_RANGE, text):
        return "pa"
    
    # Check for Gujarati script
    if re.search(GUJARATI_RANGE, text):
        return "gu"
    
    # Check for Devanagari script (Hindi/Marathi)
    if re.search(DEVANAGARI_RANGE, text):
        # Count indicators for each language
        marathi_count = sum(1 for indicator in MARATHI_INDICATORS if indicator in text)
        hindi_count = sum(1 for indicator in HINDI_INDICATORS if indicator in text)
        gujarati_count = sum(1 for indicator in GUJARATI_INDICATORS if indicator in text)
        punjabi_count = sum(1 for indicator in PUNJABI_INDICATORS if indicator in text)
        
        # Return language with highest indicator count
        counts = {
            "mr": marathi_count,
            "hi": hindi_count,
            "gu": gujarati_count,
            "pa": punjabi_count,
        }
        max_lang = max(counts, key=counts.get)  # type: ignore
        if counts[max_lang] > 0:
            return max_lang
        
        # Default to Hindi for Devanagari if no clear indicators
        return "hi"
    
    # Default to English for Latin script or unknown
    return "en"


def get_language_name(code: str) -> str:
    """Get language name from code"""
    lang_map = {
        "en": "English",
        "hi": "Hindi",
        "mr": "Marathi",
        "gu": "Gujarati",
        "pa": "Punjabi",
        "ta": "Tamil",
    }
    return lang_map.get(code, "English")


def validate_language(code: str) -> bool:
    """Validate language code"""
    return code in SUPPORTED_LANGUAGES


def normalize_language_code(code: str) -> str:
    """
    Normalize language code to supported backend languages
    Maps gu, pa, ta to hi (Hindi) for backend compatibility
    """
    # Backend LLM supports hi, mr, en
    # Map other languages to closest supported
    mapping = {
        "gu": "hi",  # Gujarati -> Hindi (both Devanagari-based)
        "pa": "hi",  # Punjabi -> Hindi
        "ta": "en",  # Tamil -> English (fallback)
    }
    return mapping.get(code, code) if code in mapping else code

