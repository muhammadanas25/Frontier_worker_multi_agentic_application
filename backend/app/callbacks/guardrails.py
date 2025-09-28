import re
from typing import Dict, Any, Optional
from app.callbacks.logging import structured_logger

class Guardrails:
    """Safety and content guardrails for the frontline service."""
    
    def __init__(self):
        self.max_tokens = 1000
        self.max_message_length = 2000
        self.blocked_patterns = [
            r'\b(terrorist|bomb|explosive|weapon)\b',
            r'\b(suicide|kill myself|end my life)\b',
            r'\b(hack|cyber attack|malware)\b'
        ]
        self.sensitive_patterns = [
            r'\b(ssn|social security|credit card|password)\b',
            r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',  # Credit card
            r'\b\d{3}-\d{2}-\d{4}\b'  # SSN
        ]
    
    def validate_input(self, message: str, request_id: str) -> Dict[str, Any]:
        """Validate and sanitize user input."""
        result = {
            "valid": True,
            "sanitized_message": message,
            "warnings": [],
            "blocked": False
        }
        
        # Check message length
        if len(message) > self.max_message_length:
            result["valid"] = False
            result["warnings"].append("Message too long")
            structured_logger.log_error(request_id, ValueError("Message too long"))
            return result
        
        # Check for blocked patterns
        for pattern in self.blocked_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                result["blocked"] = True
                result["valid"] = False
                result["warnings"].append("Content contains blocked keywords")
                structured_logger.log_error(request_id, ValueError("Blocked content detected"))
                return result
        
        # Check for sensitive information
        for pattern in self.sensitive_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                result["sanitized_message"] = re.sub(pattern, "[REDACTED]", message, flags=re.IGNORECASE)
                result["warnings"].append("Sensitive information detected and redacted")
        
        return result
    
    def validate_response(self, response: str, request_id: str) -> Dict[str, Any]:
        """Validate agent response."""
        result = {
            "valid": True,
            "sanitized_response": response,
            "warnings": []
        }
        
        # Check response length
        if len(response) > self.max_tokens * 4:  # Rough token estimate
            result["warnings"].append("Response may be too long")
        
        # Check for inappropriate content
        for pattern in self.blocked_patterns:
            if re.search(pattern, response, re.IGNORECASE):
                result["valid"] = False
                result["warnings"].append("Response contains inappropriate content")
                structured_logger.log_error(request_id, ValueError("Inappropriate response"))
                return result
        
        return result
    
    def truncate_content(self, content: str, max_length: int = 500) -> str:
        """Truncate content to maximum length."""
        if len(content) <= max_length:
            return content
        return content[:max_length-3] + "..."

# Global guardrails instance
guardrails = Guardrails()

