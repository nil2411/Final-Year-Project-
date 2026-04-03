# API Key Setup Guide

## Overview

KrishiBot supports **two LLM providers**:

1. **OpenAI (Primary)** - Uses GPT-4o-mini
2. **Groq (Fallback)** - Uses LLaMA 3 or Mixtral (faster, free tier available)

## Which API Key Should You Use?

### Option 1: OpenAI Only (Recommended)
- **Best quality responses**
- **Cost**: Pay-per-use (very affordable with GPT-4o-mini)
- **Setup**: Add `OPENAI_API_KEY` to `.env`

### Option 2: Groq Only
- **Free tier available** (up to 30 requests/minute)
- **Faster responses**
- **Setup**: Add `GROQ_API_KEY` to `.env`
- **Note**: You'll need to modify the code to use Groq as primary

### Option 3: Both (Best)
- **Primary**: OpenAI for best quality
- **Fallback**: Groq if OpenAI fails or rate-limited
- **Setup**: Add both keys to `.env`

## Setting Up API Keys

### Step 1: Get Your API Keys

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `sk-`)

**Groq:**
1. Go to https://console.groq.com/keys
2. Sign up or log in
3. Create a new API key
4. Copy the key

### Step 2: Add to `.env` File

Create or edit `backend/.env`:

```env
# OpenAI (Primary)
OPENAI_API_KEY=sk-your-actual-key-here

# Groq (Optional Fallback)
GROQ_API_KEY=gsk_your-actual-key-here
```

### Step 3: Verify Format

**Important:**
- ✅ **No spaces** around the `=` sign
- ✅ **No quotes** needed (but they're handled if present)
- ✅ **No trailing spaces** at end of line
- ✅ **One key per line**

**Correct:**
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Incorrect:**
```env
OPENAI_API_KEY = sk-proj-...  # ❌ Spaces around =
OPENAI_API_KEY="sk-proj-..."  # ⚠️ Quotes work but not needed
OPENAI_API_KEY=sk-proj-...    # ❌ Trailing space
```

### Step 4: Restart Server

After adding the key, restart the server:

```bash
# Stop current server (Ctrl+C)
cd backend
uvicorn main:app --reload
```

### Step 5: Verify Loading

Look for these messages in the startup logs:

**Success:**
```
✅ OPENAI_API_KEY found in file: sk-proj-...
✅ OpenAI API Key Loaded in Settings: sk-proj-...
✅ OpenAI client initialized successfully
```

**Failure:**
```
❌ OPENAI_API_KEY not found in .env file
❌ OpenAI API Key NOT loaded in Settings
```

## Troubleshooting

### Issue: Key Not Loading Despite Being in `.env`

**Possible Causes:**

1. **File Encoding (BOM)**
   - Windows sometimes adds BOM to UTF-8 files
   - **Fix**: The code now handles this automatically with `utf-8-sig` encoding

2. **Whitespace Issues**
   - Extra spaces or tabs
   - **Fix**: Ensure no spaces around `=`, no trailing spaces

3. **File Location**
   - `.env` must be in `backend/` directory
   - **Fix**: Verify file is at `backend/.env`

4. **File Format**
   - Must be plain text, not saved as Word doc or RTF
   - **Fix**: Use a text editor (VS Code, Notepad++, etc.)

### Test Your `.env` File

Run the diagnostic script:

```bash
cd backend
python test_env_loading.py
```

This will show:
- If the file exists
- If the key is found
- If Pydantic can load it
- Any encoding issues

### Manual Verification

Check the file directly:

```bash
cd backend
# Windows PowerShell
Get-Content .env

# Windows CMD
type .env

# Linux/Mac
cat .env
```

You should see:
```
OPENAI_API_KEY=sk-proj-...
```

## Current Status

The backend now has **multiple fallback mechanisms**:

1. **Pydantic Settings** (primary) - Loads from `.env` automatically
2. **Manual File Reading** (fallback) - Reads `.env` directly if Pydantic fails
3. **Environment Variables** (fallback) - Checks system environment variables
4. **UTF-8-SIG Encoding** - Handles Windows BOM issues
5. **Quote Stripping** - Removes quotes if present
6. **Whitespace Trimming** - Removes leading/trailing spaces

## Next Steps

1. **Add your API key** to `backend/.env`
2. **Restart the server**
3. **Check startup logs** for confirmation
4. **Test with**: `curl http://localhost:8000/health`
5. **Try a chat**: Send a message through the frontend

## Need Help?

If the key still doesn't load:
1. Run `python backend/test_env_loading.py`
2. Check the startup logs for detailed error messages
3. Verify the `.env` file format matches the examples above
4. Try setting the environment variable directly:
   ```powershell
   # Windows PowerShell
   $env:OPENAI_API_KEY="sk-your-key-here"
   uvicorn main:app --reload
   ```

