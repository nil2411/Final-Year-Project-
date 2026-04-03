# Environment Setup Guide

## .env File Configuration

Create a `.env` file in the `backend/` directory with the following content:

```env
# KrishiSaathi - AI Chatbot for Farmers
# Backend Configuration

# ============================================
# LLM Configuration
# ============================================
# Primary LLM Provider (Groq)
GROQ_API_KEY=gsk-xxxx
GROQ_MODEL=llama-3.1-8b-instant

# Note: GPT4All will be used as offline fallback (no API key needed)

# ============================================
# Embedding & Vector Store
# ============================================
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
VECTOR_DB=faiss
# Options: faiss, chroma

# ============================================
# Speech Services
# ============================================
TTS_ENGINE=gTTS
# Options: gTTS, coqui
STT_ENGINE=whisper
# Options: whisper, whisperx

# ============================================
# Server Configuration
# ============================================
HOST=0.0.0.0
PORT=8000
DEBUG=true

# ============================================
# Language & Localization
# ============================================
DEFAULT_LANGUAGE=en
# Options: hi (Hindi), mr (Marathi), en (English)

# ============================================
# RAG Configuration
# ============================================
TOP_K=5
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# ============================================
# Optional: Database
# ============================================
# DATABASE_URL=sqlite:///./krishisaathi.db
# For PostgreSQL: postgresql://user:password@localhost/krishisaathi
```

## Getting API Keys

1. **Groq API Key** (Primary):
   - Visit: https://console.groq.com/keys
   - Create a new API key
   - Copy and paste into `GROQ_API_KEY`

2. **GPT4All** (Offline Fallback):
   - Models will be downloaded automatically on first use
   - No API key required
   - Install with: `pip install gpt4all`

## Quick Start

1. Copy the environment variables above into a `.env` file
2. Install dependencies: `pip install -r requirements.txt`
3. Run the server: `uvicorn main:app --reload`

The server will start on `http://localhost:8000`
