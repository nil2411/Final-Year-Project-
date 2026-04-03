"""
Script to build/rebuild FAISS index from documents in data/docs/
Run this after adding new documents to the docs folder.
"""
import os
import sys
from pathlib import Path
from typing import List

# Add backend to path
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from sentence_transformers import SentenceTransformer
import numpy as np

# Try importing document loaders
try:
    from langchain_community.document_loaders import (
        DirectoryLoader,
        PyPDFLoader,
        TextLoader,
        CSVLoader,
    )
    LOADERS_AVAILABLE = True
except ImportError:
    try:
        from langchain.document_loaders import (
            DirectoryLoader,
            PyPDFLoader,
            TextLoader,
            CSVLoader,
        )
        LOADERS_AVAILABLE = True
    except ImportError:
        LOADERS_AVAILABLE = False
        print("Warning: LangChain document loaders not available")

# Paths
DOCS_DIR = BACKEND_DIR / "data" / "docs"
INDEX_DIR = BACKEND_DIR / "data" / "faiss_index"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

def load_documents() -> List[Document]:
    """Load all documents from the docs directory"""
    if not DOCS_DIR.exists():
        print(f"❌ Docs directory not found: {DOCS_DIR}")
        return []
    
    if not LOADERS_AVAILABLE:
        print("❌ Document loaders not available. Install langchain-community")
        return []
    
    documents = []
    
    # Load PDFs
    pdf_files = list(DOCS_DIR.glob("*.pdf"))
    if pdf_files:
        print(f"📄 Found {len(pdf_files)} PDF file(s)")
        for pdf_file in pdf_files:
            try:
                loader = PyPDFLoader(str(pdf_file))
                docs = loader.load()
                # Add filename to metadata
                for doc in docs:
                    doc.metadata["source"] = pdf_file.name
                    doc.metadata["file_type"] = "pdf"
                documents.extend(docs)
                print(f"   ✅ Loaded: {pdf_file.name} ({len(docs)} pages)")
            except Exception as e:
                print(f"   ❌ Error loading {pdf_file.name}: {e}")
    
    # Load CSVs
    csv_files = list(DOCS_DIR.glob("*.csv"))
    if csv_files:
        print(f"📊 Found {len(csv_files)} CSV file(s)")
        for csv_file in csv_files:
            try:
                loader = CSVLoader(str(csv_file), encoding='utf-8')
                docs = loader.load()
                # Add filename to metadata
                for doc in docs:
                    doc.metadata["source"] = csv_file.name
                    doc.metadata["file_type"] = "csv"
                documents.extend(docs)
                print(f"   ✅ Loaded: {csv_file.name} ({len(docs)} rows)")
            except Exception as e:
                print(f"   ❌ Error loading {csv_file.name}: {e}")
    
    # Load text files
    txt_files = list(DOCS_DIR.glob("*.txt"))
    if txt_files:
        print(f"📝 Found {len(txt_files)} TXT file(s)")
        for txt_file in txt_files:
            try:
                loader = TextLoader(str(txt_file), encoding='utf-8')
                docs = loader.load()
                for doc in docs:
                    doc.metadata["source"] = txt_file.name
                    doc.metadata["file_type"] = "txt"
                documents.extend(docs)
                print(f"   ✅ Loaded: {txt_file.name}")
            except Exception as e:
                print(f"   ❌ Error loading {txt_file.name}: {e}")
    
    return documents

def build_index():
    """Build FAISS index from documents"""
    print("=" * 60)
    print("🔨 Building FAISS Index")
    print("=" * 60)
    
    # Load documents
    print("\n📚 Loading documents...")
    documents = load_documents()
    
    if not documents:
        print("\n❌ No documents found! Please add PDF, CSV, or TXT files to:")
        print(f"   {DOCS_DIR}")
        return False
    
    print(f"\n✅ Loaded {len(documents)} document(s)")
    
    # Split documents into chunks
    print("\n✂️  Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    split_docs = text_splitter.split_documents(documents)
    print(f"✅ Created {len(split_docs)} chunks")
    
    # Create embeddings using SentenceTransformer directly
    print(f"\n🧮 Loading embedding model: {EMBEDDING_MODEL}")
    try:
        # Try using HuggingFaceEmbeddings first (standard approach)
        embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
        use_direct_embeddings = False
    except Exception as e:
        print(f"   ⚠️  HuggingFaceEmbeddings failed: {e}")
        print("   🔄 Trying direct SentenceTransformer approach...")
        use_direct_embeddings = True
        embedding_model = SentenceTransformer(EMBEDDING_MODEL)
    
    # Build FAISS index
    print("\n🔨 Building FAISS index...")
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    
    if use_direct_embeddings:
        # Generate embeddings directly
        print("   📊 Generating embeddings for all chunks...")
        texts = [doc.page_content for doc in split_docs]
        embeddings_array = embedding_model.encode(texts, show_progress_bar=True, batch_size=32)
        
        # Create FAISS index manually
        import faiss
        dimension = embeddings_array.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(embeddings_array.astype('float32'))
        
        # Save FAISS index
        faiss.write_index(index, str(INDEX_DIR / "index.faiss"))
        
        # Save metadata separately (FAISS doesn't store document metadata)
        import pickle
        metadata = [{"page_content": doc.page_content, "metadata": doc.metadata} for doc in split_docs]
        with open(INDEX_DIR / "index.pkl", "wb") as f:
            pickle.dump(metadata, f)
        
        print(f"   ✅ FAISS index created with {len(split_docs)} vectors")
        vectorstore = None  # We'll create a wrapper later if needed
    else:
        vectorstore = FAISS.from_documents(split_docs, embeddings)
    
    # Save index
    if not use_direct_embeddings:
        print(f"\n💾 Saving index to: {INDEX_DIR}")
        vectorstore.save_local(str(INDEX_DIR))
    else:
        print(f"\n✅ Index already saved to: {INDEX_DIR}")
    
    print("\n" + "=" * 60)
    print("✅ FAISS index built successfully!")
    print(f"   📁 Index location: {INDEX_DIR}")
    print(f"   📄 Documents processed: {len(documents)}")
    print(f"   🧩 Chunks created: {len(split_docs)}")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    try:
        success = build_index()
        if success:
            print("\n🎉 You can now start the backend server!")
            print("   Run: uvicorn main:app --reload")
        else:
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error building index: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

