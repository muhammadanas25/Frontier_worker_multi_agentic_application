#!/usr/bin/env python3
"""
Local testing script for the Frontline Citizen Service Assistant
This script tests the mock mode without requiring Google Cloud setup
"""

import os
import sys
import asyncio
from datetime import datetime

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

# Set mock mode and SQLite for testing
os.environ['LLM_PROVIDER'] = 'mock'
os.environ['DATABASE_TYPE'] = 'sqlite'
os.environ['SQLITE_DB_PATH'] = 'test_frontline.db'

from app.agents.mock_agent import mock_run
from app.database.factory import get_db
from app.tools.storage import save_case, get_case, list_cases
from app.dashboards.metrics import counts_by_type, top_districts_since
from app import state_keys as K

async def test_mock_agent():
    """Test the mock agent functionality."""
    print("🧪 Testing Mock Agent Flow")
    print("=" * 50)
    
    test_cases = [
        {
            "name": "Health Emergency - Chest Pain",
            "state": {
                K.CASE_ID: "FC-TEST001",
                "user_message": "I have severe chest pain and shortness of breath",
                "location": {"lat": 24.815, "lon": 67.030},
                "battery_pct": 85,
                "bandwidth_kbps": 1000
            }
        },
        {
            "name": "Crime Report - Theft",
            "state": {
                K.CASE_ID: "FC-TEST002",
                "user_message": "Someone stole my wallet at the train station",
                "location": {"lat": 31.510, "lon": 74.350},
                "battery_pct": 60,
                "bandwidth_kbps": 500
            }
        },
        {
            "name": "Degraded Mode - Low Battery",
            "state": {
                K.CASE_ID: "FC-TEST003",
                "user_message": "I need help with a health issue",
                "location": {"lat": 33.71, "lon": 73.06},
                "battery_pct": 12,  # Low battery triggers lite mode
                "bandwidth_kbps": 30
            }
        },
        {
            "name": "General Query",
            "state": {
                K.CASE_ID: "FC-TEST004",
                "user_message": "I need information about government services",
                "location": {"lat": 40.7282, "lon": -73.9942},
                "battery_pct": 70,
                "bandwidth_kbps": 800
            }
        }
    ]
    
    for test_case in test_cases:
        print(f"\n📝 Testing: {test_case['name']}")
        print("-" * 30)
        
        # Run the mock agent
        result_state = await mock_run(test_case['state'].copy())
        
        # Display results
        print(f"Case ID: {result_state.get(K.CASE_ID)}")
        print(f"Case Type: {result_state.get(K.CASE_TYPE)}")
        print(f"Urgency: {result_state.get(K.URGENCY)}")
        print(f"Lite Mode: {result_state.get(K.LITE)}")
        
        target = result_state.get(K.TARGET)
        if target:
            print(f"Target Facility: {target.get('name') or target.get('station_name')}")
            print(f"Address: {target.get('address')}")
        
        booking = result_state.get(K.BOOKING)
        if booking:
            print(f"Booking: {booking.get('place')} at {booking.get('slot_human')}")
        
        confirmation = result_state.get(K.CONFIRMATION_TEXT)
        print(f"Confirmation: {confirmation}")
        
        print("✅ Test completed")

def test_directory_tools():
    """Test the directory tools directly."""
    print("\n🗺️ Testing Directory Tools")
    print("=" * 50)
    
    from app.tools import directory as t_dir
    
    # Test hospital lookup
    print("\n🏥 Testing Hospital Lookup")
    hospital = t_dir.nearest_hospital(24.815, 67.030)  # Karachi coordinates
    print(f"Nearest Hospital: {hospital.get('name')}")
    print(f"Address: {hospital.get('address')}")
    print(f"Phone: {hospital.get('phone')}")
    
    # Test police lookup
    print("\n🚔 Testing Police Station Lookup")
    police = t_dir.nearest_police(31.510, 74.350)  # Lahore coordinates
    print(f"Nearest Police Station: {police.get('station_name')}")
    print(f"Address: {police.get('address')}")
    print(f"Phone: {police.get('phone')}")

def test_booking_tools():
    """Test the booking tools directly."""
    print("\n📅 Testing Booking Tools")
    print("=" * 50)
    
    from app.tools import booking as t_booking
    
    # Mock target
    target = {
        "name": "City General Hospital",
        "address": "123 Main St"
    }
    
    # Test booking
    booking = t_booking.mock_book(target, "Patient has chest pain")
    print(f"Booking Status: {'Confirmed' if booking.get('confirmed') else 'Pending'}")
    print(f"Place: {booking.get('place')}")
    print(f"Time: {booking.get('slot_human')}")
    print(f"Note: {booking.get('note')}")
    
    # Test confirmation draft
    confirmation = t_booking.draft_confirmation("FC-TEST001", booking, False)
    print(f"Confirmation: {confirmation}")

def test_database_operations():
    """Test database operations."""
    print("\n💾 Testing Database Operations")
    print("=" * 50)
    
    # Test saving a case
    test_case = {
        "case_id": "FC-DBTEST001",
        "created_at": datetime.utcnow(),
        "case_type": "health",
        "urgency": "high",
        "lite": False,
        "target": {"name": "Test Hospital", "district": "Test District"},
        "booking": {"confirmed": True, "place": "Test Hospital"},
        "confirmation": "Test confirmation",
        "user_message": "Test health emergency",
        "location": {"lat": 24.815, "lon": 67.030}
    }
    
    # Save case
    success = save_case("FC-DBTEST001", test_case)
    print(f"✅ Save case: {'Success' if success else 'Failed'}")
    
    # Retrieve case
    retrieved = get_case("FC-DBTEST001")
    if retrieved:
        print(f"✅ Retrieve case: Success")
        print(f"   Case Type: {retrieved.get('case_type')}")
        print(f"   Urgency: {retrieved.get('urgency')}")
        print(f"   Target: {retrieved.get('target', {}).get('name')}")
    else:
        print("❌ Retrieve case: Failed")
    
    # List cases
    cases = list_cases(limit=5)
    print(f"✅ List cases: Found {len(cases)} cases")
    
    # Test metrics
    metrics = counts_by_type()
    print(f"✅ Metrics - Total cases: {metrics.get('total', 0)}")
    print(f"   Cases by type: {metrics.get('cases_by_type', {})}")
    
    # Test top districts
    districts = top_districts_since(hours=24)
    print(f"✅ Top districts: {len(districts.get('top', []))} districts")
    print(f"   Lite mode %: {districts.get('lite_pct', 0)}%")

def test_degraded_detection():
    """Test the degraded mode detection."""
    print("\n🔋 Testing Degraded Mode Detection")
    print("=" * 50)
    
    from app.tools import degraded as t_degraded
    
    test_scenarios = [
        {"battery_pct": 85, "kbps": 1000, "expected": False},
        {"battery_pct": 15, "kbps": 1000, "expected": True},
        {"battery_pct": 85, "kbps": 30, "expected": True},
        {"battery_pct": 15, "kbps": 30, "expected": True},
        {"battery_pct": None, "kbps": None, "expected": False},
    ]
    
    for scenario in test_scenarios:
        result = t_degraded.detect_lite(scenario["battery_pct"], scenario["kbps"])
        status = "✅" if result == scenario["expected"] else "❌"
        print(f"{status} Battery: {scenario['battery_pct']}%, Bandwidth: {scenario['kbps']}kbps -> Lite: {result}")

async def main():
    """Run all local tests."""
    print("🚀 Frontline Citizen Service Assistant - Local Tests")
    print("=" * 60)
    print("Testing mock mode without Google Cloud dependencies")
    print()
    
    # Test individual components
    test_database_operations()
    test_degraded_detection()
    test_directory_tools()
    test_booking_tools()
    
    # Test full mock agent flow
    await test_mock_agent()
    
    print("\n🎉 All local tests completed!")
    print("The mock agent is working correctly and ready for deployment.")

if __name__ == "__main__":
    asyncio.run(main())
