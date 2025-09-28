import uuid
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException
from google.genai import types
from app.schemas import CreateCase, CaseResponse, CaseRecord
from app.runners import RUNNER
from app.tools.storage import save_case, get_case
from app.tools.notify import send_sms
from app.tools.degraded import detect_lite
from app.dashboards.metrics import counts_by_type, top_districts_since
from app.agents.equity_agent import equity_agent
from app.agents.mock_agent import mock_run
from app.callbacks.logging import structured_logger, flow_logger_instance
from app.logging_config import setup_logging, log_separator, log_case_summary
from app import state_keys as K
from app import config

# Set up enhanced logging
setup_logging()

app = FastAPI(title="Frontline Citizen Service Assistant (ADK)")

@app.post("/cases", response_model=CaseResponse)
async def create_case(req: CreateCase):
    """Create a new case and process it through the multi-agent workflow."""
    case_id = f"FC-{uuid.uuid4().hex[:8].upper()}"
    # Session ids: stateless service; keep per-request session id = case_id
    user_id, session_id = "citizen", case_id
    
    # Log request received
    structured_logger.log_request(
        request_id=case_id,
        endpoint="/cases",
        user_id=user_id,
        message=req.message,
        location={"lat": req.lat, "lon": req.lon},
        battery_pct=req.battery_pct,
        bandwidth_kbps=req.bandwidth_kbps,
        llm_provider=config.LLM_PROVIDER,
        database_type=config.DATABASE_TYPE
    )

    # Build state and content for ADK
    initial_state = {
        K.CASE_ID: case_id,
        "user_message": req.message,
        "location": {"lat": req.lat, "lon": req.lon},
        "battery_pct": req.battery_pct,
        "bandwidth_kbps": req.bandwidth_kbps,
        "lang": req.lang
    }

    # Precompute lite mode once using environment thresholds
    initial_state[K.LITE] = detect_lite(req.battery_pct, req.bandwidth_kbps)

    try:
        if config.LLM_PROVIDER == "mock":
            # Mock mode: bypass LLM calls
            log_separator(f"PROCESSING CASE {case_id}", "🤖")
            print(f"Mode: MOCK | Database: {config.DATABASE_TYPE}")
            st = await mock_run(initial_state)
            confirmation = st.get(K.CONFIRMATION_TEXT) or f"Recorded. Case ID: {case_id}"
            
            # Log case summary
            target_name = None
            if st.get(K.TARGET):
                target_name = st[K.TARGET].get("name") or st[K.TARGET].get("station_name")
            
            log_case_summary(
                case_id=case_id,
                case_type=st.get(K.CASE_TYPE, "unknown"),
                urgency=st.get(K.URGENCY, "low"),
                lite=st.get(K.LITE, False),
                target_name=target_name
            )
        else:
            # Normal mode: use ADK runner
            # Create session
            await RUNNER.session_service.create_session(app_name=RUNNER.app_name,
                                                        user_id=user_id,
                                                        session_id=session_id,
                                                        state=initial_state)

            # One-turn invocation
            content = types.Content(role="user", parts=[types.Part(text=req.message)])
            events = RUNNER.run_async(user_id=user_id, session_id=session_id, new_message=content)

            # Drain the events to ensure all processing is complete
            async for _ in events:
                pass

            # Get final state
            ses = await RUNNER.session_service.get_session(app_name=RUNNER.app_name,
                                                         user_id=user_id, session_id=session_id)
            st = ses.state

            # Normalize potentially string fields to dicts
            target_val = st.get(K.TARGET)
            if isinstance(target_val, str):
                # Attempt to parse JSON string; if not JSON, wrap as name
                try:
                    import json as _json
                    parsed = _json.loads(target_val)
                    if isinstance(parsed, dict):
                        st[K.TARGET] = parsed
                    else:
                        st[K.TARGET] = {"name": str(parsed)}
                except Exception:
                    st[K.TARGET] = {"name": target_val}

            booking_val = st.get(K.BOOKING)
            if isinstance(booking_val, str):
                try:
                    import json as _json
                    parsed = _json.loads(booking_val)
                    if isinstance(parsed, dict):
                        st[K.BOOKING] = parsed
                    else:
                        st[K.BOOKING] = {"raw": str(parsed)}
                except Exception:
                    st[K.BOOKING] = {"raw": booking_val}
            
            # Get the confirmation text from state, or generate a default
            confirmation = st.get(K.CONFIRMATION_TEXT) or f"Your request has been recorded. Case ID: {case_id}"
            if not isinstance(confirmation, str):
                confirmation = str(confirmation)
            
            # Clean up any tool call information that might have leaked
            if 'called tool' in confirmation or 'For context:' in confirmation:
                confirmation = f"Your request has been processed. Case ID: {case_id}"

        # Persist record
        record = {
            "case_id": case_id,
            "created_at": datetime.utcnow(),  # Firestore stores as Timestamp
            "case_type": st.get(K.CASE_TYPE, "unknown"),
            "urgency": st.get(K.URGENCY, "low"),
            "lite": st.get(K.LITE, False),
            "target": st.get(K.TARGET),
            "booking": st.get(K.BOOKING),
            "confirmation": confirmation
        }
        
        print(f"\n💾 DATABASE: Saving to {config.DATABASE_TYPE}")
        save_success = save_case(case_id, record)
        print(f"💾 DATABASE: {'✅ Success' if save_success else '❌ Failed'}")

        # Optional SMS
        if req.citizen_phone:
            print(f"📱 NOTIFICATION: Sending SMS to {req.citizen_phone}")
            send_sms(req.citizen_phone, confirmation)

        # Log response
        structured_logger.log_response(
            request_id=case_id,
            case_id=case_id,
            response_data={
                "case_type": st.get(K.CASE_TYPE, "unknown"),
                "urgency": st.get(K.URGENCY, "low"),
                "lite": st.get(K.LITE, False),
                "confirmation_length": len(confirmation)
            }
        )

        print(f"\n🎉 CASE COMPLETED SUCCESSFULLY")
        print(f"   Response: {confirmation[:100]}{'...' if len(confirmation) > 100 else ''}")
        log_separator("", "🎉")
        
        return CaseResponse(case_id=case_id, message=confirmation, record=record)

    except Exception as e:
        # Fallback response
        fallback_confirmation = f"Your request has been recorded. Case ID: {case_id}"
        fallback_record = {
            "case_id": case_id,
            "created_at": datetime.utcnow(),
            "case_type": "unknown",
            "urgency": "low",
            "lite": True,
            "target": None,
            "booking": None,
            "confirmation": fallback_confirmation
        }
        save_case(case_id, fallback_record)

        if req.citizen_phone:
            send_sms(req.citizen_phone, fallback_confirmation)

        # Log error
        structured_logger.log_error(
            request_id=case_id,
            error=e,
            fallback_used=True
        )

        raise HTTPException(status_code=500, detail=f"Internal Server Error: {e}")

@app.get("/cases/{case_id}", response_model=CaseRecord)
def fetch_case(case_id: str):
    """Fetch a case by ID."""
    case = get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "frontline-citizen-service"}

@app.get("/admin/metrics")
def admin_metrics(hours: int | None = None):
    """
    Optional query param ?hours=24 to filter to last N hours.
    """
    data = counts_by_type(hours)
    data["as_of_utc"] = datetime.utcnow().isoformat() + "Z"
    return data

@app.post("/admin/daily-summary")
async def daily_summary():
    """Generate daily admin summary using equity agent."""
    metrics24 = counts_by_type(24)
    tops = top_districts_since(24)

    # Generate summary based on available data
    try:
        if config.LLM_PROVIDER == "mock":
            # Mock mode: generate simple summary
            total_cases = metrics24.get("total", 0)
            cases_by_type = metrics24.get("cases_by_type", {})
            lite_pct = tops.get("lite_pct", 0)

            summary = f"Daily Summary: {total_cases} total cases. "
            if cases_by_type:
                type_summary = ", ".join([f"{k}: {v}" for k, v in cases_by_type.items()])
                summary += f"Breakdown: {type_summary}. "
            summary += f"Lite mode usage: {lite_pct}%. "
            if tops.get("top"):
                top_district = tops["top"][0][0] if tops["top"] else "Unknown"
                summary += f"Top district: {top_district}."
        else:
            # Normal mode: use ADK runner
            user_id, session_id = "admin", "daily-summary"
            await RUNNER.session_service.create_session(RUNNER.app_name, user_id, session_id, state={})

            text_in = json.dumps(metrics24, default=str)
            content_vars = {
                "metrics_json": text_in,
                "top_districts": json.dumps(tops, default=str)
            }

            final = await equity_agent.call_async(variables=content_vars)
            summary = final.state.get("admin_summary_text") or "No data available."
    except Exception as e:
        summary = f"Error generating summary: {str(e)}"

    # Send summary (for MVP, console SMS to admin number env or skip)
    admin_phone = None  # set env and inject if you want SMS
    if admin_phone:
        send_sms(admin_phone, summary)

    return {"summary": summary, "metrics": metrics24, "tops": tops}

@app.get("/")
def root():
    """Root endpoint with service information."""
    return {
        "service": "Frontline Citizen Service Assistant",
        "version": "1.0.0",
        "description": "Multi-agent architecture for frontline workers",
        "endpoints": {
            "create_case": "POST /cases",
            "get_case": "GET /cases/{case_id}",
            "health": "GET /health",
            "admin_metrics": "GET /admin/metrics",
            "daily_summary": "POST /admin/daily-summary"
        }
    }