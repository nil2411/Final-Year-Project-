# Fix .env File Format

## Common Issue: Spaces Around `=`

If your Groq API key is not loading, check for **spaces around the `=` sign** in your `.env` file.

## ❌ Incorrect Format (with spaces):

```env
GROQ_API_KEY =YOUR_GROQ_API_KEY_HERE
GROQ_API_KEY= YOUR_GROQ_API_KEY_HERE
GROQ_API_KEY = YOUR_GROQ_API_KEY_HERE
```

## ✅ Correct Format (no spaces):

```env
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
```

## How to Fix

1. **Open** `backend/.env` file
2. **Remove all spaces** around the `=` sign
3. **Save** the file
4. **Restart** the server

## Example of Correct .env File

```env
# Groq API Key (PRIMARY - Required)
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE

# OpenAI API Key (Optional Fallback)
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
```

## Verification

After fixing and restarting, you should see:

```
📋 Found 2 environment variables in .env file
   → GROQ_API_KEY: gsk_7rs...
   → OPENAI_API_KEY: sk-proj...
✅ Groq API Key loaded manually from .env file (PRIMARY)
✅ Groq client initialized successfully (PRIMARY)
```

## Note

The updated code now **automatically handles spaces**, but it's still best practice to use the correct format without spaces.

