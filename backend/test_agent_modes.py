#!/usr/bin/env python3
"""
Demo script to compare Mock vs Real Gemini agents with logging
"""

import os
import sys
import asyncio
import requests
import time

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_mock_mode():
    """Test the system in mock mode."""
    print("🤖 ==================== MOCK MODE TEST ====================")
    
    # Set mock mode
    os.environ['LLM_PROVIDER'] = 'mock'
    os.environ['DATABASE_TYPE'] = 'sqlite'
    os.environ['SQLITE_DB_PATH'] = 'demo_mock.db'
    
    # Start server in background
    import subprocess
    process = subprocess.Popen([
        'uvicorn', 'app.main:app', '--reload', '--port', '8001'
    ], env=os.environ.copy())
    
    # Wait for server to start
    time.sleep(3)
    
    try:
        # Test cases
        test_cases = [
            {
                "name": "Health Emergency - Mock",
                "data": {
                    "message": "I have severe chest pain and shortness of breath",
                    "lat": 24.815,
                    "lon": 67.030,
                    "citizen_phone": "+1234567890"
                }
            },
            {
                "name": "Crime Report - Mock",
                "data": {
                    "message": "Someone stole my wallet at the train station",
                    "lat": 31.510,
                    "lon": 74.350,
                    "battery_pct": 15
                }
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n📝 TEST {i}: {test_case['name']}")
            print("-" * 50)
            
            response = requests.post(
                'http://localhost:8001/cases',
                json=test_case['data'],
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Case ID: {result['case_id']}")
                print(f"   Type: {result['record']['case_type']}")
                print(f"   Urgency: {result['record']['urgency']}")
                print(f"   Lite: {result['record']['lite']}")
                print(f"   Response: {result['message'][:100]}...")
            else:
                print(f"❌ Error: {response.status_code}")
            
            time.sleep(1)
    
    finally:
        # Stop server
        process.terminate()
        process.wait()

def test_real_mode():
    """Test the system with real Gemini agents."""
    print("\n🧠 ==================== REAL GEMINI MODE TEST ====================")
    
    # Check if Google Cloud credentials are available
    if not os.getenv('GOOGLE_CLOUD_PROJECT'):
        print("⚠️  GOOGLE_CLOUD_PROJECT not set. Skipping real mode test.")
        print("   To test real mode, set:")
        print("   export GOOGLE_CLOUD_PROJECT=your-project-id")
        print("   export GOOGLE_CLOUD_LOCATION=asia-south1")
        return
    
    # Set real mode
    os.environ['LLM_PROVIDER'] = 'vertex'
    os.environ['DATABASE_TYPE'] = 'sqlite'
    os.environ['SQLITE_DB_PATH'] = 'demo_real.db'
    
    # Start server in background
    import subprocess
    process = subprocess.Popen([
        'uvicorn', 'app.main:app', '--reload', '--port', '8002'
    ], env=os.environ.copy())
    
    # Wait for server to start
    time.sleep(5)
    
    try:
        # Test cases
        test_cases = [
            {
                "name": "Health Emergency - Real Gemini",
                "data": {
                    "message": "I have severe chest pain and shortness of breath",
                    "lat": 24.815,
                    "lon": 67.030,
                    "citizen_phone": "+1234567890"
                }
            },
            {
                "name": "Crime Report - Real Gemini",
                "data": {
                    "message": "Someone stole my wallet at the train station",
                    "lat": 31.510,
                    "lon": 74.350,
                    "battery_pct": 15
                }
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n📝 TEST {i}: {test_case['name']}")
            print("-" * 50)
            
            response = requests.post(
                'http://localhost:8002/cases',
                json=test_case['data'],
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Case ID: {result['case_id']}")
                print(f"   Type: {result['record']['case_type']}")
                print(f"   Urgency: {result['record']['urgency']}")
                print(f"   Lite: {result['record']['lite']}")
                print(f"   Response: {result['message'][:100]}...")
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"   Response: {response.text}")
            
            time.sleep(2)
    
    finally:
        # Stop server
        process.terminate()
        process.wait()

def compare_modes():
    """Compare mock vs real mode side by side."""
    print("🔍 ==================== MODE COMPARISON ====================")
    
    print("\n📊 MOCK MODE:")
    print("   ✅ Fast response (no LLM calls)")
    print("   ✅ No cost")
    print("   ✅ Rule-based routing")
    print("   ✅ Predictable responses")
    print("   ❌ Limited intelligence")
    print("   ❌ No natural language understanding")
    
    print("\n🧠 REAL GEMINI MODE:")
    print("   ✅ Natural language understanding")
    print("   ✅ Context-aware responses")
    print("   ✅ Intelligent routing")
    print("   ✅ Dynamic content generation")
    print("   ❌ Slower response (LLM calls)")
    print("   ❌ Cost per request")
    print("   ❌ Requires Google Cloud setup")

def main():
    """Run the complete demo."""
    print("🚀 Frontline Citizen Service Assistant - Agent Mode Comparison")
    print("=" * 70)
    
    # Test mock mode
    test_mock_mode()
    
    # Test real mode (if credentials available)
    test_real_mode()
    
    # Show comparison
    compare_modes()
    
    print("\n🎉 Demo completed!")
    print("\n💡 To switch modes:")
    print("   Mock Mode:  export LLM_PROVIDER=mock")
    print("   Real Mode:  export LLM_PROVIDER=vertex")

if __name__ == "__main__":
    main()

