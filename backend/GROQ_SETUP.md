# Groq API Setup Guide

## Overview

KrishiBot now uses **Groq as the primary LLM provider** instead of OpenAI. Groq offers:
- ⚡ **Faster responses** (up to 10x faster than OpenAI)
- 🆓 **Free tier** (30 requests/minute)
- 💰 **Cost-effective** (pay-as-you-go pricing)
- 🌍 **Same quality** for agriculture queries

## Quick Setup

### Step 1: Get Your Groq API Key

1. Go to https://console.groq.com/keys
2. Sign up or log in (free account)
3. Click "Create API Key"
4. Copy your API key (starts with `gsk_`)

### Step 2: Add to `.env` File

Open `backend/.env` and add:

```env
# Groq API Key (PRIMARY - Required)
GROQ_API_KEY=gsk_your-actual-key-here

# OpenAI API Key (Optional Fallback)
OPENAI_API_KEY=sk-your-key-here
```

**Important:**
- ✅ No spaces around `=`
- ✅ No quotes needed
- ✅ One key per line

### Step 3: Restart Server

```powershell
# Stop current server (Ctrl+C)
cd backend
uvicorn main:app --reload
```

### Step 4: Verify

Look for these messages in startup logs:

```
✅ GROQ_API_KEY found in file: gsk_...
✅ Groq API Key Loaded in Settings: gsk_... (PRIMARY)
✅ Groq client initialized successfully (PRIMARY)
```

## Current Configuration

- **Primary LLM**: Groq (LLaMA 3 8B)
- **Fallback LLM**: OpenAI (GPT-4o-mini) - optional
- **Model**: `llama-3-8b-8192` (can be changed in `backend/utils/config.py`)

## Available Groq Models

You can change the model in `backend/utils/config.py`:

```python
groq_model: str = "llama-3-8b-8192"  # Default
# Other options:
# - "llama-3-70b-8192" (larger, better quality)
# - "mixtral-8x7b-32768" (excellent for long context)
```

## Troubleshooting

### Issue: "Groq API key not found"

**Solution:**
1. Verify `.env` file is in `backend/` directory
2. Check key format: `GROQ_API_KEY=gsk_...` (no spaces)
3. Restart the server after adding the key

### Issue: "Rate limit exceeded"

**Solution:**
- Free tier: 30 requests/minute
- Wait a moment and try again
- Or upgrade to paid plan at https://console.groq.com

### Issue: "Invalid API key"

**Solution:**
1. Verify key starts with `gsk_`
2. Check for typos or extra spaces
3. Generate a new key from https://console.groq.com/keys

## Testing

Test the API:

```bash
curl http://localhost:8000/health
```

Look for:
```json
{
  "services": {
    "llm_groq": true,  // Should be true
    "llm_available": true
  },
  "configuration": {
    "llm_provider": "groq",
    "groq_api_key_loaded": true
  }
}
```

## Benefits of Groq

1. **Speed**: Responses are typically 5-10x faster than OpenAI
2. **Free Tier**: 30 requests/minute for free accounts
3. **Cost**: Very affordable pay-as-you-go pricing
4. **Quality**: LLaMA 3 provides excellent results for agriculture queries
5. **Reliability**: High uptime and consistent performance

## Migration from OpenAI

If you were using OpenAI before:
1. ✅ Add `GROQ_API_KEY` to `.env`
2. ✅ Restart server
3. ✅ Test chat functionality
4. ℹ️  You can keep `OPENAI_API_KEY` as fallback (optional)

The system will automatically:
- Use Groq for all requests (primary)
- Fall back to OpenAI only if Groq fails
- Show clear status in logs and `/health` endpoint

## Need Help?

- Groq Documentation: https://console.groq.com/docs
- Groq Discord: https://discord.gg/groq
- Check `/health` endpoint for detailed status

