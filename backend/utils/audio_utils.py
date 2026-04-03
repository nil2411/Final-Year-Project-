"""
Audio file utilities
"""
import os
import uuid
from pathlib import Path
from typing import Optional
import aiofiles
from utils.config import settings


async def save_audio_file(audio_data: bytes, extension: str = "mp3") -> str:
    """
    Save audio file and return relative URL
    """
    # Ensure directory exists
    audio_dir = Path(settings.audio_output_dir)
    audio_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    filename = f"{uuid.uuid4()}.{extension}"
    filepath = audio_dir / filename
    
    # Save file
    async with aiofiles.open(filepath, 'wb') as f:
        await f.write(audio_data)
    
    # Return URL path
    return f"/static/audio/{filename}"


def get_audio_path(url: str) -> Optional[Path]:
    """Get file path from URL"""
    if url.startswith("/static/audio/"):
        filename = url.replace("/static/audio/", "")
        return Path(settings.audio_output_dir) / filename
    return None


async def delete_audio_file(url: str) -> bool:
    """Delete audio file by URL"""
    filepath = get_audio_path(url)
    if filepath and filepath.exists():
        try:
            filepath.unlink()
            return True
        except Exception:
            return False
    return False

