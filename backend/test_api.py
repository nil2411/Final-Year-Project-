"""
Simple test script for KrishiBot API
Run this after starting the server to test endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_root():
    """Test root endpoint"""
    print("Testing root endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

def test_languages():
    """Test languages endpoint"""
    print("Testing languages endpoint...")
    response = requests.get(f"{BASE_URL}/api/languages")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

def test_chat():
    """Test chat endpoint"""
    print("Testing chat endpoint...")
    payload = {
        "query": "कपास के लिए कौन सी मिट्टी सबसे अच्छी होती है?",
        "language": "hi",
        "use_rag": True,
        "conversation_id": "test123"
    }
    response = requests.post(
        f"{BASE_URL}/api/chat",
        json=payload
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Answer: {data.get('answer', '')[:100]}...")
        print(f"Confidence: {data.get('confidence', 0)}")
        print(f"Audio URL: {data.get('audio_url', 'N/A')}")
    else:
        print(f"Error: {response.text}")
    print()

def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

if __name__ == "__main__":
    print("=" * 50)
    print("KrishiBot API Test Script")
    print("=" * 50)
    print()
    
    try:
        test_root()
        test_languages()
        test_health()
        print("Note: Chat endpoint test requires OPENAI_API_KEY in .env")
        print("Uncomment the line below to test chat:")
        print("# test_chat()")
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to server.")
        print("Make sure the server is running: uvicorn main:app --reload")
    except Exception as e:
        print(f"Error: {e}")

