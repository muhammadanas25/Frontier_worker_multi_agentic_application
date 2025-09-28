from pydantic import BaseModel, Field
from typing import Optional

class CreateCase(BaseModel):
    message: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    citizen_phone: Optional[str] = None
    battery_pct: Optional[int] = Field(default=None, ge=0, le=100)
    bandwidth_kbps: Optional[int] = None
    lang: Optional[str] = "en"

class CaseResponse(BaseModel):
    case_id: str
    message: str
    record: dict

class CaseRecord(BaseModel):
    case_id: str
    case_type: str
    urgency: str
    lite: bool
    target: Optional[dict] = None
    booking: Optional[dict] = None
    confirmation: str

