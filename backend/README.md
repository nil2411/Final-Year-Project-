# KrishiBot Backend

AI Chatbot for Farmers - FastAPI Backend with multilingual support (Hindi, Marathi, English)

## Features

- 🌾 **RAG-powered** agriculture knowledge base
- 🗣️ **Voice input/output** (STT/TTS)
- 🌍 **Multilingual** support (Hindi, Marathi, English)
- ⚡ **Real-time** WebSocket streaming
- 🔄 **Modular architecture** for easy extensions

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Required:
- `OPENAI_API_KEY` - For GPT-4o-mini
- `GROQ_API_KEY` (optional) - For fallback LLM

### 3. Run the Server

```bash
uvicorn main:app --reload
```

Or:

```bash
python main.py
```

Server will start at `http://localhost:8000`

## API Endpoints

### 1. POST `/api/chat`

Text-based chat endpoint.

**Request:**
```json
{
  "query": "कपास के लिए कौन सी मिट्टी सबसे अच्छी होती है?",
  "language": "hi",
  "use_rag": true,
  "conversation_id": "user123"
}
```

**Response:**
```json
{
  "answer": "...",
  "details": "...",
  "sources": [...],
  "confidence": 85,
  "tts_text": "...",
  "follow_up": [...],
  "audio_url": "/static/audio/xxx.mp3",
  "language": "hi"
}
```

### 2. POST `/api/voice-chat`

Voice-based chat endpoint.

**Request:** `multipart/form-data`
- `audio`: Audio file (wav, mp3, m4a)
- `language`: Language code (optional)
- `conversation_id`: Conversation ID (optional)
- `use_rag`: Boolean (default: true)

**Response:** Same as `/api/chat` with additional `transcribed_text` field.

### 3. GET `/api/languages`

Get supported languages.

**Response:**
```json
{
  "languages": [
    {"code": "hi", "name": "Hindi", "native": "हिंदी"},
    {"code": "mr", "name": "Marathi", "native": "मराठी"},
    {"code": "en", "name": "English", "native": "English"}
  ]
}
```

### 4. WebSocket `/ws/chat`

Real-time streaming chat.

**Connect:**
```
ws://localhost:8000/ws/chat?conversation_id=user123
```

**Send:**
```json
{
  "query": "कपास के लिए कौन सी मिट्टी सबसे अच्छी होती है?",
  "language": "hi",
  "use_rag": true
}
```

**Receive:**
```json
{
  "type": "status|partial|complete|error",
  "data": {...},
  "conversation_id": "user123"
}
```

## Project Structure

```
backend/
├── main.py                 # FastAPI app
├── routers/
│   ├── chat.py            # Text chat router
│   └── voice_chat.py      # Voice chat router
├── services/
│   ├── llm_service.py     # LLM integration
│   ├── rag_service.py      # RAG retrieval
│   ├── tts_service.py      # Text-to-Speech
│   └── stt_service.py      # Speech-to-Text
├── models/
│   └── schemas.py         # Pydantic models
├── utils/
│   ├── config.py          # Configuration
│   ├── language_utils.py  # Language utilities
│   └── audio_utils.py     # Audio utilities
├── data/
│   ├── docs/              # Agriculture documents
│   └── faiss_index/       # Vector store
├── static/
│   └── audio/             # Generated audio files
├── requirements.txt
└── .env
```

## Adding Documents

To add more agriculture documents to the RAG system:

1. Place documents in `data/docs/` (PDF, TXT, DOCX)
2. Use `rag_service.add_document()` method
3. Or rebuild the index programmatically

## Extending

The architecture is modular. To add new features:

1. **Weather Module**: Create `services/weather_service.py`
2. **Fertilizer Module**: Create `services/fertilizer_service.py`
3. Add routes in `routers/`

## Troubleshooting

- **Whisper model loading slow**: Use `base` model (default) or pre-download
- **TTS not working**: Check `gTTS` installation or use Coqui TTS
- **RAG not finding documents**: Ensure `data/faiss_index/` exists and has data
- **LLM errors**: Check API keys in `.env`

## License

MIT

