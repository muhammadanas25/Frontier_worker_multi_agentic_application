from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.database.factory import get_db
from app.tools.storage import list_cases
from app.callbacks.logging import structured_logger

def counts_by_type(since_hours: int | None = None) -> Dict[str, Any]:
    """Get case counts by type from database."""
    db = get_db()
    return db.count_cases_by_type(since_hours)

def top_districts_since(hours: int = 24, limit: int = 5):
    """Get top districts by case volume."""
    db = get_db()
    return db.get_top_districts(hours, limit)

class MetricsCollector:
    """Simple metrics collection for admin dashboard."""
    
    def __init__(self):
        self.metrics = {
            "total_cases": 0,
            "cases_by_type": {},
            "cases_by_urgency": {},
            "lite_mode_usage": 0,
            "response_times": [],
            "error_count": 0
        }
    
    def record_case(self, case_data: Dict[str, Any]):
        """Record a new case for metrics."""
        self.metrics["total_cases"] += 1
        
        case_type = case_data.get("case_type", "unknown")
        self.metrics["cases_by_type"][case_type] = self.metrics["cases_by_type"].get(case_type, 0) + 1
        
        urgency = case_data.get("urgency", "low")
        self.metrics["cases_by_urgency"][urgency] = self.metrics["cases_by_urgency"].get(urgency, 0) + 1
        
        if case_data.get("lite", False):
            self.metrics["lite_mode_usage"] += 1
    
    def record_response_time(self, response_time_ms: float):
        """Record response time."""
        self.metrics["response_times"].append(response_time_ms)
        # Keep only last 1000 response times
        if len(self.metrics["response_times"]) > 1000:
            self.metrics["response_times"] = self.metrics["response_times"][-1000:]
    
    def record_error(self):
        """Record an error occurrence."""
        self.metrics["error_count"] += 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics."""
        response_times = self.metrics["response_times"]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        return {
            "total_cases": self.metrics["total_cases"],
            "cases_by_type": self.metrics["cases_by_type"],
            "cases_by_urgency": self.metrics["cases_by_urgency"],
            "lite_mode_usage": self.metrics["lite_mode_usage"],
            "lite_mode_percentage": (self.metrics["lite_mode_usage"] / max(self.metrics["total_cases"], 1)) * 100,
            "average_response_time_ms": avg_response_time,
            "error_count": self.metrics["error_count"],
            "error_rate": (self.metrics["error_count"] / max(self.metrics["total_cases"], 1)) * 100,
            "last_updated": datetime.utcnow().isoformat()
        }
    
    def get_recent_cases(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Get recent cases for analysis."""
        try:
            all_cases = list_cases(limit=1000)
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)
            
            recent_cases = []
            for case in all_cases:
                # Assuming case has a timestamp field
                if "timestamp" in case:
                    case_time = datetime.fromisoformat(case["timestamp"].replace("Z", "+00:00"))
                    if case_time >= cutoff_time:
                        recent_cases.append(case)
            
            return recent_cases
        except Exception as e:
            structured_logger.log_error("metrics", e, operation="get_recent_cases")
            return []

# Global metrics collector
metrics_collector = MetricsCollector()
