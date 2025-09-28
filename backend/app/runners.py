import os
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.artifacts import GcsArtifactService, InMemoryArtifactService
from app.agents.orchestrator import root_agent
from app.agents.mock_agent import mock_run
from app import config

APP_NAME = "frontline_mvp"
SESSION_SERVICE = InMemorySessionService()  # ok for MVP
try:
    ARTIFACT_SERVICE = GcsArtifactService(bucket_name=os.environ["GCS_BUCKET"])
except Exception:
    ARTIFACT_SERVICE = InMemoryArtifactService()

# Choose runner based on LLM provider
if config.LLM_PROVIDER == "mock":
    # For mock mode, we'll use a custom runner that bypasses LLM calls
    RUNNER = None  # Will be handled specially in main.py
else:
    RUNNER = Runner(agent=root_agent, app_name=APP_NAME,
                    session_service=SESSION_SERVICE,
                    artifact_service=ARTIFACT_SERVICE)

