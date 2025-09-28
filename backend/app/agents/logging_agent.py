# Simple logging wrapper functions for real agents
from typing import Dict, Any, Optional
from app.callbacks.logging import gemini_logger_instance, agent_logger_instance
from app import state_keys as K

def log_agent_call(agent_name: str, request_id: str, variables: Dict[str, Any]):
    """Log agent execution start."""
    agent_logger_instance.log_agent_execution(
        request_id=request_id,
        agent_name=agent_name,
        input_data=variables
    )

def log_gemini_call(agent_name: str, model: str, request_id: str, prompt: str, temperature: float = 0.2, max_tokens: int = 180):
    """Log Gemini API request."""
    gemini_logger_instance.log_gemini_request(
        request_id=request_id,
        model=model,
        prompt=prompt,
        temperature=temperature,
        max_tokens=max_tokens
    )

def log_gemini_response(agent_name: str, model: str, request_id: str, response: str):
    """Log Gemini API response."""
    gemini_logger_instance.log_gemini_response(
        request_id=request_id,
        model=model,
        response=response,
        tokens_used=None
    )

def log_agent_completion(agent_name: str, request_id: str, output_data: Dict[str, Any]):
    """Log agent execution completion."""
    agent_logger_instance.log_agent_completion(
        request_id=request_id,
        agent_name=agent_name,
        output_data=output_data
    )

def log_gemini_error(agent_name: str, model: str, request_id: str, error: Exception):
    """Log Gemini API error."""
    gemini_logger_instance.log_gemini_error(
        request_id=request_id,
        model=model,
        error=error
    )
