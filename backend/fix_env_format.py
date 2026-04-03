"""
Script to fix .env file format issues (removes spaces around =)
"""
from pathlib import Path
import re

BACKEND_DIR = Path(__file__).parent
ENV_FILE = BACKEND_DIR / ".env"

def fix_env_file():
    """Fix spaces around = in .env file"""
    if not ENV_FILE.exists():
        print(f"❌ .env file not found at: {ENV_FILE}")
        return False
    
    print(f"📄 Reading .env file: {ENV_FILE}")
    
    # Read file
    try:
        with open(ENV_FILE, 'r', encoding='utf-8-sig') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"❌ Error reading .env file: {e}")
        return False
    
    # Fix lines
    fixed_lines = []
    changes_made = []
    
    for i, line in enumerate(lines, 1):
        original = line
        stripped = line.strip()
        
        # Skip empty lines and comments
        if not stripped or stripped.startswith('#'):
            fixed_lines.append(line)
            continue
        
        # Fix spaces around =
        if '=' in stripped:
            # Remove spaces around =
            fixed = re.sub(r'\s*=\s*', '=', stripped)
            if fixed != stripped:
                changes_made.append(f"Line {i}: '{stripped}' → '{fixed}'")
                fixed_lines.append(fixed + '\n')
            else:
                fixed_lines.append(line)
        else:
            fixed_lines.append(line)
    
    # Write back if changes were made
    if changes_made:
        print(f"\n✅ Found {len(changes_made)} line(s) with format issues:")
        for change in changes_made:
            print(f"   {change}")
        
        # Create backup
        backup_file = ENV_FILE.with_suffix('.env.backup')
        try:
            with open(backup_file, 'w', encoding='utf-8') as f:
                f.writelines(lines)
            print(f"\n💾 Backup created: {backup_file}")
        except Exception as e:
            print(f"⚠️  Could not create backup: {e}")
        
        # Write fixed file
        try:
            with open(ENV_FILE, 'w', encoding='utf-8') as f:
                f.writelines(fixed_lines)
            print(f"✅ Fixed .env file: {ENV_FILE}")
            print("\n📋 Fixed file contents:")
            print("=" * 60)
            for line in fixed_lines:
                if line.strip() and not line.strip().startswith('#'):
                    # Mask API keys
                    if 'API_KEY' in line:
                        parts = line.split('=', 1)
                        if len(parts) == 2:
                            key = parts[0].strip()
                            value = parts[1].strip()
                            if len(value) > 11:
                                masked = value[:7] + '...' + value[-4:]
                                print(f"{key}={masked}")
                            else:
                                print(line.rstrip())
                        else:
                            print(line.rstrip())
                    else:
                        print(line.rstrip())
            print("=" * 60)
            return True
        except Exception as e:
            print(f"❌ Error writing .env file: {e}")
            return False
    else:
        print("✅ No format issues found. .env file is correctly formatted.")
        return True

if __name__ == "__main__":
    print("=" * 60)
    print("🔧 .env File Format Fixer")
    print("=" * 60)
    print()
    
    if fix_env_file():
        print("\n✅ Done! Please restart your server:")
        print("   uvicorn main:app --reload")
    else:
        print("\n❌ Fix failed. Please check the errors above.")

