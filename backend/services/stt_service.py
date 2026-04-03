"""
Speech-to-Text Service using Whisper
"""
import io
import tempfile
from typing import Optional
import whisper

from utils.config import settings


class STTService:
    """Speech-to-Text service using Whisper"""
    
    def __init__(self):
        self.model = None
        self._initialize()
    
    def _initialize(self):
        """Initialize Whisper model"""
        try:
            print("Loading Whisper model...")
            # Use base model for faster loading (can be upgraded to medium/large)
            self.model = whisper.load_model("base")
            print("Whisper model loaded")
        except Exception as e:
            print(f"Error loading Whisper model: {e}")
            self.model = None
    
    async def transcribe(self, audio_data: bytes, language: Optional[str] = None) -> Optional[str]:
        """
        Transcribe audio to text
        """
        if not self.model:
            return None
        
        try:
            # Save audio to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
                tmp_file.write(audio_data)
                tmp_file_path = tmp_file.name
            
            try:
                # Transcribe
                result = self.model.transcribe(
                    tmp_file_path,
                    language=language if language else None,
                    task="transcribe"
                )
                
                return result["text"].strip()
            
            finally:
                # Clean up temp file
                import os
                if os.path.exists(tmp_file_path):
                    os.unlink(tmp_file_path)
        
        except Exception as e:
            print(f"Error transcribing audio: {e}")
            return None
    
    def detect_language(self, audio_data: bytes) -> Optional[str]:
        """
        Detect language from audio
        """
        if not self.model:
            return None
        
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
                tmp_file.write(audio_data)
                tmp_file_path = tmp_file.name
            
            try:
                # Detect language
                audio = whisper.load_audio(tmp_file_path)
                audio = whisper.pad_or_trim(audio)
                mel = whisper.log_mel_spectrogram(audio).to(self.model.device)
                
                _, probs = self.model.detect_language(mel)
                detected_lang = max(probs, key=probs.get)
                
                # Map Whisper language codes to our codes
                lang_map = {
                    "hi": "hi",
                    "mr": "mr",
                    "en": "en"
                }
                
                return lang_map.get(detected_lang, "en")
            
            finally:
                import os
                if os.path.exists(tmp_file_path):
                    os.unlink(tmp_file_path)
        
        except Exception as e:
            print(f"Error detecting language: {e}")
            return None


# Global instance
stt_service = STTService()

