"""
Text-to-Speech Service
Supports gTTS and Coqui TTS for multilingual output
"""
import io
import os
from typing import Optional
from pathlib import Path

try:
    from gtts import gTTS
except ImportError:
    gTTS = None

try:
    from TTS.api import TTS
except ImportError:
    TTS = None

from utils.config import settings
from utils.audio_utils import save_audio_file


class TTSService:
    """Text-to-Speech service"""
    
    def __init__(self):
        self.tts_engine = settings.tts_engine.lower()
        self.coqui_tts = None
        self._initialize()
    
    def _initialize(self):
        """Initialize TTS engine"""
        if self.tts_engine == "coqui" and TTS:
            try:
                # Initialize Coqui TTS (supports more languages)
                self.coqui_tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")
                print("Coqui TTS initialized")
            except Exception as e:
                print(f"Error initializing Coqui TTS: {e}")
                self.tts_engine = "gtts"
        
        if self.tts_engine == "gtts" and not gTTS:
            print("Warning: gTTS not available, TTS will be disabled")
    
    def _get_language_code(self, lang: str) -> str:
        """Get TTS language code"""
        lang_map = {
            "hi": "hi",  # Hindi
            "mr": "mr",  # Marathi
            "en": "en"   # English
        }
        return lang_map.get(lang, "en")
    
    async def generate_speech(self, text: str, language: str) -> Optional[str]:
        """
        Generate speech audio from text
        Returns: URL to audio file
        """
        if not text or not text.strip():
            return None
        
        try:
            lang_code = self._get_language_code(language)
            
            if self.tts_engine == "coqui" and self.coqui_tts:
                return await self._generate_coqui(text, lang_code)
            elif self.tts_engine == "gtts" and gTTS:
                return await self._generate_gtts(text, lang_code)
            else:
                print("TTS engine not available")
                return None
        
        except Exception as e:
            print(f"Error generating speech: {e}")
            return None
    
    async def _generate_gtts(self, text: str, lang_code: str) -> Optional[str]:
        """Generate speech using gTTS"""
        try:
            # Create gTTS object
            tts = gTTS(text=text, lang=lang_code, slow=False)
            
            # Save to bytes buffer
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            audio_data = audio_buffer.read()
            
            # Save to file and return URL
            return await save_audio_file(audio_data, "mp3")
        
        except Exception as e:
            print(f"gTTS error: {e}")
            return None
    
    async def _generate_coqui(self, text: str, lang_code: str) -> Optional[str]:
        """Generate speech using Coqui TTS"""
        try:
            # Coqui TTS requires speaker embedding, using default
            output_path = Path(settings.audio_output_dir) / f"temp_{hash(text)}.wav"
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Generate speech
            self.coqui_tts.tts_to_file(
                text=text,
                file_path=str(output_path),
                language=lang_code
            )
            
            # Read file and save using our utility
            with open(output_path, "rb") as f:
                audio_data = f.read()
            
            # Delete temp file
            output_path.unlink()
            
            return await save_audio_file(audio_data, "wav")
        
        except Exception as e:
            print(f"Coqui TTS error: {e}")
            return None


# Global instance
tts_service = TTSService()

