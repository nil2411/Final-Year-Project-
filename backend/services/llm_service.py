"""KrishiSaathi LLM orchestration with strict JSON enforcement."""

from __future__ import annotations

import asyncio
import json
from typing import Any, Dict, List, Optional

import httpx

from utils.config import ENV_FILE, settings

try:
    from groq import Groq

    GROQ_SDK_AVAILABLE = True
except ImportError:  # pragma: no cover - optional dependency
    Groq = None  # type: ignore
    GROQ_SDK_AVAILABLE = False

try:
    from gpt4all import GPT4All

    GPT4ALL_AVAILABLE = True
except ImportError:  # pragma: no cover - optional dependency
    GPT4All = None  # type: ignore
    GPT4ALL_AVAILABLE = False

SYSTEM_PROMPT = """\
You are KrishiSaathi — an agriculture expert for Indian farmers. For every user query, produce a rich, practical, safe, NON-HALLUCINATIVE, multilingual answer and return ONLY a single JSON object with the exact schema below. Do not print anything else.

Language: reply in the same language the user used (Marathi / Hindi / English). Always prefer short clear farmer-friendly words; when using numbers include units.

RAG Rules: if retrieved documents exist use them as evidence; if evidence confidence < 0.6 treat as "no reliable doc" and prepend "याबद्दल अचूक माहिती उपलब्ध नाही, परंतु सर्वसाधारण मार्गदर्शन:" (or equivalent in the user's language) before giving safe general guidance. NEVER invent government schemes, phone numbers, websites, prices, or contacts unless present in RAG documents.

STRICT JSON SCHEMA (all fields required; fill with empty strings/arrays if not applicable):
{
  "title": "",                 // short header with emoji, e.g. "🌾 बटाटा — पेरणी माहिती"
  "confidence": 0.0,           // float 0.0-1.0 indicating RAG+model confidence (set based on avg retrieval scores; 0.0 if no docs)
  "summary_short": "",         // 1–2 short lines for quick reading
  "summary_detailed": "",      // up to 4–6 sentences that explain background & why recommendations are given
  "timing": "",                // best sowing/harvest months, time-of-day actions, season-specific notes
  "inputs_and_rates": [        // concrete inputs and dosages with units
     {"name":"Seed rate","value":"", "notes":""},
     {"name":"Seed depth","value":"", "notes":""},
     {"name":"Spacing","value":"", "notes":""},
     {"name":"Fertilizer N-P-K","value":"", "notes":""}
  ],
  "steps_brief": [],           // 3–6 very short imperative steps (one-line each)
  "steps_detailed": [],        // 3–6 matching detailed steps (each 2–5 sentences, practical how-to)
  "monitoring_and_signs": [],  // what to watch for (disease signs, pests, moisture), each item short
  "urgent_action": [],         // immediate actions if problem observed (very short, imperative)
  "recommendation": "",        // single-paragraph recommended plan & alternatives
  "regional_adaptations": "",  // how to adjust based on region/soil/climate
  "follow_up_questions": [],   // 2–4 targeted Qs to personalize advice
  "tts_text": "",              // 1–2 clean spoken sentences (no emoji, no bullets), optimized for voice
  "audio_url": "",             // backend fills with generated TTS audio link (leave empty in model output)
  "sources": [],               // array of readable sources if RAG present: [{"title":"", "page": "", "score":0.0}, ...] or [] if none
  "notes_for_farmer": ""       // safety/legal disclaimers or final quick tips (1–2 lines)
}

Behavior and content rules:
1) ALWAYS generate both summary_short (1–2 lines) and summary_detailed (4–6 sentences).
2) Steps: provide matching brief imperatives in steps_brief and practical multi-sentence instructions in steps_detailed. The i-th brief should map to the i-th detailed.
3) Inputs_and_rates: always include seed rate, seed depth, spacing, and fertilizer N-P-K with units if relevant. If unknown, leave value empty.
4) Timing: specify sowing/harvest months and any timing sensitivities (e.g., pre-monsoon, post-monsoon, rabi/kharif months).
5) Monitoring_and_signs: list common pests/diseases symptoms to watch for; monitoring frequency (e.g., "check weekly").
6) Urgent_action: if a problem (pest/disease/waterlogging) is asked about, include an instant "do this now" list (3 items max).
7) Recommendation: include one clear plan plus 1–2 safe alternatives (organic options first).
8) Regional_adaptations: explain how to change doses/varieties based on soil type (sandy, loam, clay) and rainfall (low/medium/high).
9) Follow_up_questions: ask to clarify soil pH, irrigation type, location, recent weather, or crop variety.
10) TTS: generate a separate short tts_text optimized for audio (plain language — avoid punctuation/emoji).
11) Sources: if RAG returned docs, include readable titles and page numbers and their scores; dedupe similar chunks; limit to top 3. If none, return [].
12) No hallucinations: do not output any invented schemes, contact details, or statistics not in RAG or general agricultural knowledge. If unsure, state uncertainty in summary_short/detailed and ask follow-up questions.
13) Language & tone: keep all visible fields (title, summary, steps, recommendation, follow-ups, notes) in user language. Use farmer-friendly words and examples. Use metric units (kg/ha, cm, mm) but accept local units in parentheses if common.
14) Emergency disclaimers: when urgent_action given, also include notes_for_farmer with a short safety note (e.g., "Use protective gear when spraying").
15) Safety & legal: never provide illicit or dangerous instructions. For pesticide/fungicide names, only recommend generic classes (e.g., "fungicide" or "neem oil") unless explicit brand names exist in RAG docs and RAG confidence is high.

Return ONLY the JSON object. No extra text.
"""

RESPONSE_TEMPLATE: Dict[str, Any] = {
    "title": "",
    "confidence": 0.0,
    "summary_short": "",
    "summary_detailed": "",
    "timing": "",
    "inputs_and_rates": [],
    "steps_brief": [],
    "steps_detailed": [],
    "monitoring_and_signs": [],
    "urgent_action": [],
    "recommendation": "",
    "regional_adaptations": "",
    "follow_up_questions": [],
    "tts_text": "",
    "audio_url": "",
    "sources": [],
    "notes_for_farmer": "",
}


class LLMService:
    """Primary Groq + GPT4All fallback orchestration."""

    def __init__(self) -> None:
        self.groq_client: Optional[Any] = None
        self.groq_use_sdk = GROQ_SDK_AVAILABLE
        self.gpt4all_model: Optional[Any] = None
        self._initialize_primary_client()
        self._initialize_offline_fallback()

    def _initialize_primary_client(self) -> None:
        groq_key = (settings.groq_api_key or "").strip()
        if not groq_key:
            import os

            groq_key = os.getenv("GROQ_API_KEY", "").strip()
            if not groq_key and ENV_FILE.exists():
                from utils.config import _manual_load_env

                manual_env = _manual_load_env()
                groq_key = manual_env.get("GROQ_API_KEY", "").strip()
        if not groq_key:
            print("⚠️  Groq API key missing; only offline fallback will be available.")
            return

        settings.groq_api_key = groq_key
        if GROQ_SDK_AVAILABLE and Groq:
            try:
                self.groq_client = Groq(api_key=groq_key)
                print("✅ Groq SDK client ready")
                return
            except Exception as exc:  # pragma: no cover
                print(f"⚠️  Groq SDK init failed: {exc}. Falling back to httpx.")
                self.groq_use_sdk = False

        headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
        self.groq_client = httpx.AsyncClient(base_url="https://api.groq.com/openai/v1", headers=headers, timeout=60.0)
        print("✅ Groq HTTP client ready")

    def _initialize_offline_fallback(self) -> None:
        if not GPT4ALL_AVAILABLE or not GPT4All:
            print("ℹ️  GPT4All not installed; offline fallback disabled.")
            return
        try:
            self.gpt4all_model = GPT4All("Phi-3-mini-4k-instruct.Q4_0.gguf")
            print("✅ GPT4All offline fallback ready")
        except Exception as exc:  # pragma: no cover
            print(f"⚠️  GPT4All init failed: {exc}")
            self.gpt4all_model = None

    def _build_messages(
        self,
        *,
        language: str,
        query: str,
        context: str,
        sources: List[Dict[str, Any]],
        memory: Optional[List[Dict[str, str]]] = None,
    ) -> List[Dict[str, str]]:
        messages: List[Dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]

        if memory:
            clipped = memory[-12:]
            for entry in clipped:
                role = entry.get("role", "user")
                text = (entry.get("content") or "").strip()
                if text:
                    messages.append({"role": role, "content": text})

        if context == "NO_DOC_CONTEXT":
            messages.append(
                {
                    "role": "system",
                    "content": "No verified RAG context available. Provide safe, general Indian farming guidance without fabricating sources.",
                }
            )
        else:
            messages.append(
                {
                    "role": "system",
                    "content": f"Verified RAG context:\n{context}",
                }
            )

        if sources:
            formatted = json.dumps(sources, ensure_ascii=False)
            messages.append(
                {
                    "role": "system",
                    "content": (
                        "Verified RAG evidence (internal reference only, do not list in output):\n"
                        f"{formatted}"
                    ),
                }
            )
        else:
            messages.append(
                {
                    "role": "system",
                    "content": "No verified source snippets available. Give safe Indian farming advice and do not fabricate facts.",
                }
            )

        messages.append(
            {
                "role": "user",
                "content": f"Language code: {language}\nUser query: {query}",
            }
        )
        return messages

    @staticmethod
    def _apply_template(raw: Dict[str, Any], sources: List[Dict[str, Any]], confidence: float) -> Dict[str, Any]:
        """Validate and apply template, ensuring all required fields exist."""
        validated: Dict[str, Any] = {}
        validated.update(RESPONSE_TEMPLATE)

        # Copy all fields from raw response
        for key in RESPONSE_TEMPLATE:
            if key in raw:
                validated[key] = raw[key]

        # Ensure string fields are strings
        validated["title"] = str(validated.get("title", "")).strip()
        validated["summary_short"] = str(validated.get("summary_short", "")).strip()
        validated["summary_detailed"] = str(validated.get("summary_detailed", "")).strip()
        validated["timing"] = str(validated.get("timing", "")).strip()
        validated["recommendation"] = str(validated.get("recommendation", "")).strip()
        validated["regional_adaptations"] = str(validated.get("regional_adaptations", "")).strip()
        validated["tts_text"] = str(validated.get("tts_text", "")).strip()
        validated["audio_url"] = str(validated.get("audio_url", "") or "").strip()
        validated["notes_for_farmer"] = str(validated.get("notes_for_farmer", "")).strip()

        # Ensure confidence is a float
        validated["confidence"] = float(validated.get("confidence", confidence))
        validated["confidence"] = max(0.0, min(1.0, validated["confidence"]))

        # Validate inputs_and_rates array
        inputs = validated.get("inputs_and_rates", [])
        if not isinstance(inputs, list):
            inputs = []
        validated["inputs_and_rates"] = [
            {
                "name": str(item.get("name", "")).strip() if isinstance(item, dict) else "",
                "value": str(item.get("value", "")).strip() if isinstance(item, dict) else "",
                "notes": str(item.get("notes", "")).strip() if isinstance(item, dict) else "",
            }
            for item in inputs[:10]  # Limit to 10 items
        ]

        # Validate array fields
        for array_field in ["steps_brief", "steps_detailed", "monitoring_and_signs", "urgent_action", "follow_up_questions"]:
            arr = validated.get(array_field, [])
            if not isinstance(arr, list):
                arr = []
            validated[array_field] = [str(item).strip() for item in arr if str(item).strip()][:6]

        # Ensure steps_brief and steps_detailed have matching lengths
        brief_len = len(validated["steps_brief"])
        detailed_len = len(validated["steps_detailed"])
        if brief_len != detailed_len:
            # Pad the shorter one
            if brief_len < detailed_len:
                validated["steps_brief"].extend([""] * (detailed_len - brief_len))
            else:
                validated["steps_detailed"].extend([""] * (brief_len - detailed_len))

        # Set sources from RAG
        validated["sources"] = sources if sources else []

        return validated

    async def _call_groq(self, messages: List[Dict[str, str]]) -> Optional[str]:
        if not self.groq_client:
            return None

        try:
            if self.groq_use_sdk and hasattr(self.groq_client, "chat"):
                loop = asyncio.get_event_loop()

                def _sync_call() -> Any:
                    return self.groq_client.chat.completions.create(
                        model=settings.groq_model,
                        messages=messages,
                        temperature=0.3,
                        max_tokens=800,
                        response_format={"type": "json_object"},
                    )

                response = await loop.run_in_executor(None, _sync_call)
                return response.choices[0].message.content

            payload = {
                "model": settings.groq_model,
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 800,
                "response_format": {"type": "json_object"},
            }
            resp = await self.groq_client.post("/chat/completions", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        except Exception as exc:  # pragma: no cover
            print(f"⚠️  Groq request failed: {exc}")
            return None

    async def _call_gpt4all(self, messages: List[Dict[str, str]]) -> Optional[str]:
        if not self.gpt4all_model:
            return None
        try:
            prompt = ""
            for item in messages:
                prompt += f"{item['role'].upper()}: {item['content']}\n"
            prompt += "ASSISTANT:"
            return self.gpt4all_model.generate(prompt, max_tokens=800, temp=0.3)
        except Exception as exc:  # pragma: no cover
            print(f"⚠️  GPT4All generation failed: {exc}")
            return None

    @staticmethod
    def _coerce_json(text: str) -> Optional[Dict[str, Any]]:
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            start = text.find("{")
            end = text.rfind("}")
            if start == -1 or end == -1 or end <= start:
                return None
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                return None
        except Exception:
            return None

    async def generate_response(
        self,
        *,
        query: str,
        language: str,
        context: str,
        sources: List[Dict[str, Any]],
        confidence: float = 0.0,
        memory: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        messages = self._build_messages(
            language=language,
            query=query,
            context=context,
            sources=sources,
            memory=memory,
        )

        raw_text = await self._call_groq(messages)
        if not raw_text:
            raw_text = await self._call_gpt4all(messages)

        fallback_blocks = {
            "hi": {
                "title": "🌾 मदत आवश्यक",
                "summary_short": "क्षमा करें किसान भाई, अभी विस्तृत उत्तर उपलब्ध नहीं है।",
                "summary_detailed": "कृपया नीचे दी गई जानकारी भेजें ताकि सही सलाह दे सकूँ। मिट्टी, सिंचाई और फसल की जानकारी से मैं बेहतर मार्गदर्शन कर सकूँगा।",
                "steps_brief": [
                    "मिट्टी का pH और प्रकार बताइए",
                    "बीज की मात्रा और सिंचाई सुविधा साझा करें",
                    "रोग या कीट का फोटो या विवरण भेजें"
                ],
                "steps_detailed": [
                    "अपनी मिट्टी का pH और प्रकार बताइए ताकि उर्वरक योजना तय कर सकें। मिट्टी परीक्षण रिपोर्ट हो तो भेजें।",
                    "बीज की मात्रा, पंक्तियों की दूरी और सिंचाई सुविधा की जानकारी साझा करें।",
                    "यदि कोई रोग या कीट दिखाई दे रहा हो तो उसका फोटो या विवरण भेजें।"
                ],
                "recommendation": "कृपया मिट्टी परीक्षण रिपोर्ट, फसल का चरण और सिंचाई पद्धति बताएं ताकि हम सटीक मार्गदर्शन दे सकें।",
                "follow_up_questions": [
                    "आपके खेत का स्थान और फसल कौन सी है?",
                    "क्या हाल ही में मिट्टी या पाण्याचे परीक्षण करवाया है?",
                    "सिंचाई के लिए कौन सा तरीका उपयोग कर रहे हैं?"
                ],
                "tts_text": "किसान भाई, कृपया मिट्टी, सिंचाई और फसल की जानकारी भेजें, तभी मैं सही सलाह दे पाऊँगा।",
            },
            "mr": {
                "title": "🌾 मदत आवश्यक",
                "summary_short": "माफ करा शेतकरी बंधूंनो, सध्या सविस्तर उत्तर उपलब्ध नाही.",
                "summary_detailed": "कृपया खालील माहिती द्या म्हणजे योग्य मार्गदर्शन करू शकतो. माती, सिंचन आणि पिकाची माहिती मिळाल्यास अचूक सल्ला देऊ शकतो.",
                "steps_brief": [
                    "मातीचा pH आणि प्रकार कळवा",
                    "बियाण्याचे प्रमाण आणि सिंचन पद्धत सांगा",
                    "रोग किंवा कीडाचा फोटो किंवा तपशील द्या"
                ],
                "steps_detailed": [
                    "आपल्या शेतातील मातीचा pH आणि प्रकार कळवा म्हणजे खत व्यवस्थापन ठरवता येईल. माती परीक्षण अहवाल असल्यास पाठवा.",
                    "बियाण्याचे प्रमाण, पेरणी अंतर आणि सिंचन पद्धत सांगा.",
                    "कोणता रोग किंवा कीड दिसत असल्यास फोटो किंवा तपशील द्या."
                ],
                "recommendation": "कृपया माती परीक्षण, सिंचन योजना आणि फसलाचा टप्पा द्या म्हणजे अचूक सल्ला मिळेल.",
                "follow_up_questions": [
                    "तुमच्या शेताचा भाग आणि कोणती पिके आहेत?",
                    "अलीकडे माती वा पाण्याचे परीक्षण केले आहे का?",
                    "सिंचनासाठी ठिबक, फवारा की इतर पद्धत वापरता?"
                ],
                "tts_text": "बंधूंनो, माती, सिंचन व रोगाची माहिती पाठवा म्हणजे योग्य सल्ला देऊ शकतो.",
            },
            "en": {
                "title": "🌾 Help Needed",
                "summary_short": "Sorry farmer friend, I need more information to give a useful answer.",
                "summary_detailed": "Please share the details below so I can provide proper guidance. With soil, irrigation and crop information, I can give accurate advice.",
                "steps_brief": [
                    "Share soil pH and type",
                    "Mention seed rate and irrigation method",
                    "Send photo or description of any pest or disease"
                ],
                "steps_detailed": [
                    "Share the soil pH, soil type and last fertilizer so we can plan properly. If you have a soil test report, send it.",
                    "Mention seed rate, row spacing and current irrigation method.",
                    "Tell me if you see any pest, disease spots or nutrient symptoms."
                ],
                "recommendation": "Please send soil test values, crop stage and irrigation schedule so I can give precise local advice.",
                "follow_up_questions": [
                    "Which village/region and crop are you working on?",
                    "Do you have recent soil or water test results?",
                    "What irrigation system are you using right now?"
                ],
                "tts_text": "Farmer friend, please share soil, crop and irrigation details so I can guide you better.",
            },
        }

        fallback = fallback_blocks.get(language, fallback_blocks["en"])

        if not raw_text:
            result = RESPONSE_TEMPLATE.copy()
            result.update(fallback)
            result["confidence"] = 0.0
            result["audio_url"] = ""
            result["sources"] = sources
            return result

        parsed = self._coerce_json(raw_text)
        if not parsed:
            result = RESPONSE_TEMPLATE.copy()
            result.update(fallback)
            result["confidence"] = 0.0
            result["audio_url"] = ""
            result["sources"] = sources
            return result

        return self._apply_template(parsed, sources, confidence)


llm_service = LLMService()

