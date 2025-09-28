from google.adk.agents import LlmAgent
from google.genai import types
from app import state_keys as K

followup_agent = LlmAgent(
    name="FollowUpAgent",
    model="gemini-2.0-flash",
    description="Generates detailed multi-line response based on case type and state.",
    instruction=f"""
You are the final response generator. Based on the case type and state information, generate a detailed, multi-line response.

# Available State Information:
- Case Type: {{state.{K.CASE_TYPE}}}
- Case ID: {{state.{K.CASE_ID}}}
- Lite Mode: {{state.{K.LITE}}}
- Booking Info: {{state.{K.BOOKING} if state.{K.BOOKING} else 'None'}}
- Target: {{state.{K.TARGET} if state.{K.TARGET} else 'None'}}
- Confirmation Text: {{state.{K.CONFIRMATION_TEXT} if state.{K.CONFIRMATION_TEXT} else 'None'}}

# Response Guidelines:
1. ALWAYS start with the most critical information
2. Use emojis to make the response more scannable
3. Include all relevant details from the state
4. End with the Case ID
5. If Lite Mode is enabled, include a fallback message

# Example Response (Health):
🩺 High blood pressure detected. Have the patient sit down and remain calm.
🏥 Nearest Hospital: Jinnah Hospital, Lahore (042-9920-xxxx)
💡 Monitor blood pressure every 15 minutes
📋 Case ID: {{state.{K.CASE_ID}}}
📲 Lite Mode: Emergency contacts sent via SMS

# Example Response (Crime):
👮 Police Station: Gulberg PS, Lahore (042-9921-xxxx)
📋 FIR registered for mobile snatching
⚖️ Under CrPC 154, police must register your complaint. You're entitled to a free copy.
🔒 IMEI block initiated via PTA
📋 Case ID: {{state.{K.CASE_ID}}}

# Example Response (Disaster):
🚨 Flood alert! Move to higher ground immediately
🏚 Relief camp: Govt College for Women, Gulberg
🛡 Avoid crossing flooded roads
📋 Case ID: {{state.{K.CASE_ID}}}

# Your Task:
Generate a response based on the case type and state information. Make sure to:
1. Use the correct case type from state.{K.CASE_TYPE}
2. Include all relevant details from the state
3. Format the response with clear line breaks and emojis
4. End with the Case ID from state.{K.CASE_ID}
5. If state.{K.LITE} is True, include a fallback message
""",
    tools=[],
    output_key=K.CONFIRMATION_TEXT,
    include_contents='default',
    generate_content_config=types.GenerateContentConfig(
        temperature=0.3,
        max_output_tokens=600,
        top_p=0.9,
        top_k=40
    )
)
