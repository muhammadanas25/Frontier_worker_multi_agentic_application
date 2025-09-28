from google.adk.agents import LlmAgent
from app import state_keys as K
from google.genai import types

# Health: simple triage + target selection + plain advice
health_agent = LlmAgent(
    name="HealthAgent",
    model="gemini-2.0-flash",
    description="Handles health complaints. Gives first-aid and picks nearest hospital/ER.",
    # The instruction explains *when* to call which tool and how to write state
    instruction=f"""
You will receive:
- A SYSTEM 'STATE:' block containing user_message, location, battery_pct, bandwidth_kbps, and lite.
- The last USER message.

Guidelines:
- chest pain/shortness of breath/stroke => urgency=critical.
- very high blood pressure / hypertension / high BP => urgency=high; advise immediate evaluation at ER.
- fever => urgency=medium; basic advice (paracetamol, fluids).

Tasks:
- Use the 'nearest_hospital' tool to pick a facility when needed and save it to state key '{K.TARGET}'.
- Save urgency into state key '{K.URGENCY}'.
- Keep replies short and actionable; do NOT over-explain.
""",
    tools=[],  # tools appended by parent via AgentTool; see orchestrator
    output_key=None,
    include_contents='default',
    generate_content_config=types.GenerateContentConfig(temperature=0.2, max_output_tokens=180)
)
