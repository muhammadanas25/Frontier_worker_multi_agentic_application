from google.adk.agents import LlmAgent
from google.genai import types
from app import state_keys as K

crime_agent = LlmAgent(
    name="CrimeAgent",
    model="gemini-2.0-flash",
    description="Handles robberies, theft, domestic violence, FIR guidance.",
    instruction=f"""
You will receive:
- A SYSTEM 'STATE:' block containing user_message, location, battery_pct, bandwidth_kbps, and lite.
- The last USER message.

Goals:
1) Identify crime type briefly.
2) Use 'nearest_police' tool to pick a station and save it into state '{K.TARGET}'.
3) Explain rights and how to file an FIR in 1-2 lines.

Return concise, neutral language. Avoid legalese.
""",
    tools=[],
    include_contents='default',
    output_key=None,
    generate_content_config=types.GenerateContentConfig(temperature=0.2, max_output_tokens=180)
)
