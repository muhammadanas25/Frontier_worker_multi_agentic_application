from google.cloud import storage
from app import config
import json
import uuid

_client = storage.Client()
_bucket = _client.bucket(config.GCS_BUCKET)

def save_artifact(content: str, content_type: str = "text/plain", filename: str | None = None) -> str:
    """Save artifact to GCS and return the blob name."""
    if not filename:
        filename = f"artifact_{uuid.uuid4().hex[:8]}.txt"
    
    blob = _bucket.blob(filename)
    blob.upload_from_string(content, content_type=content_type)
    return filename

def load_artifact(filename: str) -> str | None:
    """Load artifact from GCS."""
    try:
        blob = _bucket.blob(filename)
        return blob.download_as_text()
    except Exception:
        return None

def save_case_artifact(case_id: str, content: str, artifact_type: str = "report") -> str:
    """Save case-specific artifact to GCS."""
    filename = f"cases/{case_id}/{artifact_type}_{uuid.uuid4().hex[:8]}.txt"
    return save_artifact(content, filename=filename)

def list_case_artifacts(case_id: str) -> list:
    """List all artifacts for a specific case."""
    prefix = f"cases/{case_id}/"
    blobs = _bucket.list_blobs(prefix=prefix)
    return [blob.name for blob in blobs]

