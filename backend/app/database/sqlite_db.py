import sqlite3
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.database.base import DatabaseInterface

class SQLiteDatabase(DatabaseInterface):
    """SQLite implementation of the database interface."""
    
    def __init__(self, db_path: str = "frontline_cases.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the SQLite database with required tables."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Create cases table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS cases (
                    case_id TEXT PRIMARY KEY,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    case_type TEXT NOT NULL,
                    urgency TEXT NOT NULL,
                    lite BOOLEAN DEFAULT FALSE,
                    target TEXT,  -- JSON string
                    booking TEXT,  -- JSON string
                    confirmation TEXT,
                    user_message TEXT,
                    location TEXT,  -- JSON string
                    battery_pct INTEGER,
                    bandwidth_kbps INTEGER,
                    citizen_phone TEXT,
                    lang TEXT DEFAULT 'en'
                )
            """)
            
            # Create indexes for better performance
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_case_type ON cases(case_type)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_created_at ON cases(created_at)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_urgency ON cases(urgency)")
            
            conn.commit()
    
    def save_case(self, case_id: str, record: Dict[str, Any]) -> bool:
        """Save a case record to SQLite."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Convert complex fields to JSON strings
                target_json = json.dumps(record.get('target')) if record.get('target') else None
                booking_json = json.dumps(record.get('booking')) if record.get('booking') else None
                location_json = json.dumps(record.get('location')) if record.get('location') else None
                
                cursor.execute("""
                    INSERT OR REPLACE INTO cases 
                    (case_id, created_at, case_type, urgency, lite, target, booking, 
                     confirmation, user_message, location, battery_pct, bandwidth_kbps, 
                     citizen_phone, lang)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    case_id,
                    record.get('created_at', datetime.utcnow()),
                    record.get('case_type', 'unknown'),
                    record.get('urgency', 'low'),
                    record.get('lite', False),
                    target_json,
                    booking_json,
                    record.get('confirmation', ''),
                    record.get('user_message', ''),
                    location_json,
                    record.get('battery_pct'),
                    record.get('bandwidth_kbps'),
                    record.get('citizen_phone'),
                    record.get('lang', 'en')
                ))
                
                conn.commit()
                return True
        except Exception as e:
            print(f"Error saving case to SQLite: {e}")
            return False
    
    def get_case(self, case_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a case by ID from SQLite."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM cases WHERE case_id = ?", (case_id,))
                row = cursor.fetchone()
                
                if row:
                    # Convert back to dictionary
                    columns = [description[0] for description in cursor.description]
                    case = dict(zip(columns, row))
                    
                    # Parse JSON fields
                    if case.get('target'):
                        case['target'] = json.loads(case['target'])
                    if case.get('booking'):
                        case['booking'] = json.loads(case['booking'])
                    if case.get('location'):
                        case['location'] = json.loads(case['location'])
                    
                    return case
                return None
        except Exception as e:
            print(f"Error retrieving case from SQLite: {e}")
            return None
    
    def update_case(self, case_id: str, updates: Dict[str, Any]) -> bool:
        """Update a case record in SQLite."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Build dynamic update query
                set_clauses = []
                values = []
                
                for key, value in updates.items():
                    if key in ['target', 'booking', 'location']:
                        set_clauses.append(f"{key} = ?")
                        values.append(json.dumps(value) if value else None)
                    else:
                        set_clauses.append(f"{key} = ?")
                        values.append(value)
                
                if set_clauses:
                    values.append(case_id)
                    query = f"UPDATE cases SET {', '.join(set_clauses)} WHERE case_id = ?"
                    cursor.execute(query, values)
                    conn.commit()
                    return True
                return False
        except Exception as e:
            print(f"Error updating case in SQLite: {e}")
            return False
    
    def list_cases(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """List cases with pagination from SQLite."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM cases 
                    ORDER BY created_at DESC 
                    LIMIT ? OFFSET ?
                """, (limit, offset))
                
                rows = cursor.fetchall()
                columns = [description[0] for description in cursor.description]
                
                cases = []
                for row in rows:
                    case = dict(zip(columns, row))
                    
                    # Parse JSON fields
                    if case.get('target'):
                        case['target'] = json.loads(case['target'])
                    if case.get('booking'):
                        case['booking'] = json.loads(case['booking'])
                    if case.get('location'):
                        case['location'] = json.loads(case['location'])
                    
                    cases.append(case)
                
                return cases
        except Exception as e:
            print(f"Error listing cases from SQLite: {e}")
            return []
    
    def count_cases_by_type(self, since_hours: Optional[int] = None) -> Dict[str, Any]:
        """Count cases by type from SQLite."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                if since_hours:
                    since_time = datetime.utcnow() - timedelta(hours=since_hours)
                    cursor.execute("""
                        SELECT case_type, COUNT(*) as count 
                        FROM cases 
                        WHERE created_at >= ? 
                        GROUP BY case_type
                    """, (since_time,))
                else:
                    cursor.execute("""
                        SELECT case_type, COUNT(*) as count 
                        FROM cases 
                        GROUP BY case_type
                    """)
                
                rows = cursor.fetchall()
                counts = {}
                total = 0
                
                for case_type, count in rows:
                    counts[case_type.lower()] = count
                    total += count
                
                return {"cases_by_type": counts, "total": total}
        except Exception as e:
            print(f"Error counting cases in SQLite: {e}")
            return {"cases_by_type": {}, "total": 0}
    
    def get_top_districts(self, hours: int = 24, limit: int = 5) -> Dict[str, Any]:
        """Get top districts by case volume from SQLite."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                since_time = datetime.utcnow() - timedelta(hours=hours)
                cursor.execute("""
                    SELECT target, lite, COUNT(*) as count
                    FROM cases 
                    WHERE created_at >= ?
                    GROUP BY target
                    ORDER BY count DESC
                    LIMIT ?
                """, (since_time, limit))
                
                rows = cursor.fetchall()
                districts = []
                lite_count = 0
                total = 0
                
                for target_json, lite, count in rows:
                    if target_json:
                        target = json.loads(target_json)
                        district = target.get('district', 'Unknown')
                        districts.append((district, count))
                        if lite:
                            lite_count += count
                        total += count
                
                lite_pct = round((lite_count / total) * 100, 1) if total > 0 else 0.0
                
                return {
                    "top": districts,
                    "lite_pct": lite_pct,
                    "total": total
                }
        except Exception as e:
            print(f"Error getting top districts from SQLite: {e}")
            return {"top": [], "lite_pct": 0.0, "total": 0}

