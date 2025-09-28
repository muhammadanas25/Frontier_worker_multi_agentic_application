from typing import Optional
from app.database.base import DatabaseInterface
from app.database.sqlite_db import SQLiteDatabase
from app import config

try:
    from app.database.firestore_db import FirestoreDatabase
    FIRESTORE_AVAILABLE = True
except ImportError:
    FIRESTORE_AVAILABLE = False
    FirestoreDatabase = None

def get_database() -> DatabaseInterface:
    """Factory function to get the appropriate database implementation."""
    db_type = config.DATABASE_TYPE.lower()
    
    if db_type == "sqlite":
        return SQLiteDatabase()
    elif db_type == "firestore":
        if FIRESTORE_AVAILABLE:
            return FirestoreDatabase()
        else:
            print("Firestore not available, falling back to SQLite")
            return SQLiteDatabase()
    else:
        # Default to SQLite for local development
        print(f"Unknown database type '{db_type}', defaulting to SQLite")
        return SQLiteDatabase()

# Global database instance
_db_instance: Optional[DatabaseInterface] = None

def get_db() -> DatabaseInterface:
    """Get the global database instance (singleton pattern)."""
    global _db_instance
    if _db_instance is None:
        _db_instance = get_database()
    return _db_instance
