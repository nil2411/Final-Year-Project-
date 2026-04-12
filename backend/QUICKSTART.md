# KrishiBot Backend - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Configure Environment

Create a `.env` file in the `backend/` directory:

```env
OPENAI_API_KEY=sk-your-key-here
```

### Step 3: Run the Server

```bash
uvicorn main:app --reload
```

That's it! The server will be available at `http://localhost:8000`

## 📡 Test the API

### Option 1: Interactive Docs
Visit: `http://localhost:8000/docs`

### Option 2: Test with curl

```bash
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "कपास के लिए कौन सी मिट्टी सबसे अच्छी होती है?",
    "language": "hi",
    "use_rag": true
  }'
```

### Option 3: Use the test script

```bash
python test_api.py
```

## 🎯 Available Endpoints

- `POST /api/chat` - Text chat with RAG
- `POST /api/voice-chat` - Voice input/output
- `GET /api/languages` - Get supported languages
- `WebSocket /ws/chat` - Real-time streaming chat
- `GET /health` - Health check

## 📚 Full Documentation

See `README.md` and `SETUP.md` for detailed information.

