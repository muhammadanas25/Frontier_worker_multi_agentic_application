import csv
import math
import pathlib
from typing import Optional, Dict, Any

DATA_DIR = pathlib.Path(__file__).parent.parent / "data"

def _load_csv(name: str):
    """Load CSV data from the data directory."""
    with open(DATA_DIR / name, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

HOSPITALS = _load_csv("hospital.csv")
POLICE = _load_csv("police_station.csv")

def _haversine(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points on Earth."""
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat/2)**2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
         math.sin(dlon/2)**2)
    return 2 * R * math.asin(math.sqrt(a))

def nearest_hospital(lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
    """Find the nearest hospital to the given coordinates."""
    if not HOSPITALS:
        return {}
    if lat is None or lon is None:
        return HOSPITALS[0]
    return min(HOSPITALS, 
               key=lambda h: _haversine(lat, lon, 
                                      float(h.get("lat", 0) or 0), 
                                      float(h.get("lon", 0) or 0)))

def nearest_police(lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
    """Find the nearest police station to the given coordinates."""
    if not POLICE:
        return {}
    if lat is None or lon is None:
        return POLICE[0]
    return min(POLICE, 
               key=lambda p: _haversine(lat, lon, 
                                      float(p.get("lat", 0) or 0), 
                                      float(p.get("lon", 0) or 0)))
