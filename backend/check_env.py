"""
Quick script to check if .env file is configured correctly
"""
from pathlib import Path
import os

BACKEND_DIR = Path(__file__).parent
ENV_FILE = BACKEND_DIR / ".env"

print("=" * 60)
print("KrishiBot Environment Check")
print("=" * 60)
print(f"Backend Directory: {BACKEND_DIR.absolute()}")
print(f"Environment File: {ENV_FILE.absolute()}")
print(f"File Exists: {ENV_FILE.exists()}")
print()

if ENV_FILE.exists():
    print("✅ .env file found!")
    print()
    print("Contents:")
    print("-" * 60)
    try:
        with open(ENV_FILE, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for i, line in enumerate(lines, 1):
                line = line.strip()
                if not line or line.startswith('#'):
                    print(f"{i:3}: {line}")
                elif 'API_KEY' in line or 'PASSWORD' in line or 'SECRET' in line:
                    # Mask sensitive values
                    if '=' in line:
                        key, value = line.split('=', 1)
                        if value.strip():
                            masked = value.strip()[:7] + '...' + value.strip()[-4:] if len(value.strip()) > 11 else '***'
                            print(f"{i:3}: {key}={masked}")
                        else:
                            print(f"{i:3}: {key}= (EMPTY)")
                    else:
                        print(f"{i:3}: {line}")
                else:
                    print(f"{i:3}: {line}")
        print("-" * 60)
        print()
        
        # Check for OPENAI_API_KEY
        with open(ENV_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'OPENAI_API_KEY' in content:
                for line in content.split('\n'):
                    if line.strip().startswith('OPENAI_API_KEY'):
                        key_value = line.split('=', 1)[1].strip() if '=' in line else ''
                        if key_value and key_value != '':
                            if key_value.startswith('sk-'):
                                print("✅ OPENAI_API_KEY is set and format looks correct")
                            else:
                                print("⚠️  OPENAI_API_KEY is set but format looks incorrect (should start with 'sk-')")
                        else:
                            print("❌ OPENAI_API_KEY is found but has no value")
                        break
                else:
                    print("❌ OPENAI_API_KEY not found in .env file")
            else:
                print("❌ OPENAI_API_KEY not found in .env file")
                print()
                print("Please add this line to your .env file:")
                print("OPENAI_API_KEY=sk-your-actual-key-here")
    except Exception as e:
        print(f"❌ Error reading .env file: {e}")
else:
    print("❌ .env file NOT found!")
    print()
    print("Please create a .env file in the backend directory with:")
    print()
    print("OPENAI_API_KEY=sk-your-actual-key-here")
    print()
    print("Get your API key from: https://platform.openai.com/api-keys")

print()
print("=" * 60)

