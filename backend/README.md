# Frontline Citizen Service Assistant

A multi-agent architecture for frontline workers to handle citizen queries related to health emergencies and crime reports.

## Architecture Overview

This system uses Google's Agent Development Kit (ADK) with multiple specialized agents:

- **Orchestrator Agent**: Routes queries to appropriate specialist agents
- **Health Agent**: Handles health-related emergencies and triage
- **Crime Agent**: Manages crime reports and police station guidance
- **Booking Agent**: Creates appointments and reservations
- **Follow-up Agent**: Generates confirmation messages
- **Lite Agent**: Fallback for degraded conditions (low battery/bandwidth)

## Features

- **Multi-Agent Workflow**: Sequential processing through specialized agents
- **Degraded Mode**: Automatic fallback to lite mode for poor connectivity
- **Location Services**: Finds nearest hospitals and police stations
- **Booking System**: Mock appointment booking with confirmation
- **Notification System**: SMS/Email/App push notifications
- **Persistence**: Firestore for case storage, GCS for artifacts
- **Safety Guardrails**: Content validation and filtering

## Quick Start

### Prerequisites

- Google Cloud Project with Vertex AI enabled
- Firestore database (Native mode)
- Cloud Storage bucket
- Service account with appropriate permissions

### Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export GOOGLE_CLOUD_PROJECT=your-project-id
export GOOGLE_CLOUD_LOCATION=us-central1
export GCS_BUCKET=your-bucket-name
```

3. Run the application:
```bash
uvicorn app.main:app --reload
```

### Testing Locally (Mock Mode)

For cost-free testing without Google Cloud setup:

1. Set mock mode:
```bash
export LLM_PROVIDER=mock
```

2. Run local tests:
```bash
python test_local.py
```

3. Start the server in mock mode:
```bash
uvicorn app.main:app --reload
```

4. Test with curl:
```bash
# Health emergency
curl -X POST localhost:8000/cases \
  -H "Content-Type: application/json" \
  -d '{"message":"I have chest pain","lat":24.815,"lon":67.030}'

# Crime report
curl -X POST localhost:8000/cases \
  -H "Content-Type: application/json" \
  -d '{"message":"Someone stole my wallet","lat":31.510,"lon":74.350}'

# Lite mode (low battery)
curl -X POST localhost:8000/cases \
  -H "Content-Type: application/json" \
  -d '{"message":"I need help","lat":33.71,"lon":73.06,"battery_pct":12}'
```

### Deployment

1. Build and deploy using Cloud Build:
```bash
gcloud builds submit --config infra/cloudbuild.yaml
```

2. Or manually:
```bash
# Build image
docker build -t gcr.io/$PROJECT_ID/frontline-adk .

# Push image
docker push gcr.io/$PROJECT_ID/frontline-adk

# Deploy to Cloud Run
gcloud run deploy frontline-adk \
  --image gcr.io/$PROJECT_ID/frontline-adk \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GCS_BUCKET=frontline-artifacts
```

## API Endpoints

### Create Case
```http
POST /cases
Content-Type: application/json

{
  "message": "I have chest pain and need help",
  "lat": 40.7128,
  "lon": -74.0060,
  "citizen_phone": "+1234567890",
  "battery_pct": 85,
  "bandwidth_kbps": 1000
}
```

### Get Case
```http
GET /cases/{case_id}
```

### Admin Metrics
```http
GET /admin/metrics?hours=24
```

### Daily Summary
```http
POST /admin/daily-summary
```

### Health Check
```http
GET /health
```

## Configuration

Key environment variables:

- `GEMINI_MODEL`: AI model to use (default: gemini-2.0-flash)
- `DEGRADED_BATTERY_PCT`: Battery threshold for lite mode (default: 20)
- `DEGRADED_MIN_KBPS`: Bandwidth threshold for lite mode (default: 64)
- `FIRESTORE_COLLECTION`: Firestore collection name (default: cases)
- `GCS_BUCKET`: Cloud Storage bucket for artifacts

## Data Files

The system uses CSV files for location data:

- `app/data/hospitals.csv`: Hospital locations and services
- `app/data/police_stations.csv`: Police station locations

## Monitoring

The system includes:

- Structured logging with request IDs
- Metrics collection for admin dashboard
- Error tracking and reporting
- Response time monitoring

## Security

- Content validation and filtering
- Sensitive information redaction
- Input sanitization
- Rate limiting (via Cloud Run)

## Cost Optimization

- Uses Gemini 2.0 Flash for cost efficiency
- Limited token usage with strict caps
- Efficient caching for location lookups
- Stateless design for horizontal scaling


gcloud auth application-default login
gcloud config set project

# Path to your downloaded JSON
export GOOGLE_APPLICATION_CREDENTIALS="/path/service-account.json"
export GOOGLE_CLOUD_PROJECT="your-project-id"
export LOCATION="asia-south1"   
 export GOOGLE_API_key=AIzaSyAp-hlFMMy4laQNZQ1xYuVnNNP2VVhsV8k


 gcloud config set project sinuous-origin-320221 


 #switching data base
 # Local Development
export DATABASE_TYPE=sqlite
export SQLITE_DB_PATH=frontline_cases.db

# Production
export DATABASE_TYPE=firestore
export GOOGLE_CLOUD_PROJECT=your-project-id