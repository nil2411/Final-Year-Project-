"""
WebSocket chat router - Handles streaming chat via WebSocket
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import Dict, Set
import json

from services.llm_service import llm_service
from services.rag_service import rag_service
from services.tts_service import tts_service
from services.memory_service import memory_service
from utils.language_utils import validate_language, detect_language, normalize_language_code

router = APIRouter(tags=["websocket"])


class ConnectionManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, conversation_id: str):
        await websocket.accept()
        self.active_connections[conversation_id] = websocket
    
    def disconnect(self, conversation_id: str):
        if conversation_id in self.active_connections:
            del self.active_connections[conversation_id]
    
    async def send_message(self, conversation_id: str, message: dict):
        if conversation_id in self.active_connections:
            try:
                await self.active_connections[conversation_id].send_json(message)
            except Exception as e:
                print(f"Error sending message: {e}")
                self.disconnect(conversation_id)


manager = ConnectionManager()


@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket, conversation_id: str = "default"):
    """
    WebSocket endpoint for streaming chat
    Supports real-time token streaming for frontend updates
    """
    await manager.connect(websocket, conversation_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            query = data.get("query", "")
            language = data.get("language", "hi")
            use_rag = data.get("use_rag", True)
            
            if not query:
                await manager.send_message(conversation_id, {
                    "type": "error",
                    "data": {"message": "Query is required"},
                    "conversation_id": conversation_id
                })
                continue
            
            # Auto-detect language from query if not provided or invalid
            if not language or not validate_language(language):
                detected = detect_language(query) if query else "hi"
                language = detected
            else:
                # Even if provided, detect from query to ensure accuracy
                detected = detect_language(query) if query else language
                # Use detected language if it differs and is more confident
                if detected != language and query and len(query.strip()) > 5:
                    language = detected
            
            # Normalize language code for backend compatibility (gu/pa/ta -> hi/en)
            language = normalize_language_code(language)
            
            # Get conversation history from memory service
            history = memory_service.get_conversation_history(conversation_id)
            history_for_llm = [
                {"role": msg.get("role", "user"), "content": msg.get("content", "")}
                for msg in history
            ]
            
            # Add user message to memory
            memory_service.add_message(conversation_id, "user", query)
            
            # Send status: retrieving
            await manager.send_message(conversation_id, {
                "type": "status",
                "data": {"status": "retrieving", "message": "Retrieving relevant information..."},
                "conversation_id": conversation_id
            })
            
            # Retrieve context
            if use_rag:
                context, rag_sources, rag_confidence = rag_service.retrieve(query)
            else:
                context, rag_sources, rag_confidence = "NO_DOC_CONTEXT", [], 0.0
            
            # Send status: generating
            await manager.send_message(conversation_id, {
                "type": "status",
                "data": {"status": "generating", "message": "Generating response..."},
                "conversation_id": conversation_id
            })
            
            # Generate response
            llm_response = await llm_service.generate_response(
                query=query,
                language=language,
                context=context,
                sources=rag_sources,
                confidence=rag_confidence,
                memory=history_for_llm,
            )
            
            # Add assistant response to memory
            response_text = llm_response.get("summary_short", "") or llm_response.get("summary_detailed", "")
            memory_service.add_message(conversation_id, "assistant", response_text)
            
            # Send partial response (summary)
            await manager.send_message(conversation_id, {
                "type": "partial",
                "data": {
                    "summary_short": llm_response.get("summary_short", ""),
                    "language": language
                },
                "conversation_id": conversation_id
            })
            
            # Send status: generating audio
            await manager.send_message(conversation_id, {
                "type": "status",
                "data": {"status": "speaking", "message": "Generating audio..."},
                "conversation_id": conversation_id
            })
            
            # Generate TTS
            audio_url = ""
            if llm_response.get("tts_text"):
                audio_url = await tts_service.generate_speech(
                    llm_response["tts_text"],
                    language
                ) or ""
            
            # Send complete response
            await manager.send_message(conversation_id, {
                "type": "complete",
                "data": {
                    "title": llm_response.get("title", ""),
                    "confidence": llm_response.get("confidence", 0.0),
                    "summary_short": llm_response.get("summary_short", ""),
                    "summary_detailed": llm_response.get("summary_detailed", ""),
                    "timing": llm_response.get("timing", ""),
                    "inputs_and_rates": llm_response.get("inputs_and_rates", []),
                    "steps_brief": llm_response.get("steps_brief", []),
                    "steps_detailed": llm_response.get("steps_detailed", []),
                    "monitoring_and_signs": llm_response.get("monitoring_and_signs", []),
                    "urgent_action": llm_response.get("urgent_action", []),
                    "recommendation": llm_response.get("recommendation", ""),
                    "regional_adaptations": llm_response.get("regional_adaptations", ""),
                    "follow_up_questions": llm_response.get("follow_up_questions", []),
                    "tts_text": llm_response.get("tts_text", ""),
                    "audio_url": audio_url,
                    "sources": llm_response.get("sources", []),
                    "notes_for_farmer": llm_response.get("notes_for_farmer", ""),
                    "language": language
                },
                "conversation_id": conversation_id
            })
    
    except WebSocketDisconnect:
        manager.disconnect(conversation_id)
        print(f"WebSocket disconnected: {conversation_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        import traceback
        traceback.print_exc()
        await manager.send_message(conversation_id, {
            "type": "error",
            "data": {"message": str(e)},
            "conversation_id": conversation_id
        })
        manager.disconnect(conversation_id)

