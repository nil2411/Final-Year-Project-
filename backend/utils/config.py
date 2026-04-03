"""
Configuration management using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path
import os

# Get backend directory
BACKEND_DIR = Path(__file__).parent.parent
ENV_FILE = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    """Application settings"""
    
    # Groq (Primary LLM Provider)
    groq_api_key: Optional[str] = None
    groq_model: str = "llama-3.1-8b-instant"  # Current supported model (as of 2024)
    
    # Embedding
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # Vector DB
    vector_db: str = "faiss"
    
    # TTS
    tts_engine: str = "gTTS"
    
    # STT
    stt_engine: str = "whisper"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # Database (Optional)
    database_url: Optional[str] = None
    
    # Audio
    audio_output_dir: str = str(BACKEND_DIR / "static" / "audio")
    max_audio_size_mb: int = 10
    
    # RAG
    top_k: int = 5
    chunk_size: int = 1000
    chunk_overlap: int = 200
    
    class Config:
        # Try multiple ways to load the .env file
        env_file = str(ENV_FILE) if ENV_FILE.exists() else None
        env_file_encoding = 'utf-8-sig'  # utf-8-sig handles BOM (Byte Order Mark)
        case_sensitive = False
        # Also read from environment variables
        extra = 'ignore'


# Also check environment variables directly (for cases where .env isn't loaded)
import os
if not ENV_FILE.exists() and os.getenv('GROQ_API_KEY'):
    print("⚠️  .env file not found, but GROQ_API_KEY found in environment variables")

# Try to manually load from .env file if Pydantic didn't load it
def _manual_load_env():
    """Manually load .env file as fallback - handles spaces around ="""
    if not ENV_FILE.exists():
        return {}
    
    env_vars = {}
    try:
        with open(ENV_FILE, 'r', encoding='utf-8-sig') as f:  # utf-8-sig handles BOM
            for line_num, line in enumerate(f, 1):
                original_line = line
                line = line.strip()
                # Skip empty lines and comments
                if not line or line.startswith('#'):
                    continue
                # Parse KEY=VALUE (handles spaces: KEY = VALUE, KEY= VALUE, KEY =VALUE)
                if '=' in line:
                    # Split on first = only
                    parts = line.split('=', 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        value = parts[1].strip()
                        # Remove quotes if present
                        if value.startswith('"') and value.endswith('"'):
                            value = value[1:-1]
                        elif value.startswith("'") and value.endswith("'"):
                            value = value[1:-1]
                        # Remove any remaining whitespace
                        key = key.strip()
                        value = value.strip()
                        if key and value:
                            env_vars[key] = value
                        elif key and not value:
                            print(f"⚠️  Warning: Line {line_num} has key '{key}' but empty value")
                    else:
                        print(f"⚠️  Warning: Line {line_num} has malformed format: {original_line.strip()}")
                else:
                    print(f"⚠️  Warning: Line {line_num} missing '=' separator: {original_line.strip()}")
    except Exception as e:
        print(f"⚠️  Error reading .env file manually: {e}")
        import traceback
        traceback.print_exc()
    
    return env_vars

# Load settings
settings = Settings()

# If API keys not loaded, try manual load (ALWAYS run to catch .env issues)
if ENV_FILE.exists():
    manual_env = _manual_load_env()
    
    # Debug: Show what was found
    if manual_env:
        print(f"📋 Found {len(manual_env)} environment variables in .env file")
        for key in manual_env.keys():
            if 'API_KEY' in key:
                masked = manual_env[key][:7] + '...' + manual_env[key][-4:] if len(manual_env[key]) > 11 else '***'
                print(f"   → {key}: {masked}")
    
    # Load Groq API key (PRIMARY)
    if 'GROQ_API_KEY' in manual_env:
        if not settings.groq_api_key:
            settings.groq_api_key = manual_env['GROQ_API_KEY']
            print("✅ Groq API Key loaded manually from .env file (PRIMARY)")
        else:
            print("ℹ️  Groq API Key already loaded via Pydantic")
    else:
        print("⚠️  GROQ_API_KEY not found in .env file (check for spaces around =)")

# Log configuration status on import
def log_config_status():
    """Log configuration status for debugging"""
    print("=" * 60)
    print("KrishiBot Configuration Status")
    print("=" * 60)
    print(f"Backend Directory: {BACKEND_DIR}")
    print(f"Environment File: {ENV_FILE}")
    print(f"Environment File Exists: {ENV_FILE.exists()}")
    
    if ENV_FILE.exists():
        print(f"Environment File Path: {ENV_FILE.absolute()}")
        # Check if GROQ_API_KEY is in the file (PRIMARY)
        try:
            with open(ENV_FILE, 'r', encoding='utf-8-sig') as f:  # utf-8-sig handles BOM
                content = f.read()
                
                # Check for GROQ_API_KEY first
                if 'GROQ_API_KEY' in content:
                    lines = content.split('\n')
                    found_groq = False
                    for line in lines:
                        stripped = line.strip()
                        if not stripped or stripped.startswith('#'):
                            continue
                        if stripped.startswith('GROQ_API_KEY'):
                            found_groq = True
                            if '=' in stripped:
                                key_value = stripped.split('=', 1)[1].strip()
                                if key_value.startswith('"') and key_value.endswith('"'):
                                    key_value = key_value[1:-1]
                                elif key_value.startswith("'") and key_value.endswith("'"):
                                    key_value = key_value[1:-1]
                                
                                if key_value and key_value != '':
                                    masked_key = key_value[:7] + '...' + key_value[-4:] if len(key_value) > 11 else '***'
                                    print(f"✅ GROQ_API_KEY found in file: {masked_key}")
                                else:
                                    print("⚠️  GROQ_API_KEY found but is empty")
                            break
                    if not found_groq:
                        print("❌ GROQ_API_KEY not found in .env file")
                else:
                    print("❌ GROQ_API_KEY not found in .env file")
        except Exception as e:
            print(f"⚠️  Error reading .env file: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("⚠️  .env file not found!")
        print(f"   Expected location: {ENV_FILE.absolute()}")
        print("   Please create .env file with GROQ_API_KEY=your-key-here")
    
    # Check if API keys are loaded
    if settings.groq_api_key:
        masked_key = settings.groq_api_key[:7] + '...' + settings.groq_api_key[-4:] if len(settings.groq_api_key) > 11 else '***'
        print(f"✅ Groq API Key Loaded in Settings: {masked_key} (PRIMARY)")
    else:
        print("❌ Groq API Key NOT loaded in Settings (PRIMARY)")
        print("   Chat features will use GPT4All offline fallback")
        print("   Get your key from: https://console.groq.com/keys")
    
    print("=" * 60)

# Log on import (only if not in test mode)
if not os.getenv('TESTING'):
    log_config_status()

