# Database Configuration Guide

## 🗄️ **Dynamic Database Switching**

The system now supports both **SQLite** (local development) and **Firestore** (production) with automatic switching based on environment variables.

## 🚀 **Quick Setup**

### Local Development (SQLite)
```bash
export DATABASE_TYPE=sqlite
export SQLITE_DB_PATH=frontline_cases.db
export LLM_PROVIDER=mock
```

### Production (Firestore)
```bash
export DATABASE_TYPE=firestore
export GOOGLE_CLOUD_PROJECT=your-project-id
export FIRESTORE_COLLECTION=cases
export LLM_PROVIDER=vertex
```

## 📊 **Database Features**

### SQLite Implementation
- ✅ **Zero Dependencies**: No Google Cloud setup required
- ✅ **Full CRUD Operations**: Save, retrieve, update, list cases
- ✅ **Metrics Support**: Case counts, top districts, lite mode stats
- ✅ **JSON Storage**: Complex objects stored as JSON strings
- ✅ **Indexing**: Optimized queries with proper indexes
- ✅ **Pagination**: Efficient list operations with limit/offset

### Firestore Implementation
- ✅ **Cloud Scale**: Handles millions of documents
- ✅ **Real-time Updates**: Live data synchronization
- ✅ **Advanced Queries**: Complex filtering and aggregation
- ✅ **Security Rules**: Fine-grained access control
- ✅ **Backup & Recovery**: Automatic data protection

## 🔧 **Database Schema**

### Cases Table (SQLite)
```sql
CREATE TABLE cases (
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
);
```

### Firestore Collection
```json
{
  "case_id": "FC-XXXXXXXX",
  "created_at": "2025-09-27T20:47:55.036039Z",
  "case_type": "health",
  "urgency": "critical",
  "lite": false,
  "target": {
    "name": "Civil Hospital Karachi",
    "address": "M.A. Jinnah Rd, Karachi",
    "district": "Karachi South"
  },
  "booking": {
    "confirmed": true,
    "place": "Civil Hospital Karachi",
    "slot_human": "27 Sep, 10:47 PM"
  },
  "confirmation": "Appointment booked...",
  "user_message": "I have chest pain",
  "location": {"lat": 24.815, "lon": 67.030}
}
```

## 🧪 **Testing Results**

### SQLite Performance
```
✅ Save case: Success
✅ Retrieve case: Success
✅ List cases: Found 3 cases
✅ Metrics - Total cases: 3
   Cases by type: {'crime': 1, 'health': 2}
✅ Top districts: 3 districts
   Lite mode %: 33.3%
```

### API Endpoints Working
- ✅ `POST /cases` - Create cases with SQLite storage
- ✅ `GET /cases/{id}` - Retrieve case details
- ✅ `GET /admin/metrics` - Real-time case statistics
- ✅ `POST /admin/daily-summary` - AI-generated summaries

## 🔄 **Switching Between Databases**

### From SQLite to Firestore
1. Install Google Cloud dependencies:
   ```bash
   pip install google-cloud-firestore
   ```

2. Set up authentication:
   ```bash
   gcloud auth application-default login
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
   ```

3. Change environment variables:
   ```bash
   export DATABASE_TYPE=firestore
   export GOOGLE_CLOUD_PROJECT=your-project-id
   ```

### From Firestore to SQLite
1. Change environment variables:
   ```bash
   export DATABASE_TYPE=sqlite
   export SQLITE_DB_PATH=frontline_cases.db
   ```

2. The system will automatically create the SQLite database

## 📈 **Performance Comparison**

| Feature | SQLite | Firestore |
|---------|--------|-----------|
| **Setup Time** | Instant | 5-10 minutes |
| **Dependencies** | None | Google Cloud SDK |
| **Cost** | Free | Pay per operation |
| **Scalability** | Single machine | Global scale |
| **Query Speed** | Very fast | Fast (network) |
| **Offline Support** | Yes | Limited |
| **Backup** | Manual | Automatic |

## 🛠️ **Development Workflow**

### 1. Local Development
```bash
# Start with SQLite
export DATABASE_TYPE=sqlite
export LLM_PROVIDER=mock
python3 test_local.py
uvicorn app.main:app --reload
```

### 2. Testing
```bash
# Test all functionality
curl -X POST localhost:8000/cases \
  -H "Content-Type: application/json" \
  -d '{"message":"I have chest pain","lat":24.815,"lon":67.030}'

curl localhost:8000/admin/metrics
```

### 3. Production Deployment
```bash
# Deploy with Firestore
export DATABASE_TYPE=firestore
./deploy.sh
```

## 🎯 **Key Benefits**

1. **Zero Setup Development**: Start coding immediately with SQLite
2. **Production Ready**: Seamless switch to Firestore for scale
3. **Cost Effective**: No charges during development
4. **Data Consistency**: Same API regardless of database
5. **Easy Migration**: Simple environment variable change
6. **Full Feature Parity**: All functionality works with both databases

## 📝 **Environment Variables**

| Variable | SQLite | Firestore | Description |
|----------|--------|-----------|-------------|
| `DATABASE_TYPE` | `sqlite` | `firestore` | Database type |
| `SQLITE_DB_PATH` | `frontline_cases.db` | - | SQLite file path |
| `GOOGLE_CLOUD_PROJECT` | - | `your-project-id` | GCP project |
| `FIRESTORE_COLLECTION` | - | `cases` | Firestore collection |
| `LLM_PROVIDER` | `mock` | `vertex` | LLM provider |

The system is now **production-ready** with flexible database options for any deployment scenario!

