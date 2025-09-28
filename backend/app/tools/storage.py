from app.database.factory import get_db

def save_case(case_id: str, record: dict) -> bool:
    """Save case record to database."""
    db = get_db()
    return db.save_case(case_id, record)

def get_case(case_id: str) -> dict | None:
    """Retrieve case record from database."""
    db = get_db()
    return db.get_case(case_id)

def update_case(case_id: str, updates: dict) -> bool:
    """Update case record in database."""
    db = get_db()
    return db.update_case(case_id, updates)

def list_cases(limit: int = 100, offset: int = 0) -> list:
    """List recent cases from database."""
    db = get_db()
    return db.list_cases(limit, offset)
