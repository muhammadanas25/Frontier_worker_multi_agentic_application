import logging
import json
import uuid
from typing import Dict, Any, Optional
from datetime import datetime

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create specific loggers for different components
agent_logger = logging.getLogger("frontline.agents")
gemini_logger = logging.getLogger("frontline.gemini")
flow_logger = logging.getLogger("frontline.flow")

class StructuredLogger:
    """Structured logging for the frontline service."""
    
    def __init__(self, service_name: str = "frontline-service"):
        self.service_name = service_name
        self.logger = logging.getLogger(service_name)
    
    def log_request(self, request_id: str, endpoint: str, user_id: str, **kwargs):
        """Log incoming request."""
        log_data = {
            "event": "request_received",
            "request_id": request_id,
            "endpoint": endpoint,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
        self.logger.info(json.dumps(log_data))
    
    def log_agent_call(self, request_id: str, agent_name: str, input_data: Dict[str, Any], **kwargs):
        """Log agent invocation."""
        log_data = {
            "event": "agent_called",
            "request_id": request_id,
            "agent_name": agent_name,
            "input_keys": list(input_data.keys()),
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
        self.logger.info(json.dumps(log_data))
    
    def log_tool_call(self, request_id: str, tool_name: str, parameters: Dict[str, Any], **kwargs):
        """Log tool invocation."""
        log_data = {
            "event": "tool_called",
            "request_id": request_id,
            "tool_name": tool_name,
            "parameters": parameters,
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
        self.logger.info(json.dumps(log_data))
    
    def log_response(self, request_id: str, case_id: str, response_data: Dict[str, Any], **kwargs):
        """Log response generation."""
        log_data = {
            "event": "response_generated",
            "request_id": request_id,
            "case_id": case_id,
            "response_keys": list(response_data.keys()),
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
        self.logger.info(json.dumps(log_data))
    
    def log_error(self, request_id: str, error: Exception, **kwargs):
        """Log error occurrence."""
        log_data = {
            "event": "error_occurred",
            "request_id": request_id,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
        self.logger.error(json.dumps(log_data))

class AgentLogger:
    """Specialized logging for agent operations."""
    
    def log_agent_selection(self, request_id: str, case_type: str, lite_mode: bool, **kwargs):
        """Log agent selection decision."""
        log_data = {
            "event": "agent_selection",
            "request_id": request_id,
            "case_type": case_type,
            "lite_mode": lite_mode,
            "selected_agent": "lite_agent" if lite_mode else f"{case_type}_agent",
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
        agent_logger.info(json.dumps(log_data))
    
    def log_agent_execution(self, request_id: str, agent_name: str, input_data: Dict[str, Any], **kwargs):
        """Log agent execution start."""
        log_data = {
            "event": "agent_execution_start",
            "request_id": request_id,
            "agent_name": agent_name,
            "input_keys": list(input_data.keys()),
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
        agent_logger.info(json.dumps(log_data))
    
    def log_agent_completion(self, request_id: str, agent_name: str, output_data: Dict[str, Any], **kwargs):
        """Log agent execution completion."""
        log_data = {
            "event": "agent_execution_complete",
            "request_id": request_id,
            "agent_name": agent_name,
            "output_keys": list(output_data.keys()),
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
        agent_logger.info(json.dumps(log_data))

class GeminiLogger:
    """Specialized logging for Gemini API calls."""
    
    def log_gemini_request(self, request_id: str, model: str, prompt: str, temperature: float, max_tokens: int, **kwargs):
        """Log Gemini API request."""
        log_data = {
            "event": "gemini_request",
            "request_id": request_id,
            "model": model,
            "prompt_length": len(prompt),
            "prompt_preview": prompt[:200] + "..." if len(prompt) > 200 else prompt,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
        gemini_logger.info(json.dumps(log_data))
    
    def log_gemini_response(self, request_id: str, model: str, response: str, tokens_used: Optional[int] = None, **kwargs):
        """Log Gemini API response."""
        log_data = {
            "event": "gemini_response",
            "request_id": request_id,
            "model": model,
            "response_length": len(response),
            "response_preview": response[:200] + "..." if len(response) > 200 else response,
            "tokens_used": tokens_used,
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
        gemini_logger.info(json.dumps(log_data))
    
    def log_gemini_error(self, request_id: str, model: str, error: Exception, **kwargs):
        """Log Gemini API error."""
        log_data = {
            "event": "gemini_error",
            "request_id": request_id,
            "model": model,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
        gemini_logger.error(json.dumps(log_data))

class FlowLogger:
    """Specialized logging for workflow flow."""
    
    def log_workflow_start(self, request_id: str, user_message: str, location: Dict[str, Any], **kwargs):
        """Log workflow start."""
        log_data = {
            "event": "workflow_start",
            "request_id": request_id,
            "user_message": user_message,
            "location": location,
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
        flow_logger.info(json.dumps(log_data))
    
    def log_workflow_step(self, request_id: str, step: str, step_data: Dict[str, Any], **kwargs):
        """Log workflow step."""
        log_data = {
            "event": "workflow_step",
            "request_id": request_id,
            "step": step,
            "step_data": step_data,
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
        flow_logger.info(json.dumps(log_data))
    
    def log_workflow_complete(self, request_id: str, final_state: Dict[str, Any], **kwargs):
        """Log workflow completion."""
        log_data = {
            "event": "workflow_complete",
            "request_id": request_id,
            "final_state_keys": list(final_state.keys()),
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
        flow_logger.info(json.dumps(log_data))

# Global logger instances
structured_logger = StructuredLogger()
agent_logger_instance = AgentLogger()
gemini_logger_instance = GeminiLogger()
flow_logger_instance = FlowLogger()
