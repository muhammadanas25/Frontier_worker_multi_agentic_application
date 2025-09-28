from google.adk.agents import LlmAgent
from google.genai import types

equity_agent = LlmAgent(
    name="EquityAdminSummary",
    model="gemini-2.0-flash",
    description="Summarizes daily demand vs capacity and notable hotspots for admins.",
    instruction="""
You are generating a short daily operational summary for administrators.
Given metrics JSON and examples of top districts, produce a concise 5-7 line text:
- Cases by type and any spikes vs yesterday.
- Top districts by volume.
- Any notes about Lite Mode percentage (potential infra issues).
Keep it crisp and actionable. No markdown.
Metrics JSON: {metrics_json}
TopDistricts: {top_districts}
""",
    include_contents='none',
    generate_content_config=types.GenerateContentConfig(temperature=0.2, max_output_tokens=220),
    output_key="admin_summary_text"
)
