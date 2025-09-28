from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.database.base import DatabaseInterface
from app import config

try:
    from google.cloud import firestore
    FIRESTORE_AVAILABLE = True
except ImportError:
    FIRESTORE_AVAILABLE = False
    firestore = None

class FirestoreDatabase(DatabaseInterface):
    """Firestore implementation of the database interface."""
    
    def __init__(self):
        if not FIRESTORE_AVAILABLE:
            raise ImportError("Google Cloud Firestore is not available. Install google-cloud-firestore or use SQLite.")
        self.db = firestore.Client()
        self.collection = config.FIRESTORE_COLLECTION
    
    def save_case(self, case_id: str, record: Dict[str, Any]) -> bool:
        """Save a case record to Firestore."""
        try:
            self.db.collection(self.collection).document(case_id).set(record)
            return True
        except Exception as e:
            print(f"Error saving case to Firestore: {e}")
            return False
    
    def get_case(self, case_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a case by ID from Firestore."""
        try:
            doc = self.db.collection(self.collection).document(case_id).get()
            return doc.to_dict() if doc.exists else None
        except Exception as e:
            print(f"Error retrieving case from Firestore: {e}")
            return None
    
    def update_case(self, case_id: str, updates: Dict[str, Any]) -> bool:
        """Update a case record in Firestore."""
        try:
            self.db.collection(self.collection).document(case_id).update(updates)
            return True
        except Exception as e:
            print(f"Error updating case in Firestore: {e}")
            return False
    
    def list_cases(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """List cases with pagination from Firestore."""
        try:
            docs = self.db.collection(self.collection).limit(limit).offset(offset).stream()
            return [{"id": doc.id, **doc.to_dict()} for doc in docs]
        except Exception as e:
            print(f"Error listing cases from Firestore: {e}")
            return []
    
    def count_cases_by_type(self, since_hours: Optional[int] = None) -> Dict[str, Any]:
        """Count cases by type from Firestore."""
        try:
            if since_hours:
                start = datetime.utcnow() - timedelta(hours=since_hours)
                q = self.db.collection(self.collection).where("created_at", ">=", start)
            else:
                q = self.db.collection(self.collection)
            
            docs = q.stream()
            counts = {}
            total = 0
            
            for doc in docs:
                data = doc.to_dict()
                case_type = (data.get("case_type") or "unknown").lower()
                counts[case_type] = counts.get(case_type, 0) + 1
                total += 1
            
            return {"cases_by_type": counts, "total": total}
        except Exception as e:
            print(f"Error counting cases in Firestore: {e}")
            return {"cases_by_type": {}, "total": 0}
    
    def get_top_districts(self, hours: int = 24, limit: int = 5) -> Dict[str, Any]:
        """Get top districts by case volume from Firestore."""
        try:
            start = datetime.utcnow() - timedelta(hours=hours)
            q = self.db.collection(self.collection).where("created_at", ">=", start)
            
            counts = {}
            lite = 0
            total = 0
            
            for doc in q.stream():
                data = doc.to_dict()
                target = data.get("target", {}) or {}
                district = target.get("district", "Unknown")
                counts[district] = counts.get(district, 0) + 1
                if data.get("lite"):
                    lite += 1
                total += 1
            
            ranked = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:limit]
            lite_pct = round((lite / total) * 100, 1) if total > 0 else 0.0
            
            return {"top": ranked, "lite_pct": lite_pct, "total": total}
        except Exception as e:
            print(f"Error getting top districts from Firestore: {e}")
            return {"top": [], "lite_pct": 0.0, "total": 0}
