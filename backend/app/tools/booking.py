from datetime import datetime, timedelta
from typing import Optional, Dict, Any

def mock_book(target: Dict[str, Any], citizen_note: Optional[str] = None) -> Dict[str, Any]:
    """Mock booking system that creates a reservation slot."""
    slot = datetime.utcnow() + timedelta(hours=2)
    return {
        "confirmed": True,
        "place": target.get("name") or target.get("station_name") or "Service Desk",
        "slot_iso": slot.isoformat() + "Z",
        "slot_human": slot.strftime("%d %b, %I:%M %p"),
        "note": citizen_note or ""
    }

def draft_confirmation(case_id: str, booking: Dict[str, Any], lite: bool, fallback_text: Optional[str] = None) -> str:
    """Draft a confirmation message for the citizen."""
    if lite:
        return f"{fallback_text} Case ID: {case_id}"
    if booking and booking.get("confirmed"):
        return (f"Appointment booked: {booking['place']} at {booking['slot_human']}. "
                f"Bring your ID card. Case ID: {case_id}")
    return f"Your request is recorded. We'll notify next steps. Case ID: {case_id}"
