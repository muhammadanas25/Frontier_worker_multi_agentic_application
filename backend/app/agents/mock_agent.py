from app import config
from app.tools.degraded import detect_lite
from app.tools import directory as t_dir
from app.tools import booking as t_booking
from app.callbacks.logging import agent_logger_instance, flow_logger_instance
from app import state_keys as K

def _mock_route(state):
    """Mock routing logic based on keywords."""
    text = (state.get("user_message") or "").lower()
    if any(k in text for k in ["robbery", "theft", "chori", "fir", "violence", "harassment", "snatched", "stolen", "wallet", "mobile"]):
        return "crime"
    if any(k in text for k in ["fever", "bukhar", "chest pain", "blood", "vaccine", "medicine", "stroke", "pain", "sick", "hospital", "health", "emergency"]):
        return "health"
    return "unknown"

async def mock_run(state: dict):
    """Mock agent run that bypasses LLM calls."""
    request_id = state.get(K.CASE_ID, "unknown")
    
    # Log workflow start
    flow_logger_instance.log_workflow_start(
        request_id=request_id,
        user_message=state.get("user_message", ""),
        location=state.get("location", {}),
        mode="mock"
    )
    
    # Route the case
    case_type = _mock_route(state)
    state[K.CASE_TYPE] = case_type
    
    # Check for lite mode
    lite_mode = detect_lite(state.get("battery_pct"), state.get("bandwidth_kbps"))
    state[K.LITE] = lite_mode
    
    # Log agent selection
    agent_logger_instance.log_agent_selection(
        request_id=request_id,
        case_type=case_type,
        lite_mode=lite_mode,
        routing_keywords=state.get("user_message", "").lower()
    )
    
    # Get location
    location = state.get("location", {})
    lat = location.get("lat")
    lon = location.get("lon")
    
    # Find nearest facility
    if case_type == "health":
        agent_logger_instance.log_agent_execution(
            request_id=request_id,
            agent_name="health_agent_mock",
            input_data={"location": location, "message": state.get("user_message")}
        )
        
        target = t_dir.nearest_hospital(lat, lon)
        state[K.TARGET] = target
        state[K.URGENCY] = "medium"  # Default urgency
        if "chest pain" in (state.get("user_message") or "").lower():
            state[K.URGENCY] = "critical"
            
        agent_logger_instance.log_agent_completion(
            request_id=request_id,
            agent_name="health_agent_mock",
            output_data={"target": target, "urgency": state[K.URGENCY]}
        )
        
    elif case_type == "crime":
        agent_logger_instance.log_agent_execution(
            request_id=request_id,
            agent_name="crime_agent_mock",
            input_data={"location": location, "message": state.get("user_message")}
        )
        
        target = t_dir.nearest_police(lat, lon)
        state[K.TARGET] = target
        state[K.URGENCY] = "medium"
        
        agent_logger_instance.log_agent_completion(
            request_id=request_id,
            agent_name="crime_agent_mock",
            output_data={"target": target, "urgency": state[K.URGENCY]}
        )
    else:
        agent_logger_instance.log_agent_execution(
            request_id=request_id,
            agent_name="unknown_agent_mock",
            input_data={"message": state.get("user_message")}
        )
        
        state[K.TARGET] = None
        state[K.URGENCY] = "low"
        
        agent_logger_instance.log_agent_completion(
            request_id=request_id,
            agent_name="unknown_agent_mock",
            output_data={"target": None, "urgency": "low"}
        )
    
    # Create booking if target exists
    if state.get(K.TARGET):
        flow_logger_instance.log_workflow_step(
            request_id=request_id,
            step="booking_creation",
            step_data={"target": state[K.TARGET]}
        )
        
        booking = t_booking.mock_book(state[K.TARGET])
        state[K.BOOKING] = booking
        
        # Generate confirmation
        if state[K.LITE]:
            facility_name = state[K.TARGET].get("name") or state[K.TARGET].get("station_name", "Service")
            if case_type == "health":
                state[K.CONFIRMATION_TEXT] = f"Emergency: 112. Nearest: {facility_name}. Case ID: {state.get(K.CASE_ID)}"
            else:
                state[K.CONFIRMATION_TEXT] = f"Police: 15. Nearest: {facility_name}. Case ID: {state.get(K.CASE_ID)}"
        else:
            if booking and booking.get("confirmed"):
                state[K.CONFIRMATION_TEXT] = (f"Appointment booked: {booking['place']} at {booking['slot_human']}. "
                                             f"Bring your ID card. Case ID: {state.get(K.CASE_ID)}")
            else:
                state[K.CONFIRMATION_TEXT] = f"Your request is recorded. We'll notify next steps. Case ID: {state.get(K.CASE_ID)}"
    else:
        state[K.CONFIRMATION_TEXT] = f"Your request is recorded. Case ID: {state.get(K.CASE_ID)}"
    
    # Log workflow completion
    flow_logger_instance.log_workflow_complete(
        request_id=request_id,
        final_state=state
    )
    
    return state