# 🎯 **Agent Logging System - Complete Guide**

## **Current Status: Mock Agents Only**

You're currently seeing **only mock agents** because the system is running in `LLM_PROVIDER=mock` mode. This is intentional for cost-free testing and development.

## **📊 What You're Seeing in the Logs**

### **Mock Mode Logs (Current)**
```json
{
  "event": "agent_selection",
  "case_type": "health",
  "lite_mode": false,
  "selected_agent": "health_agent",
  "routing_keywords": "i have severe chest pain"
}
```

```json
{
  "event": "agent_execution_start",
  "agent_name": "health_agent_mock",
  "input_keys": ["location", "message"]
}
```

```json
{
  "event": "agent_execution_complete",
  "agent_name": "health_agent_mock",
  "output_keys": ["target", "urgency"]
}
```

**❌ Missing in Mock Mode:**
- `gemini_request` logs
- `gemini_response` logs
- Token usage tracking
- Actual LLM API calls

## **🧠 How to See Real Gemini Agents**

### **Step 1: Switch to Real Mode**
```bash
# Stop current server
pkill -f "uvicorn app.main:app"

# Switch to real Gemini agents
export LLM_PROVIDER=vertex

# Start server
uvicorn app.main:app --reload --port 8000
```

### **Step 2: Ensure Google Cloud Setup**
```bash
# Set Google Cloud credentials
export GOOGLE_CLOUD_PROJECT=your-project-id
export GOOGLE_CLOUD_LOCATION=asia-south1

# Install dependencies (if not already installed)
pip install google-cloud-firestore google-cloud-storage
```

### **Step 3: Test Real Agents**
```bash
# Make a request
curl -X POST localhost:8000/cases \
  -H "Content-Type: application/json" \
  -d '{"message":"I have chest pain","lat":24.815,"lon":67.030}'
```

## **📈 Real Mode Logs You'll See**

### **Agent Selection (LLM-based)**
```json
{
  "event": "agent_selection",
  "case_type": "health",
  "lite_mode": false,
  "selected_agent": "health_agent",
  "routing_method": "llm_based"
}
```

### **Gemini API Request**
```json
{
  "event": "gemini_request",
  "model": "gemini-2.0-flash",
  "prompt_length": 150,
  "prompt_preview": "You are a frontline health assistant. Goals: 1) Classify urgency...",
  "temperature": 0.2,
  "max_tokens": 180
}
```

### **Gemini API Response**
```json
{
  "event": "gemini_response",
  "model": "gemini-2.0-flash",
  "response_length": 85,
  "response_preview": "Based on your symptoms, this appears to be a critical health emergency...",
  "tokens_used": 120
}
```

## **🔄 Mode Comparison**

| Aspect | Mock Mode | Real Mode |
|--------|-----------|-----------|
| **Speed** | ⚡ Instant | 🐌 2-5 seconds |
| **Cost** | 💰 Free | 💸 ~$0.01 per request |
| **Intelligence** | 🤖 Rule-based | 🧠 AI-powered |
| **Logs** | Basic workflow | Full Gemini API logs |
| **Reliability** | ✅ Predictable | ⚠️ Depends on API |

## **🎯 Current Logging Features**

### **✅ Working in Both Modes**
- **Workflow tracking**: `workflow_start`, `workflow_step`, `workflow_complete`
- **Agent execution**: `agent_execution_start`, `agent_execution_complete`
- **Database operations**: Save/retrieve with success/failure
- **Error handling**: Comprehensive error logging
- **Visual logging**: Color-coded console output

### **🧠 Additional in Real Mode**
- **Gemini API calls**: Full request/response logging
- **Token usage**: Track API costs
- **Prompt analysis**: See what's sent to Gemini
- **Response analysis**: See AI-generated responses

## **🔍 Debugging Agent Selection**

### **Mock Mode (Current)**
```bash
# Check routing keywords
grep "routing_keywords" logs/app.log

# See rule-based decisions
grep "agent_selection" logs/app.log | jq '.case_type, .selected_agent'
```

### **Real Mode**
```bash
# Check LLM-based routing
grep "gemini_request" logs/app.log | jq '.prompt_preview'

# See AI responses
grep "gemini_response" logs/app.log | jq '.response_preview'
```

## **🚀 Quick Test Commands**

### **Test Mock Mode (Current)**
```bash
export LLM_PROVIDER=mock
uvicorn app.main:app --reload --port 8000

# In another terminal
curl -X POST localhost:8000/cases \
  -H "Content-Type: application/json" \
  -d '{"message":"I have chest pain","lat":24.815,"lon":67.030}'
```

### **Test Real Mode**
```bash
export LLM_PROVIDER=vertex
uvicorn app.main:app --reload --port 8000

# In another terminal
curl -X POST localhost:8000/cases \
  -H "Content-Type: application/json" \
  -d '{"message":"I have chest pain","lat":24.815,"lon":67.030}'
```

## **💡 Key Insights**

1. **You're seeing mock agents because `LLM_PROVIDER=mock`**
2. **Mock mode is perfect for development and testing**
3. **Real mode shows actual Gemini API calls in logs**
4. **Both modes have comprehensive logging**
5. **Switch modes with environment variable**

## **🎉 Summary**

The logging system is **working perfectly**! You're seeing mock agents because that's the current mode. To see real Gemini agents:

1. **Switch**: `export LLM_PROVIDER=vertex`
2. **Restart**: `uvicorn app.main:app --reload --port 8000`
3. **Test**: Make a request and watch the logs

The enhanced logging will show you:
- **Mock mode**: Rule-based routing and fast responses
- **Real mode**: LLM-based routing, Gemini API calls, and AI responses

Both modes provide complete visibility into the multi-agent workflow! 🚀

