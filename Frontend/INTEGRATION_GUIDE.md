# Frontend-Backend Integration Guide

## ✅ Integration Complete!

The frontend is now fully connected to the FastAPI backend.

## What Was Integrated

### 1. **API Service** (`src/services/api.ts`)
- ✅ `sendChatMessage()` - Text chat with backend
- ✅ `sendVoiceMessage()` - Voice chat with backend STT/TTS
- ✅ `getSupportedLanguages()` - Get available languages
- ✅ `healthCheck()` - Backend health check
- ✅ `createWebSocketConnection()` - Real-time streaming chat

### 2. **Updated Chat Hook** (`src/components/chatbot/hooks/useChat.ts`)
- ✅ Replaced mock responses with real API calls
- ✅ Integrated with backend `/api/chat` endpoint
- ✅ Added language mapping (frontend → backend)
- ✅ Added conversation ID tracking
- ✅ Added loading states
- ✅ Added error handling
- ✅ Added WebSocket support for streaming

### 3. **Voice Chat Service** (`src/services/voiceChatService.ts`)
- ✅ Backend voice chat integration
- ✅ Audio recording utilities
- ✅ File conversion helpers

### 4. **Updated Components**
- ✅ `Chatbot.tsx` - Now uses real API
- ✅ `LanguageContext.tsx` - Added `currentLanguage` for API calls

## Configuration

### Frontend Environment Variables

Create `Frontend/.env` file:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_WEBSOCKET=true
```

### Backend Environment Variables

Create `backend/.env` file:
```env
OPENAI_API_KEY=sk-your-key-here
```

## How It Works

### Text Chat Flow:
1. User types message → `Chatbot.tsx`
2. `useChat.processUserInput()` → `api.sendChatMessage()`
3. Backend `/api/chat` → RAG → LLM → TTS
4. Response with text + audio URL → Frontend
5. Display message + optional audio playback

### Voice Chat Flow:
1. User clicks mic → `useVoiceRecognition.startListening()`
2. Record audio → Convert to File
3. `api.sendVoiceMessage()` → Backend `/api/voice-chat`
4. Backend: Whisper STT → RAG → LLM → TTS
5. Response with transcribed text + answer + audio → Frontend

### WebSocket Flow (Optional):
1. Connect → `api.createWebSocketConnection()`
2. Send query → Backend processes
3. Receive status updates: "retrieving" → "generating" → "speaking"
4. Receive partial responses (streaming)
5. Receive complete response with all data

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | Text chat with RAG |
| `/api/voice-chat` | POST | Voice input → text + audio output |
| `/api/languages` | GET | Get supported languages |
| `/ws/chat` | WebSocket | Real-time streaming chat |
| `/health` | GET | Backend health check |

## Testing the Integration

### 1. Start Backend:
```bash
cd backend
uvicorn main:app --reload
```

### 2. Start Frontend:
```bash
cd Frontend
npm run dev
# or
npm start
```

### 3. Test Chat:
1. Open `http://localhost:8080/chat`
2. Type a message in Hindi/Marathi/English
3. Should receive AI response from backend

### 4. Test Voice (if browser supports):
1. Click microphone button
2. Speak in Hindi/Marathi/English
3. Should transcribe and respond

## Language Mapping

Frontend languages → Backend languages:
- `hi` (Hindi) → `hi`
- `mr` (Marathi) → `mr`
- `en` (English) → `en`
- `gu`, `pa`, `ta` → `hi` (fallback)

## Error Handling

- ✅ Network errors caught and displayed
- ✅ API errors show user-friendly messages
- ✅ Fallback to mock responses if backend unavailable (optional)
- ✅ Loading states during API calls

## Next Steps

1. **Add API Key**: Add `OPENAI_API_KEY` to `backend/.env`
2. **Test Integration**: Start both servers and test chat
3. **Customize**: Adjust language mappings, add features
4. **Deploy**: Configure production URLs in `.env`

## Troubleshooting

### CORS Errors
- Backend CORS is configured to allow all origins
- If issues persist, check `backend/main.py` CORS settings

### API Connection Failed
- Check backend is running: `http://localhost:8000/health`
- Check `VITE_API_BASE_URL` in frontend `.env`
- Check browser console for errors

### No Response from Chat
- Check backend logs for errors
- Verify `OPENAI_API_KEY` is set
- Check network tab in browser DevTools

## Files Changed

- ✅ `Frontend/src/services/api.ts` - **NEW** - API service
- ✅ `Frontend/src/services/voiceChatService.ts` - **NEW** - Voice chat
- ✅ `Frontend/src/components/chatbot/hooks/useChat.ts` - **UPDATED** - Real API
- ✅ `Frontend/src/components/chatbot/Chatbot.tsx` - **UPDATED** - Uses real API
- ✅ `Frontend/src/contexts/LanguageContext.tsx` - **UPDATED** - Added currentLanguage
- ✅ `Frontend/.env.example` - **NEW** - Environment template

The integration is complete and ready to use! 🎉

