from app import config
from typing import Optional

def detect_lite(battery_pct: Optional[int] = None, kbps: Optional[int] = None) -> bool:
    """Detect if the system should run in lite mode based on battery or bandwidth constraints."""
    if battery_pct is not None and battery_pct <= config.DEGRADED_BATTERY_PCT:
        return True
    if kbps is not None and kbps < config.DEGRADED_MIN_KBPS:
        return True
    return False
