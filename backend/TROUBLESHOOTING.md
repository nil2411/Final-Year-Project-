# Troubleshooting Guide

## Chat Not Working - "I apologize, I'm unable to answer your question right now"

### Root Cause
The error message appears when the OpenAI API key is not properly configured or the API call fails.

### Quick Diagnosis

1. **Check if .env file exists:**
   ```bash
   cd backend
   python check_env.py
   ```

2. **Check health endpoint:**
   ```bash
   curl http://localhost:8000/health
   ```
   Look for:
   - `"openai_api_key_loaded": true/false`
   - `"openai_api_key_valid_format": true/false`
   - `"llm_openai": true/false`

3. **Check server logs:**
   When you start the server with `uvicorn main:app --reload`, you should see:
   - ✅ `OpenAI API Key: sk-...` (if key is loaded)
   - ❌ `OpenAI API Key: NOT FOUND` (if key is missing)

### Common Issues & Solutions

#### Issue 1: .env file not found
**Symptoms:**
- Server logs show "⚠️ .env file not found!"
- Health check shows `"env_file_exists": false`

**Solution:**
1. Create `.env` file in `backend/` directory
2. Add: `OPENAI_API_KEY=sk-your-actual-key-here`
3. Restart the server

#### Issue 2: API key not loaded
**Symptoms:**
- `.env` file exists but server logs show "❌ OpenAI API Key NOT loaded"
- Health check shows `"openai_api_key_loaded": false`

**Solution:**
1. Check `.env` file format:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```
   - No spaces around `=`
   - No quotes needed
   - Key should start with `sk-`

2. Verify file location:
   - File should be: `backend/.env`
   - Not: `backend/.env.txt` or `backend/env`

3. Restart server after changes

#### Issue 3: Invalid API key
**Symptoms:**
- Server logs show "❌ OpenAI API error: Invalid API key"
- Health check shows `"openai_api_key_valid_format": false`

**Solution:**
1. Verify your API key at: https://platform.openai.com/api-keys
2. Make sure key starts with `sk-`
3. Check if key has expired or been revoked
4. Generate a new key if needed

#### Issue 4: API key format incorrect
**Symptoms:**
- Server logs show "⚠️ Warning: OpenAI API key format looks incorrect"
- Key doesn't start with `sk-`

**Solution:**
1. OpenAI API keys must start with `sk-`
2. Check your `.env` file - remove any extra characters
3. Make sure you copied the full key

#### Issue 5: Rate limit or quota exceeded
**Symptoms:**
- Server logs show "Rate limit exceeded" or "Insufficient quota"
- Health check shows key is loaded but API calls fail

**Solution:**
1. Check your OpenAI account: https://platform.openai.com/account/usage
2. Wait a few minutes and try again
3. Upgrade your plan if needed

### Step-by-Step Fix

1. **Run the diagnostic script:**
   ```bash
   cd backend
   python check_env.py
   ```

2. **Check server startup logs:**
   Look for configuration status when server starts

3. **Test the health endpoint:**
   ```bash
   curl http://localhost:8000/health | python -m json.tool
   ```

4. **Verify .env file:**
   ```bash
   # Windows PowerShell
   Get-Content backend\.env
   
   # Linux/Mac
   cat backend/.env
   ```

5. **Restart the server:**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

### Expected Behavior

**When working correctly:**
- Server logs show: `✅ OpenAI API Key: sk-...` (format valid)
- Server logs show: `✅ OpenAI client initialized successfully`
- Health check shows: `"llm_openai": true`
- Chat requests return proper responses

**When not working:**
- Server logs show: `❌ OpenAI API Key NOT loaded`
- Health check shows: `"llm_openai": false`
- Chat requests return error message

### Still Not Working?

1. **Check backend terminal logs** for detailed error messages
2. **Verify API key** at https://platform.openai.com/api-keys
3. **Test API key directly:**
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer sk-your-key-here"
   ```
4. **Check network/firewall** - ensure backend can reach api.openai.com

### Need More Help?

Check the server logs when you make a chat request - they now include detailed error messages that will help identify the exact issue.

