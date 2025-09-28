import os
from pathlib import Path

# Load .env from repository root (if present) into environment for convenience.
# This is dependency-free and only sets variables that are not already present.
try:
	_repo_root = Path(__file__).resolve().parents[2]
	_env_file = _repo_root / '.env'
	if _env_file.exists():
		with _env_file.open() as _f:
			for _line in _f:
				_line = _line.strip()
				if not _line or _line.startswith('#'):
					continue
				if '=' not in _line:
					continue
				_k, _v = _line.split('=', 1)
				_k = _k.strip()
				_v = _v.strip().strip('"').strip("'")
				if _k and os.getenv(_k) is None:
					os.environ[_k] = _v
except Exception:
	# Be defensive: don't fail import if .env parsing has issues.
	pass

# Gemini via Vertex AI
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
# Required: GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION set in Cloud Run

# Data knobs
DEGRADED_BATTERY_PCT = int(os.getenv("DEGRADED_BATTERY_PCT", "20"))
DEGRADED_MIN_KBPS = int(os.getenv("DEGRADED_MIN_KBPS", "64"))

# Persistence
FIRESTORE_COLLECTION = os.getenv("FIRESTORE_COLLECTION", "cases")
GCS_BUCKET = os.getenv("GCS_BUCKET", "frontline-artifacts")

# SMS/Email providers (abstracted)
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "console")  # "console" for MVP
EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "console")

# LLM Provider for cost control
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "vertex")  # "vertex" | "mock"
print(f"************LLM_PROVIDER***********: {LLM_PROVIDER}")
print(f"************GOOGLE_CLOUD_PROJECT***********: {os.getenv('GOOGLE_CLOUD_PROJECT')}")
print(f"************GOOGLE_CLOUD_LOCATION***********: {os.getenv('GOOGLE_CLOUD_LOCATION')}")
# If using Vertex, ensure project and location are set. If not, fall back to mock
if LLM_PROVIDER == 'vertex':
	_proj = os.getenv('GOOGLE_CLOUD_PROJECT')
	_loc = os.getenv('GOOGLE_CLOUD_LOCATION')
    
	if not _proj or not _loc:
		print("WARNING: GOOGLE_CLOUD_PROJECT and/or GOOGLE_CLOUD_LOCATION not set.")
		print("Falling back to LLM_PROVIDER=mock to avoid Vertex API errors.")
		print("To use Vertex, set these and restart, e.g.:\n  export GOOGLE_CLOUD_PROJECT=your-project-id\n  export GOOGLE_CLOUD_LOCATION=asia-south1")
		LLM_PROVIDER = 'mock'
		os.environ['LLM_PROVIDER'] = 'mock'
	else:
		# Enable Vertex backend for google.genai when fully configured
		os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "TRUE")
# Database configuration
DATABASE_TYPE = os.getenv("DATABASE_TYPE", "sqlite")  # "sqlite" | "firestore"
SQLITE_DB_PATH = os.getenv("SQLITE_DB_PATH", "frontline_cases.db")
