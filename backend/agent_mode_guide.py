#!/usr/bin/env python3
"""
Quick test to show how to switch between Mock and Real agents
"""

import os
import sys

print("🔄 Agent Mode Switching Guide")
print("=" * 50)

print("\n🤖 CURRENT MODE: MOCK AGENTS")
print("   • Fast, rule-based responses")
print("   • No LLM calls")
print("   • Cost-free")
print("   • Limited intelligence")

print("\n🧠 TO SWITCH TO REAL GEMINI AGENTS:")
print("   1. Set environment variable:")
print("      export LLM_PROVIDER=vertex")
print("")
print("   2. Ensure Google Cloud credentials:")
print("      export GOOGLE_CLOUD_PROJECT=your-project-id")
print("      export GOOGLE_CLOUD_LOCATION=asia-south1")
print("")
print("   3. Install Google Cloud dependencies:")
print("      pip install google-cloud-firestore google-cloud-storage")
print("")
print("   4. Restart the server:")
print("      uvicorn app.main:app --reload --port 8000")

print("\n📊 LOGGING DIFFERENCES:")

print("\n🤖 MOCK MODE LOGS:")
print("   ✅ agent_selection: rule-based routing")
print("   ✅ agent_execution_start/complete")
print("   ❌ No gemini_request logs")
print("   ❌ No gemini_response logs")

print("\n🧠 REAL MODE LOGS:")
print("   ✅ agent_selection: LLM-based routing")
print("   ✅ gemini_request: full prompt sent to Gemini")
print("   ✅ gemini_response: AI-generated response")
print("   ✅ Token usage tracking")

print("\n🔍 CURRENT LOGS SHOW:")
print("   • Only mock agents being called")
print("   • Rule-based case type detection")
print("   • No actual Gemini API calls")
print("   • Fast, predictable responses")

print("\n💡 TO SEE REAL AGENT LOGS:")
print("   1. Switch to vertex mode")
print("   2. Make a request")
print("   3. Check logs for gemini_request/gemini_response")

print("\n🎯 EXAMPLE COMMANDS:")
print("   # Switch to real mode")
print("   export LLM_PROVIDER=vertex")
print("   uvicorn app.main:app --reload --port 8000")
print("")
print("   # Test with curl")
print("   curl -X POST localhost:8000/cases \\")
print("     -H 'Content-Type: application/json' \\")
print("     -d '{\"message\":\"I have chest pain\",\"lat\":24.815,\"lon\":67.030}'")

print("\n✅ The logging system is ready for both modes!")
print("   Just switch LLM_PROVIDER to see the difference.")

