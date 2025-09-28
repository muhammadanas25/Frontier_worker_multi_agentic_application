#!/usr/bin/env python3
"""
Test script for the Frontline Citizen Service Assistant API
"""

import requests
import json
import time
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8080"  # Change to your deployed URL
TEST_CASES = [
    {
        "name": "Health Emergency - Chest Pain",
        "data": {
            "message": "I have severe chest pain and shortness of breath",
            "lat": 40.7128,
            "lon": -74.0060,
            "citizen_phone": "+1234567890",
            "battery_pct": 85,
            "bandwidth_kbps": 1000
        }
    },
    {
        "name": "Crime Report - Theft",
        "data": {
            "message": "Someone stole my wallet at the train station",
            "lat": 40.7589,
            "lon": -73.9851,
            "citizen_phone": "+1234567891",
            "battery_pct": 60,
            "bandwidth_kbps": 500
        }
    },
    {
        "name": "Degraded Mode - Low Battery",
        "data": {
            "message": "I need help with a health issue",
            "lat": 40.7505,
            "lon": -73.9934,
            "citizen_phone": "+1234567892",
            "battery_pct": 15,  # Low battery triggers lite mode
            "bandwidth_kbps": 50
        }
    },
    {
        "name": "General Query",
        "data": {
            "message": "I need information about government services",
            "lat": 40.7282,
            "lon": -73.9942,
            "battery_pct": 70,
            "bandwidth_kbps": 800
        }
    }
]

def test_health_check():
    """Test the health check endpoint."""
    print("🏥 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")

def test_create_case(case_data: Dict[str, Any]) -> str | None:
    """Test creating a case and return the case ID."""
    print(f"📝 Testing case creation: {case_data['name']}")
    try:
        response = requests.post(
            f"{BASE_URL}/cases",
            json=case_data["data"],
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            case_id = result["case_id"]
            print(f"✅ Case created successfully")
            print(f"   Case ID: {case_id}")
            print(f"   Message: {result['message']}")
            print(f"   Type: {result['record']['case_type']}")
            print(f"   Urgency: {result['record']['urgency']}")
            print(f"   Lite Mode: {result['record']['lite']}")
            return case_id
        else:
            print(f"❌ Case creation failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Case creation error: {e}")
        return None

def test_get_case(case_id: str):
    """Test retrieving a case."""
    print(f"🔍 Testing case retrieval: {case_id}")
    try:
        response = requests.get(f"{BASE_URL}/cases/{case_id}")
        if response.status_code == 200:
            case = response.json()
            print("✅ Case retrieved successfully")
            print(f"   Case: {json.dumps(case, indent=2)}")
        else:
            print(f"❌ Case retrieval failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Case retrieval error: {e}")

def test_admin_metrics():
    """Test the admin metrics endpoint."""
    print("📊 Testing admin metrics...")
    try:
        response = requests.get(f"{BASE_URL}/admin/metrics")
        if response.status_code == 200:
            metrics = response.json()
            print("✅ Admin metrics retrieved successfully")
            print(f"   Total cases: {metrics.get('total', 0)}")
            print(f"   Cases by type: {metrics.get('cases_by_type', {})}")
        else:
            print(f"❌ Admin metrics failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Admin metrics error: {e}")

def test_daily_summary():
    """Test the daily summary endpoint."""
    print("📋 Testing daily summary...")
    try:
        response = requests.post(f"{BASE_URL}/admin/daily-summary")
        if response.status_code == 200:
            summary = response.json()
            print("✅ Daily summary generated successfully")
            print(f"   Summary: {summary.get('summary', 'No summary')}")
        else:
            print(f"❌ Daily summary failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Daily summary error: {e}")

def main():
    """Run all tests."""
    print("🧪 Frontline Citizen Service Assistant - API Tests")
    print("=" * 60)
    
    # Test health check
    test_health_check()
    print()
    
    # Test case creation and retrieval
    case_ids = []
    for test_case in TEST_CASES:
        case_id = test_create_case(test_case)
        if case_id:
            case_ids.append(case_id)
        print()
        time.sleep(1)  # Rate limiting
    
    # Test case retrieval
    for case_id in case_ids:
        test_get_case(case_id)
        print()
    
    # Test admin endpoints
    test_admin_metrics()
    print()
    
    test_daily_summary()
    print()
    
    print("🎉 All tests completed!")
    print(f"Created {len(case_ids)} test cases")

if __name__ == "__main__":
    main()
