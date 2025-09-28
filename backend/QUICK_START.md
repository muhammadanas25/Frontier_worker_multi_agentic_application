# Quick Start Guide

## 🚀 Test the System Locally (No Google Cloud Required)

### 1. Set up Mock Mode and Local Database
```bash
export LLM_PROVIDER=mock
export DATABASE_TYPE=sqlite
export SQLITE_DB_PATH=frontline_cases.db
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Local Tests
```bash
python3 test_local.py
```

### 4. Start the Server
```bash
uvicorn app.main:app --reload --port 8000
```

### 5. Test the API

#### Health Emergency
```bash
curl -X POST localhost:8000/cases \
  -H "Content-Type: application/json" \
  -d '{"message":"I have chest pain and need help","lat":24.815,"lon":67.030,"citizen_phone":"+1234567890"}'
```

#### Crime Report
```bash
curl -X POST localhost:8000/cases \
  -H "Content-Type: application/json" \
  -d '{"message":"Someone stole my wallet","lat":31.510,"lon":74.350}'
```

#### Lite Mode (Low Battery)
```bash
curl -X POST localhost:8000/cases \
  -H "Content-Type: application/json" \
  -d '{"message":"I need help","lat":33.71,"lon":73.06,"battery_pct":12,"bandwidth_kbps":30}'
```

#### Get Case Details
```bash
curl localhost:8000/cases/FC-XXXXXXXX
```

#### Admin Metrics
```bash
curl localhost:8000/admin/metrics
```

#### Daily Summary
```bash
curl -X POST localhost:8000/admin/daily-summary
```

## 🏗️ Deploy to Google Cloud

### 1. Set up Google Cloud
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2. Enable APIs
```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com firestore.googleapis.com storage.googleapis.com aiplatform.googleapis.com
```

### 3. Create Firestore Database
```bash
gcloud firestore databases create --region=us-central1
```

### 4. Create Storage Bucket
```bash
gsutil mb gs://frontline-artifacts
```

### 5. Deploy
```bash
./deploy.sh
```

## 📊 Expected Responses

### Health Emergency Response
```json
{
  "case_id": "FC-XXXXXXXX",
  "message": "Appointment booked: Regional Hospital at 27 Sep, 07:49 PM. Bring your ID card. Case ID: FC-XXXXXXXX",
  "record": {
    "case_id": "FC-XXXXXXXX",
    "case_type": "health",
    "urgency": "critical",
    "lite": false,
    "target": {
      "name": "Regional Hospital",
      "address": "654 Maple Dr",
      "phone": "555-0105"
    },
    "booking": {
      "confirmed": true,
      "place": "Regional Hospital",
      "slot_human": "27 Sep, 07:49 PM"
    }
  }
}
```

### Crime Report Response
```json
{
  "case_id": "FC-XXXXXXXX",
  "message": "Appointment booked: East Side Station at 27 Sep, 07:49 PM. Bring your ID card. Case ID: FC-XXXXXXXX",
  "record": {
    "case_id": "FC-XXXXXXXX",
    "case_type": "crime",
    "urgency": "medium",
    "lite": false,
    "target": {
      "station_name": "East Side Station",
      "address": "500 Lexington Ave",
      "phone": "555-0204"
    }
  }
}
```

### Lite Mode Response
```json
{
  "case_id": "FC-XXXXXXXX",
  "message": "Emergency: 112. Nearest: Regional Hospital. Case ID: FC-XXXXXXXX",
  "record": {
    "case_id": "FC-XXXXXXXX",
    "case_type": "health",
    "urgency": "medium",
    "lite": true
  }
}
```

## 🔧 Configuration

### Environment Variables
- `LLM_PROVIDER`: "mock" for testing, "vertex" for production
- `DATABASE_TYPE`: "sqlite" for local, "firestore" for production
- `SQLITE_DB_PATH`: "frontline_cases.db" (default)
- `GEMINI_MODEL`: "gemini-2.0-flash" (default)
- `DEGRADED_BATTERY_PCT`: 20 (default)
- `DEGRADED_MIN_KBPS`: 64 (default)
- `FIRESTORE_COLLECTION`: "cases" (default)
- `GCS_BUCKET`: "frontline-artifacts" (default)

### Mock Mode Features
- ✅ Keyword-based routing (health/crime detection)
- ✅ Location-based facility lookup
- ✅ Booking system simulation
- ✅ Degraded mode detection
- ✅ Lite mode responses
- ✅ No LLM costs

### Production Mode Features
- ✅ Gemini 2.0 Flash integration
- ✅ Advanced natural language processing
- ✅ Context-aware responses
- ✅ Firestore persistence
- ✅ Cloud Storage artifacts
- ✅ Admin metrics and summaries
