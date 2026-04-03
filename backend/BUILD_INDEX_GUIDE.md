# Building FAISS Index - Python 3.12 Setup Guide

## Issue
Python 3.13 has a compatibility issue with PyTorch/torchvision that causes a deadlock when building the FAISS index. We need Python 3.11 or 3.12 to run the build script.

## Solution: Install Python 3.12

### Step 1: Download Python 3.12
1. Visit: https://www.python.org/downloads/release/python-3120/
2. Scroll down to "Files" section
3. Download **Windows installer (64-bit)** for your system

### Step 2: Install Python 3.12
1. Run the downloaded installer
2. **IMPORTANT**: Check the box "Add Python 3.12 to PATH" at the bottom
3. Click "Install Now"
4. Wait for installation to complete

### Step 3: Verify Installation
Open a new PowerShell window and run:
```powershell
py -3.12 --version
```
You should see: `Python 3.12.x`

### Step 4: Install Dependencies for Python 3.12
```powershell
cd "C:\Final year project\Final full stack project\backend"
py -3.12 -m pip install -r requirements.txt --no-cache-dir
```

### Step 5: Build the FAISS Index
```powershell
py -3.12 build_faiss_index.py
```

The script will:
- Load your PDF and CSV files from `data/docs/`
- Split them into chunks
- Create embeddings
- Build the FAISS index
- Save it to `data/faiss_index/`

## Alternative: Use Existing Index
If you can't install Python 3.12 right now, the backend will use sample documents when it starts. Your PDF/CSV files won't be included until you rebuild the index with Python 3.12.

## After Building the Index
Once the index is built, you can start the backend server:
```powershell
uvicorn main:app --reload
```

The backend will automatically load the FAISS index you just built!

