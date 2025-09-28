from google.adk.agents import LlmAgent
from google.genai import types
from app import state_keys as K

booking_agent = LlmAgent(
    name="BookingAgent",
    model="gemini-2.0-flash",
    description="Reserves a slot if a target exists. Writes booking to state only.",
    instruction=f"""
If state '{K.TARGET}' exists, call the 'mock_book' tool to reserve a slot.
Save the returned booking dict into state key '{K.BOOKING}'.
Do not produce any user-facing text.
""",
    tools=[],
    include_contents='default',
    output_key=None,
    generate_content_config=types.GenerateContentConfig(temperature=0, max_output_tokens=80)
)

