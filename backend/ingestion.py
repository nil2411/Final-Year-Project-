import argparse
import os
import re
from pathlib import Path
from typing import List

import pandas as pd
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

# Use your preferred embedding model and paths
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
BASE_DIR = Path(__file__).resolve().parent
DOCS_DIR = BASE_DIR / "data" / "docs"
OUT_DIR = BASE_DIR / "data" / "faiss_index"

CLEAN_REPLACEMENTS = [
    ("\n", " "),
]

CLEAN_REGEXES = [
    (r"Page \d+ of \d+", ""),
    (r"[^\u0900-\u097F\sA-Za-z0-9.,-]", " "),
    (r"\s+", " ")
]

def clean_text(text: str) -> str:
    for old, new in CLEAN_REPLACEMENTS:
        text = text.replace(old, new)
    for pattern, repl in CLEAN_REGEXES:
        text = re.sub(pattern, repl, text)
    return text.strip()

def human_readable_title(file_name: str) -> str:
    stem = Path(file_name).stem
    cleaned = re.sub(r"[_\-]+", " ", stem).strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.title() if cleaned else stem


def load_documents(doc_dir: Path) -> List[Document]:
    documents: List[Document] = []
    for file_path in doc_dir.rglob("*"):
        print(f"🔍 Checking: {file_path}")
        if file_path.suffix.lower() not in {".pdf", ".txt", ".csv"}:
            continue
        if file_path.suffix.lower() == ".pdf":
            from pypdf import PdfReader
            try:
                reader = PdfReader(str(file_path))
                print(f"  📄 PDF detected: {file_path.name} with {len(reader.pages)} pages")
                for i, page in enumerate(reader.pages):
                    text = page.extract_text() or ""
                    if not text.strip():
                        print(f"    ⚠️ Page {i + 1} appears empty or text extraction failed.")
                    cleaned = clean_text(text)
                    if cleaned:
                        documents.append(Document(
                            page_content=cleaned,
                            metadata={
                                "source": file_path.name,
                                "title": human_readable_title(file_path.name),
                                "page": i + 1
                            }
                        ))
            except Exception as exc:
                print(f"  ❌ Error reading PDF {file_path}: {exc}")
        elif file_path.suffix.lower() == ".txt":
            text = file_path.read_text(encoding="utf-8", errors="ignore")
            print(f"  📄 TXT detected: {file_path.name} with {len(text.splitlines())} lines")
            cleaned = clean_text(text)
            if cleaned:
                documents.append(Document(
                    page_content=cleaned,
                    metadata={
                        "source": file_path.name,
                        "title": human_readable_title(file_path.name),
                        "page": 1
                    }
                ))
        elif file_path.suffix.lower() == ".csv":
            try:
                df = pd.read_csv(file_path)
                print(f"  📊 CSV detected: {file_path.name} with {len(df)} rows")
                for idx, row in df.iterrows():
                    row_text = " ".join(str(value) for value in row if pd.notna(value))
                    cleaned = clean_text(row_text)
                    if not cleaned:
                        print(f"    ⚠️ Row {idx} cleaned to empty text.")
                    if cleaned:
                        documents.append(Document(
                            page_content=cleaned,
                            metadata={
                                "source": file_path.name,
                                "title": human_readable_title(file_path.name),
                                "page": idx + 1
                            }
                        ))
            except Exception as exc:
                print(f"  ❌ Error reading CSV {file_path}: {exc}")
    print(f"✅ Total loaded documents: {len(documents)}")
    return documents

def main():
    parser = argparse.ArgumentParser(description="Build FAISS index for KrishiSaathi.")
    parser.add_argument("--docs", type=str, default=str(DOCS_DIR))
    parser.add_argument("--out", type=str, default=str(OUT_DIR))
    parser.add_argument("--chunk", type=int, default=800)
    parser.add_argument("--overlap", type=int, default=120)
    args = parser.parse_args()

    doc_dir = Path(args.docs).expanduser()
    if not doc_dir.is_absolute():
        candidate = (BASE_DIR / doc_dir).resolve()
        doc_dir = candidate if candidate.exists() else doc_dir.resolve()
    else:
        doc_dir = doc_dir.resolve()

    out_dir = Path(args.out).expanduser()
    if not out_dir.is_absolute():
        out_dir = (BASE_DIR / out_dir).resolve()
    else:
        out_dir = out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    if not doc_dir.exists():
        print(f"⚠️ Provided documents directory does not exist: {doc_dir}")
        return

    print(f"📁 Loading documents from {doc_dir} ...")
    try:
        entries = list(doc_dir.iterdir())
        print(f"🗂️ Found {len(entries)} entries in directory.")
        for entry in entries:
            print(f"   • {entry.name}")
    except Exception as exc:
        print(f"⚠️ Unable to list directory contents: {exc}")
    documents = load_documents(doc_dir)
    if not documents:
        print("⚠️ No documents found. Exiting.")
        return

    print(f"📄 Loaded {len(documents)} cleaned documents. Chunking...")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=args.chunk,
        chunk_overlap=args.overlap
    )
    chunks = splitter.split_documents(documents)
    print(f"🔢 Created {len(chunks)} chunks.")

    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    print("🧠 Building FAISS index...")
    vector_store = FAISS.from_documents(chunks, embeddings)
    vector_store.save_local(str(out_dir))

    total = vector_store.index.ntotal
    print(f"✅ Vector store saved to {out_dir}. Total vectors: {total}")
    if total == 0:
        print("⚠️ Warning: index is empty. Check documents and try again.")

if __name__ == "__main__":
    main()