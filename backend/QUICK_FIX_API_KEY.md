# Quick Fix: API Key Not Working

## 🔍 Root Cause Identified

The error "I apologize, I'm unable to answer your question right now" occurs because:
1. The `.env` file is missing or not in the correct location
2. The API key is not being loaded properly
3. The backend can't connect to OpenAI API

## ✅ Solution (3 Steps)

### Step 1: Create .env File

Create a file named `.env` (not `.env.txt`) in the `backend/` directory:

**Location:** `backend/.env`

**Content:**
```env
OPENAI_API_KEY=sk-your-actual-key-here
```

**Important:**
- Replace `sk-your-actual-key-here` with your actual OpenAI API key
- No spaces around the `=`
- No quotes needed
- Key must start with `sk-`

### Step 2: Get Your OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (it starts with `sk-`)
5. Paste it in your `.env` file

### Step 3: Restart the Server

After creating/updating the `.env` file:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
uvicorn main:app --reload
```

## 🔍 Verify It's Working

When you start the server, you should see:

```
✅ OpenAI API Key: sk-... (format valid)
✅ OpenAI client initialized successfully
```

If you see:
```
❌ OpenAI API Key NOT loaded
```

Then check:
1. Is the `.env` file in `backend/` directory?
2. Is the file named exactly `.env` (not `.env.txt`)?
3. Does the key start with `sk-`?
4. Are there any extra spaces or quotes?

## 🧪 Test the Fix

1. **Check health endpoint:**
   ```bash
   curl http://localhost:8000/health
   ```
   Should show: `"llm_openai": true`

2. **Test chat:**
   - Go to: http://localhost:8081/chat
   - Type a message
   - Should get a proper AI response (not error message)

## 📝 File Structure

Your backend directory should look like:
```
backend/
├── .env              ← CREATE THIS FILE
├── .env.example      ← Template (already exists)
├── main.py
├── requirements.txt
└── ...
```

## 🆘 Still Not Working?

Run the diagnostic script:
```bash
cd backend
python check_env.py
```

This will show you exactly what's wrong!

