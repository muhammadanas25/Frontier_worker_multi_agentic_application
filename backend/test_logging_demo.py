#!/usr/bin/env python3
"""
Demo script to show enhanced logging functionality
"""

import os
import sys
import asyncio
import requests
import time

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

# Set environment variables
os.environ['LLM_PROVIDER'] = 'mock'
os.environ['DATABASE_TYPE'] = 'sqlite'
os.environ['SQLITE_DB_PATH'] = 'demo_frontline.db'

from app.agents.mock_agent import mock_run
from app import state_keys as K

async def demo_logging():
    """Demonstrate the enhanced logging functionality."""
    print("🚀 Frontline Citizen Service Assistant - Logging Demo")
    print("=" * 60)
    
    # Test cases with different scenarios
    test_cases = [
        {
            "name": "Health Emergency - Chest Pain",
            "state": {
                K.CASE_ID: "FC-DEMO001",
                "user_message": "I have severe chest pain and shortness of breath",
                "location": {"lat": 24.815, "lon": 67.030},
                "battery_pct": 85,
                "bandwidth_kbps": 1000
            }
        },
        {
            "name": "Crime Report - Low Battery (Lite Mode)",
            "state": {
                K.CASE_ID: "FC-DEMO002", 
                "user_message": "Someone stole my wallet",
                "location": {"lat": 31.510, "lon": 74.350},
                "battery_pct": 15,  # Low battery triggers lite mode
                "bandwidth_kbps": 30
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{'='*60}")
        print(f"🧪 TEST CASE {i}: {test_case['name']}")
        print(f"{'='*60}")
        
        # Run the mock agent with enhanced logging
        result_state = await mock_run(test_case['state'].copy())
        
        # Display results
        print(f"\n📋 RESULTS:")
        print(f"   Case ID: {result_state.get(K.CASE_ID)}")
        print(f"   Case Type: {result_state.get(K.CASE_TYPE)}")
        print(f"   Urgency: {result_state.get(K.URGENCY)}")
        print(f"   Lite Mode: {result_state.get(K.LITE)}")
        
        target = result_state.get(K.TARGET)
        if target:
            print(f"   Target: {target.get('name') or target.get('station_name')}")
            print(f"   Address: {target.get('address')}")
        
        confirmation = result_state.get(K.CONFIRMATION_TEXT)
        print(f"   Confirmation: {confirmation}")
        
        print(f"\n✅ Test case {i} completed successfully!")
        
        # Small delay between tests
        if i < len(test_cases):
            time.sleep(1)
    
    print(f"\n🎉 All {len(test_cases)} test cases completed!")
    print("Check the logs above to see detailed agent selection and execution flow.")

if __name__ == "__main__":
    asyncio.run(demo_logging())

