# OpenAI API Key Setup - Step by Step

## The Problem

You're seeing: "I apologize, I'm unable to answer your question right now"

This happens because the backend can't connect to OpenAI API.

## The Solution

### Step 1: Create .env File

1. Navigate to the `backend` folder
2. Create a new file named `.env` (exactly this name, no extension)
3. Open it in a text editor

### Step 2: Add Your API Key

Add this line to the `.env` file:

```env
OPENAI_API_KEY=sk-your-actual-key-here
```

**Replace `sk-your-actual-key-here` with your real API key**

### Step 3: Get Your API Key

1. **Go to:** https://platform.openai.com/api-keys
2. **Sign in** (or create account if needed)
3. **Click:** "Create new secret key"
4. **Copy** the key (it will look like: `sk-proj-...`)
5. **Paste** it in your `.env` file

### Step 4: Verify File Location

Your file structure should be:
```
Final full stack project/
└── backend/
    ├── .env          ← YOUR FILE HERE
    ├── main.py
    ├── requirements.txt
    └── ...
```

**NOT:**
- ❌ `backend/.env.txt`
- ❌ `backend/env`
- ❌ `backend/env.txt`
- ❌ Root folder `.env`

### Step 5: Restart Server

**IMPORTANT:** After creating/updating `.env`, you MUST restart the server:

1. Stop the server (press `Ctrl+C` in the terminal)
2. Start it again:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

### Step 6: Verify It Works

When the server starts, you should see:

```
✅ OpenAI API Key: sk-... (format valid)
✅ OpenAI client initialized successfully
```

**NOT:**
```
❌ OpenAI API Key NOT loaded
```

## Common Mistakes

### ❌ Mistake 1: Wrong File Name
- Wrong: `.env.txt`, `env`, `environment`
- Correct: `.env` (exactly)

### ❌ Mistake 2: Wrong Location
- Wrong: Root folder, `Frontend/`, anywhere else
- Correct: `backend/.env`

### ❌ Mistake 3: Wrong Format
- Wrong: `OPENAI_API_KEY = sk-...` (spaces)
- Wrong: `OPENAI_API_KEY="sk-..."` (quotes)
- Correct: `OPENAI_API_KEY=sk-...` (no spaces, no quotes)

### ❌ Mistake 4: Not Restarting
- After creating `.env`, you MUST restart the server
- Changes to `.env` only take effect after restart

## Quick Test

After setup, test with:

```bash
# Check health
curl http://localhost:8000/health

# Should show: "llm_openai": true
```

## Still Having Issues?

Run the diagnostic:
```bash
cd backend
python check_env.py
```

This will tell you exactly what's wrong!

