"""Retrieval-Augmented Generation service for KrishiSaathi."""
from __future__ import annotations

import hashlib
import re
from pathlib import Path
from typing import Any, Dict, List, Tuple

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

from utils.config import BACKEND_DIR, settings

CLEANING_REGEXES = [
    (r"\n", " "),
    (r"Page \d+ of \d+", " "),
    (r"[^\u0900-\u097F\sA-Za-z0-9.,-/]", " "),
]


def clean_text(text: str) -> str:
    """Apply consistent cleaning before embedding or returning context."""
    for pattern, repl in CLEANING_REGEXES:
        text = re.sub(pattern, repl, text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


class RAGService:
    """Encapsulates FAISS retrieval with similarity thresholding and deduplication."""

    def __init__(self) -> None:
        self._vector_store = None
        self._embeddings = HuggingFaceEmbeddings(model_name=settings.embedding_model)
        print("✅ HuggingFaceEmbeddings initialized")
        self._load_vector_store()

    def _load_vector_store(self) -> None:
        index_dir = BACKEND_DIR / "data" / "faiss_index"
        if not index_dir.exists():
            raise FileNotFoundError(
                f"Vector store directory not found at {index_dir}. Run ingestion.py first."
            )
        self._vector_store = FAISS.load_local(
            str(index_dir),
            self._embeddings,
            allow_dangerous_deserialization=True,
        )
        try:
            total = self._vector_store.index.ntotal  # type: ignore[attr-defined]
            if total == 0:
                print("⚠️ FAISS index contains 0 vectors. Re-run ingestion to populate embeddings.")
        except Exception:
            pass

    def retrieve(self, query: str) -> Tuple[str, List[Dict[str, Any]], float]:
        """Return cleaned context, formatted sources with scores, and average confidence."""
        if not self._vector_store:
            return "NO_DOC_CONTEXT", [], 0.0

        raw_results = self._vector_store.similarity_search_with_score(query, k=10)

        deduped: List[Dict[str, Any]] = []
        seen_hashes = set()
        scores_list: List[float] = []

        for doc, score in raw_results:
            try:
                score_val = float(score)
            except (TypeError, ValueError):
                continue
            if score_val < 0.65:
                continue

            cleaned = clean_text(doc.page_content)
            if not cleaned:
                continue

            snippet = cleaned[:240]
            hash_key = hashlib.sha256(snippet.encode("utf-8")).hexdigest()
            if hash_key in seen_hashes:
                continue

            metadata = doc.metadata or {}
            source_name = metadata.get("source") or metadata.get("title") or "unknown"
            page_raw = metadata.get("page", 1)
            try:
                page_number = int(page_raw)
            except (TypeError, ValueError):
                page_number = 1

            # Convert similarity score to confidence (higher similarity = higher confidence)
            # FAISS returns distance, so lower is better; convert to 0-1 scale
            confidence_score = max(0.0, min(1.0, 1.0 - score_val))
            scores_list.append(confidence_score)

            deduped.append({
                "content": cleaned,
                "source": str(source_name),
                "page": page_number,
                "score": confidence_score,
            })
            seen_hashes.add(hash_key)

            if len(deduped) >= 3:
                break

        if not deduped:
            return "NO_DOC_CONTEXT", [], 0.0

        context = "\n\n".join(item["content"] for item in deduped)
        sources = [
            {
                "title": item["source"],
                "page": str(item["page"]),
                "score": item["score"],
            }
            for item in deduped
        ]
        avg_confidence = sum(scores_list) / len(scores_list) if scores_list else 0.0
        return context, sources, avg_confidence


rag_service = RAGService()

