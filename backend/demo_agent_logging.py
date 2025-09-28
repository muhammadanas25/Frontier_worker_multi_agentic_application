#!/usr/bin/env python3
"""
Simple demo to show Mock vs Real Agent logging
"""

import os
import sys
import asyncio

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

async def demo_mock_agent():
    """Demo mock agent with logging."""
    print("🤖 ==================== MOCK AGENT DEMO ====================")
    
    # Set mock mode
    os.environ['LLM_PROVIDER'] = 'mock'
    os.environ['DATABASE_TYPE'] = 'sqlite'
    os.environ['SQLITE_DB_PATH'] = 'demo_mock.db'
    
    from app.agents.mock_agent import mock_run
    from app import state_keys as K
    
    test_state = {
        K.CASE_ID: "FC-MOCK001",
        "user_message": "I have severe chest pain and shortness of breath",
        "location": {"lat": 24.815, "lon": 67.030},
        "battery_pct": 85,
        "bandwidth_kbps": 1000
    }
    
    print("📝 Input:")
    print(f"   Message: {test_state['user_message']}")
    print(f"   Location: {test_state['location']}")
    print(f"   Battery: {test_state['battery_pct']}%")
    
    print("\n🔄 Processing with Mock Agent...")
    result = await mock_run(test_state)
    
    print("\n📋 Results:")
    print(f"   Case Type: {result.get(K.CASE_TYPE)}")
    print(f"   Urgency: {result.get(K.URGENCY)}")
    print(f"   Lite Mode: {result.get(K.LITE)}")
    print(f"   Target: {result.get(K.TARGET, {}).get('name', 'None')}")
    print(f"   Confirmation: {result.get(K.CONFIRMATION_TEXT)}")

async def demo_real_agent():
    """Demo real agent with logging (if available)."""
    print("\n🧠 ==================== REAL AGENT DEMO ====================")
    
    # Check if we can use real agents
    try:
        from google.adk.agents import LlmAgent
        from google.genai import types
        
        # Set real mode
        os.environ['LLM_PROVIDER'] = 'vertex'
        
        from app.agents.health_agent import health_agent
        from app import state_keys as K
        
        print("📝 Testing Real Health Agent...")
        
        # This would normally be called through the ADK runner
        # For demo purposes, we'll show what would happen
        print("🔄 Would call Gemini API with:")
        print("   Model: gemini-2.0-flash")
        print("   Temperature: 0.2")
        print("   Max Tokens: 180")
        print("   Prompt: Health assistant instructions + user message")
        
        print("\n📋 Expected Results:")
        print("   ✅ Natural language understanding")
        print("   ✅ Context-aware urgency assessment")
        print("   ✅ Detailed medical advice")
        print("   ✅ Professional confirmation message")
        
    except ImportError as e:
        print(f"⚠️  Real agent demo skipped: {e}")
        print("   To test real agents, ensure Google Cloud credentials are set")

def show_logging_differences():
    """Show the logging differences between modes."""
    print("\n📊 ==================== LOGGING COMPARISON ====================")
    
    print("\n🤖 MOCK MODE LOGS:")
    print("   ✅ workflow_start")
    print("   ✅ agent_selection (rule-based)")
    print("   ✅ agent_execution_start")
    print("   ✅ agent_execution_complete")
    print("   ✅ workflow_step")
    print("   ✅ workflow_complete")
    print("   ❌ No gemini_request logs")
    print("   ❌ No gemini_response logs")
    
    print("\n🧠 REAL MODE LOGS:")
    print("   ✅ workflow_start")
    print("   ✅ agent_selection (LLM-based)")
    print("   ✅ agent_execution_start")
    print("   ✅ gemini_request (with full prompt)")
    print("   ✅ gemini_response (with AI response)")
    print("   ✅ agent_execution_complete")
    print("   ✅ workflow_step")
    print("   ✅ workflow_complete")
    print("   ✅ Token usage tracking")

async def main():
    """Run the complete demo."""
    print("🚀 Frontline Citizen Service Assistant - Agent Logging Demo")
    print("=" * 70)
    
    # Demo mock agent
    await demo_mock_agent()
    
    # Demo real agent
    await demo_real_agent()
    
    # Show logging differences
    show_logging_differences()
    
    print("\n🎉 Demo completed!")
    print("\n💡 Key Points:")
    print("   • Mock mode: Fast, cost-free, rule-based")
    print("   • Real mode: Intelligent, context-aware, costs tokens")
    print("   • Both modes have comprehensive logging")
    print("   • Switch modes with LLM_PROVIDER environment variable")

if __name__ == "__main__":
    asyncio.run(main())

