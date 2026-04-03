"""
Test script to verify .env file loading
"""
import sys
from pathlib import Path

# Add backend to path
BACKEND_DIR = Path(__file__).parent
ENV_FILE = BACKEND_DIR / ".env"

print("=" * 60)
print("Testing .env File Loading")
print("=" * 60)
print(f"Backend Directory: {BACKEND_DIR}")
print(f"Environment File: {ENV_FILE}")
print(f"File Exists: {ENV_FILE.exists()}")
print()

if ENV_FILE.exists():
    print("Reading .env file with different encodings...")
    print()
    
    # Try utf-8
    print("1. Trying utf-8 encoding:")
    try:
        with open(ENV_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
            for i, line in enumerate(lines, 1):
                if 'OPENAI_API_KEY' in line:
                    print(f"   Line {i}: {line[:50]}...")
                    if '=' in line:
                        key, value = line.split('=', 1)
                        value = value.strip()
                        print(f"   ✅ Found key, value length: {len(value)}")
                        print(f"   ✅ Value starts with: {value[:7] if len(value) >= 7 else 'too short'}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    
    # Try utf-8-sig (handles BOM)
    print("2. Trying utf-8-sig encoding (handles BOM):")
    try:
        with open(ENV_FILE, 'r', encoding='utf-8-sig') as f:
            content = f.read()
            lines = content.split('\n')
            for i, line in enumerate(lines, 1):
                stripped = line.strip()
                if not stripped or stripped.startswith('#'):
                    continue
                if stripped.startswith('OPENAI_API_KEY'):
                    print(f"   Line {i}: {stripped[:50]}...")
                    if '=' in stripped:
                        key, value = stripped.split('=', 1)
                        value = value.strip()
                        # Remove quotes
                        if value.startswith('"') and value.endswith('"'):
                            value = value[1:-1]
                        elif value.startswith("'") and value.endswith("'"):
                            value = value[1:-1]
                        print(f"   ✅ Found key, value length: {len(value)}")
                        print(f"   ✅ Value starts with: {value[:7] if len(value) >= 7 else 'too short'}")
                        print(f"   ✅ Value ends with: ...{value[-4:] if len(value) >= 4 else 'too short'}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    print("3. Testing Pydantic Settings:")
    try:
        from utils.config import settings
        if settings.openai_api_key:
            masked = settings.openai_api_key[:7] + '...' + settings.openai_api_key[-4:] if len(settings.openai_api_key) > 11 else '***'
            print(f"   ✅ Pydantic loaded key: {masked}")
        else:
            print("   ❌ Pydantic did NOT load key")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()
else:
    print("❌ .env file not found!")
    print(f"   Expected: {ENV_FILE.absolute()}")

print()
print("=" * 60)

