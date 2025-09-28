import uuid
from google.adk.agents import LlmAgent, SequentialAgent
from google.adk.tools import agent_tool, FunctionTool
from google.genai import types

from app.agents.health_agent import health_agent
from app.agents.crime_agent import crime_agent
from app.agents.booking_agent import booking_agent
from app.agents.followup_agent import followup_agent
from app.agents.lite_agent import lite_agent

from app.tools import directory as t_dir
from app.tools import booking as t_booking
from app import state_keys as K

# Wrap Python tools for LLM tool-use
nearest_hospital_tool = FunctionTool(func=t_dir.nearest_hospital)
nearest_police_tool = FunctionTool(func=t_dir.nearest_police)
mock_book_tool = FunctionTool(func=t_booking.mock_book)

# Attach directory/booking tools to the specialist agents
health_agent.tools = [nearest_hospital_tool]
crime_agent.tools = [nearest_police_tool]
booking_agent.tools = [mock_book_tool]

# Expose those agents as callable tools to the orchestrator (optional pattern)
health_tool = agent_tool.AgentTool(agent=health_agent)
crime_tool = agent_tool.AgentTool(agent=crime_agent)
booking_tool = agent_tool.AgentTool(agent=booking_agent)
follow_tool = agent_tool.AgentTool(agent=followup_agent)
lite_tool = agent_tool.AgentTool(agent=lite_agent)

# Orchestrator: routes and sets state keys; uses precomputed lite flag
orchestrator = LlmAgent(
    name="Orchestrator",
    model="gemini-2.0-flash",
    description="Routes to Health, Crime, or Disaster. Uses state.lite. Delegates only; no user text.",
    instruction=f"""
You are the main router. Read the last USER message and the STATE block.

Rules:
1) Determine case_type from the user message: 'health', 'crime', 'disaster', or 'unknown'.
2) Read the precomputed flag in state '{K.LITE}'. Do NOT call any tool for lite detection.
3) If lite is True: call LiteAgent and then STOP (no further calls).
4) If lite is False:
   - If case_type = health: call HealthAgent.
   - If case_type = crime: call CrimeAgent.
   - If case_type = disaster: do not call any specialist (FollowUpAgent will handle formatting).
   - Otherwise, do nothing further.
5) Write '{K.CASE_TYPE}' to state as a single word. Do not write user-facing text.
6) Never mention tools or internals.
""",
    tools=[health_tool, crime_tool, lite_tool],
    output_key=None,
    include_contents='default',
    generate_content_config=types.GenerateContentConfig(temperature=0, max_output_tokens=150)
)

# The overall sequential flow for one request
root_agent = SequentialAgent(
    name="FrontlineWorkflow",
    description="Orchestrator -> Specialist -> Booking -> FollowUp",
    sub_agents=[orchestrator, booking_agent, followup_agent]
)

