# KrishiBot Backend Setup Guide

## Quick Start

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Note:** On Windows, you may need to install PyTorch separately:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

### 2. Create Environment File

Create a `.env` file in the `backend/` directory:

```env
# Required
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional (for fallback LLM)
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama-3-8b-8192

# Optional - customize these
LLM_MODEL=gpt-4o-mini
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
VECTOR_DB=faiss
TTS_ENGINE=gTTS
STT_ENGINE=whisper
```

### 3. Run the Server

From the `backend/` directory:

```bash
uvicorn main:app --reload
```

Or:

```bash
python main.py
```

The server will start at `http://localhost:8000`

### 4. Test the API

Visit `http://localhost:8000/docs` for interactive API documentation.

Or test with curl:

```bash
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "कपास के लिए कौन सी मिट्टी सबसे अच्छी होती है?",
    "language": "hi",
    "use_rag": true
  }'
```

## Troubleshooting

### Import Errors

If you get LangChain import errors, install:
```bash
pip install langchain-community langchain-core
```

### Whisper Model Download

On first run, Whisper will download the base model (~150MB). This happens automatically.

### FAISS Index Creation

On first run, the RAG service will create a FAISS index with sample agriculture documents. This may take a few minutes.

### Audio Generation Issues

- **gTTS**: Requires internet connection for first use
- **Coqui TTS**: May require additional dependencies. If gTTS fails, install Coqui:
  ```bash
  pip install TTS
  ```

### Memory Issues

If you run out of memory:
- Use a smaller Whisper model: Edit `backend/services/stt_service.py` and change `"base"` to `"tiny"`
- Reduce batch sizes in RAG service
- Use CPU-only PyTorch (already configured)

## Production Deployment

1. Set `DEBUG=False` in `.env`
2. Use a production ASGI server:
   ```bash
   pip install gunicorn
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```
3. Configure proper CORS origins
4. Set up PostgreSQL for conversation history (optional)
5. Use a reverse proxy (nginx) for static files

## Adding More Documents

To add more agriculture documents to the RAG system:

1. Place documents in `backend/data/docs/` (PDF, TXT, DOCX)
2. Use the `rag_service.add_document()` method programmatically
3. Or modify `_add_sample_documents()` in `rag_service.py`

## API Keys

- **OpenAI**: Get from https://platform.openai.com/api-keys
- **Groq**: Get from https://console.groq.com/ (optional, for fallback)

