"""
Voice chat router - Handles voice input and returns voice output
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional

from models.schemas import VoiceChatResponse, Source, InputRate
from services.llm_service import llm_service
from services.rag_service import rag_service
from services.tts_service import tts_service
from services.stt_service import stt_service
from utils.language_utils import validate_language, detect_language, normalize_language_code

router = APIRouter(prefix="/api", tags=["voice"])


@router.post("/voice-chat", response_model=VoiceChatResponse)
async def voice_chat(
    audio: UploadFile = File(..., description="Audio file (wav, mp3, m4a)"),
    language: Optional[str] = Form(default="hi"),
    conversation_id: Optional[str] = Form(default=None),
    use_rag: bool = Form(default=True)
):
    """
    Voice chat endpoint - accepts audio input and returns transcribed text + audio response
    """
    try:
        # Read audio file
        audio_data = await audio.read()
        
        if not audio_data:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        # Detect language from audio if not provided or invalid
        if not language or not validate_language(language):
            detected_lang = stt_service.detect_language(audio_data)
            if detected_lang:
                language = detected_lang
            else:
                language = "hi"  # Default fallback
        
        # Transcribe audio
        transcribed_text = await stt_service.transcribe(audio_data, language)
        
        # Also detect from transcribed text for better accuracy
        if transcribed_text:
            text_detected = detect_language(transcribed_text)
            if text_detected and text_detected != language:
                language = text_detected
        
        # Normalize language code for backend compatibility (gu/pa/ta -> hi/en)
        language = normalize_language_code(language)
        
        if not transcribed_text:
            raise HTTPException(status_code=400, detail="Could not transcribe audio")
        
        # Retrieve context if RAG is enabled
        if use_rag:
            context, rag_sources, rag_confidence = rag_service.retrieve(transcribed_text)
        else:
            context, rag_sources, rag_confidence = "NO_DOC_CONTEXT", [], 0.0
        
        # Generate LLM response
        llm_response = await llm_service.generate_response(
            query=transcribed_text,
            language=language,
            context=context,
            sources=rag_sources,
            confidence=rag_confidence,
            memory=None
        )
        
        # Generate TTS audio
        audio_url = ""
        if llm_response.get("tts_text"):
            audio_url = await tts_service.generate_speech(
                llm_response["tts_text"],
                language
            ) or ""
        
        if not audio_url:
            raise HTTPException(status_code=500, detail="Could not generate audio response")
        
        # Convert sources to Source objects
        sources_list = []
        for src in llm_response.get("sources", []):
            if isinstance(src, dict):
                sources_list.append(Source(
                    title=src.get("title", ""),
                    page=str(src.get("page", "")),
                    score=float(src.get("score", 0.0))
                ))
        
        # Convert inputs_and_rates to InputRate objects
        inputs_list = []
        for inp in llm_response.get("inputs_and_rates", []):
            if isinstance(inp, dict):
                inputs_list.append(InputRate(
                    name=inp.get("name", ""),
                    value=inp.get("value", ""),
                    notes=inp.get("notes", "")
                ))
        
        # Build response (new detailed format)
        response = VoiceChatResponse(
            transcribed_text=transcribed_text,
            title=llm_response.get("title", ""),
            confidence=llm_response.get("confidence", 0.0),
            summary_short=llm_response.get("summary_short", ""),
            summary_detailed=llm_response.get("summary_detailed", ""),
            timing=llm_response.get("timing", ""),
            inputs_and_rates=inputs_list,
            steps_brief=llm_response.get("steps_brief", []),
            steps_detailed=llm_response.get("steps_detailed", []),
            monitoring_and_signs=llm_response.get("monitoring_and_signs", []),
            urgent_action=llm_response.get("urgent_action", []),
            recommendation=llm_response.get("recommendation", ""),
            regional_adaptations=llm_response.get("regional_adaptations", ""),
            follow_up_questions=llm_response.get("follow_up_questions", []),
            tts_text=llm_response.get("tts_text", ""),
            audio_url=audio_url,
            sources=sources_list,
            notes_for_farmer=llm_response.get("notes_for_farmer", ""),
            language=language,
            conversation_id=conversation_id
        )
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing voice chat: {str(e)}")

