from google.adk.agents import LlmAgent
from google.genai import types
from app import state_keys as K

lite_agent = LlmAgent(
    name="LiteAgent",
    model="gemini-2.0-flash",
    description="Generates concise, actionable responses for low-bandwidth scenarios.",
    instruction=f"""
Generate a very brief but helpful response for low-bandwidth scenarios. Include:
1. Case type (health/crime)
2. Most critical action to take
3. Key location if available
4. Case ID

Constraints:
- Keep it under 260 characters.
- No greetings or sign-offs.
- Output exactly one line. No markdown, no emojis.
- Do not mention tools or internals. Do not use template variables.

Examples:
- "Health: High BP? Sit upright, stay calm. Visit nearest clinic. ID: FC-XXXXXX"
- "Crime: Mobile stolen? Report at nearest station. ID: FC-XXXXXX"
""",
    include_contents='default',
    generate_content_config=types.GenerateContentConfig(
        temperature=0.1,
        max_output_tokens=100,
        top_p=0.9,
        top_k=40
    ),
    output_key=K.CONFIRMATION_TEXT
)

