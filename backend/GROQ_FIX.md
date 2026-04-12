# Groq API 404 Error Fix

## Issue
Getting `404 Not Found` error when calling Groq API, even though API key is correct.

## Root Cause
The httpx client with `base_url` was not correctly constructing the full URL. The issue was with how the relative path `/chat/completions` was being combined with the base URL.

## Solution Applied

1. **Added Groq SDK** (`groq>=0.4.0`) to `requirements.txt` - This is the official Groq Python SDK and is the recommended way to use Groq API.

2. **Updated LLM Service** to:
   - Try to use Groq SDK first (if available)
   - Fallback to httpx with **full URL** instead of base_url + relative path
   - Better error messages for 404 errors (model name issues)

3. **Fixed httpx calls** to use the complete URL: `https://api.groq.com/openai/v1/chat/completions`

## Installation

Install the Groq SDK:

```bash
cd backend
pip install groq>=0.4.0
```

Or install all requirements:

```bash
pip install -r requirements.txt
```

## Verification

After installing and restarting, you should see:

```
✅ Groq client initialized successfully (PRIMARY) - Using Groq SDK
```

Or if SDK is not available:

```
✅ Groq client initialized successfully (PRIMARY) - Using httpx
```

## Testing

Send a chat message and check the logs. You should no longer see 404 errors.

## Model Names

If you still get 404 errors, verify your model name in `backend/utils/config.py`:

```python
groq_model: str = "llama-3-8b-8192"  # Default
```

Valid Groq model names:
- `llama-3-8b-8192` ✅
- `llama-3-70b-8192` ✅
- `mixtral-8x7b-32768` ✅

## Next Steps

1. Install Groq SDK: `pip install groq>=0.4.0`
2. Restart server: `uvicorn main:app --reload`
3. Test chat functionality
4. Check logs for successful API calls

