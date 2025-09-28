from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime

class DatabaseInterface(ABC):
    """Abstract base class for database operations."""
    
    @abstractmethod
    def save_case(self, case_id: str, record: Dict[str, Any]) -> bool:
        """Save a case record."""
        pass
    
    @abstractmethod
    def get_case(self, case_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a case by ID."""
        pass
    
    @abstractmethod
    def update_case(self, case_id: str, updates: Dict[str, Any]) -> bool:
        """Update a case record."""
        pass
    
    @abstractmethod
    def list_cases(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """List cases with pagination."""
        pass
    
    @abstractmethod
    def count_cases_by_type(self, since_hours: Optional[int] = None) -> Dict[str, Any]:
        """Count cases by type."""
        pass
    
    @abstractmethod
    def get_top_districts(self, hours: int = 24, limit: int = 5) -> Dict[str, Any]:
        """Get top districts by case volume."""
        pass

