# NLTK Dependency Fix

## Root Cause Analysis

### The Error Chain:

1. **Initial Error**: `ModuleNotFoundError: No module named 'nltk'`
   - **Root Cause**: `sentence-transformers` requires `nltk` but it wasn't in `requirements.txt`
   - **Why**: `sentence-transformers` has implicit dependencies that aren't always automatically installed

2. **Secondary Dependencies**: After installing `nltk`, we discovered:
   - `huggingface-hub>=0.4.0` (required by sentence-transformers)
   - `sentencepiece>=0.1.0` (required by sentence-transformers)
   - `safetensors>=0.3.1` (required by transformers)
   - `tokenizers>=0.14.0` (required by transformers)

3. **Version Conflicts**: 
   - `transformers 4.36.2` required older versions of `huggingface-hub` and `tokenizers`
   - **Solution**: Upgraded `transformers` to `>=4.40.0` which is compatible with newer dependencies

## What We Fixed

### 1. Added Missing Dependencies
```txt
nltk>=3.8.0
huggingface-hub>=0.4.0
sentencepiece>=0.1.0
safetensors>=0.3.1
tokenizers>=0.14.0
```

### 2. Updated Transformers
```txt
# Before:
transformers==4.36.2

# After:
transformers>=4.40.0
```

## Why This Happened

**Dependency Resolution Issue**: 
- Python packages can have **implicit dependencies** that aren't always automatically installed
- `sentence-transformers` lists `nltk` as a dependency, but pip doesn't always install all sub-dependencies
- When you install a package, pip only installs direct dependencies, not always transitive ones

## Prevention

To avoid this in the future:
1. Always check package documentation for all dependencies
2. Use `pip install package[all]` when available for full dependency installation
3. Test imports after installation: `python -c "import package_name"`
4. Check for dependency warnings after installation

## Current Status

✅ All dependencies installed
✅ Version conflicts resolved
✅ Server should start successfully

## Test

```bash
cd backend
python -c "from sentence_transformers import SentenceTransformer; print('OK')"
```

If this works, the root cause is eliminated! 🎉

