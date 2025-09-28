# Enhanced Logging System Guide

## 🎯 **Overview**

The Frontline Citizen Service Assistant now includes comprehensive logging that tracks:
- **Agent Selection**: Which agent is chosen and why
- **Agent Execution**: What inputs are provided and outputs generated
- **Workflow Flow**: Complete step-by-step process tracking
- **Database Operations**: Save/retrieve operations with results
- **Gemini API Calls**: Requests, responses, and token usage (when using real LLM)
- **Error Handling**: Detailed error tracking and debugging information

## 📊 **Log Categories**

### 1. **Agent Logs** (`frontline.agents`)
Tracks agent selection and execution:

```json
{
  "event": "agent_selection",
  "request_id": "FC-DEMO001",
  "case_type": "health",
  "lite_mode": false,
  "selected_agent": "health_agent",
  "routing_keywords": "i have severe chest pain and shortness of breath"
}
```

```json
{
  "event": "agent_execution_start",
  "request_id": "FC-DEMO001",
  "agent_name": "health_agent_mock",
  "input_keys": ["location", "message"]
}
```

```json
{
  "event": "agent_execution_complete",
  "request_id": "FC-DEMO001",
  "agent_name": "health_agent_mock",
  "output_keys": ["target", "urgency"]
}
```

### 2. **Flow Logs** (`frontline.flow`)
Tracks the complete workflow:

```json
{
  "event": "workflow_start",
  "request_id": "FC-DEMO001",
  "user_message": "I have severe chest pain and shortness of breath",
  "location": {"lat": 24.815, "lon": 67.03},
  "mode": "mock"
}
```

```json
{
  "event": "workflow_step",
  "request_id": "FC-DEMO001",
  "step": "booking_creation",
  "step_data": {"target": {"name": "Civil Hospital Karachi"}}
}
```

```json
{
  "event": "workflow_complete",
  "request_id": "FC-DEMO001",
  "final_state_keys": ["case_id", "case_type", "urgency", "target", "booking"]
}
```

### 3. **Gemini Logs** (`frontline.gemini`)
Tracks LLM API calls (when not in mock mode):

```json
{
  "event": "gemini_request",
  "request_id": "FC-DEMO001",
  "model": "gemini-2.0-flash",
  "prompt_length": 150,
  "prompt_preview": "You are a frontline health assistant...",
  "temperature": 0.2,
  "max_tokens": 180
}
```

```json
{
  "event": "gemini_response",
  "request_id": "FC-DEMO001",
  "model": "gemini-2.0-flash",
  "response_length": 85,
  "response_preview": "Based on your symptoms, this appears to be a critical health emergency...",
  "tokens_used": 120
}
```

## 🎨 **Visual Logging**

The system includes enhanced visual logging with:

### **Console Output**
```
🤖 ==================== PROCESSING CASE FC-DEMO001 ====================
Mode: MOCK | Database: sqlite

📋 CASE SUMMARY
   ID: FC-DEMO001
   Type: HEALTH
   Urgency: CRITICAL
   Mode: FULL
   Target: Civil Hospital Karachi
   Time: 02:34:42

💾 DATABASE: Saving to sqlite
💾 DATABASE: ✅ Success

📱 NOTIFICATION: Sending SMS to +1234567890

🎉 CASE COMPLETED SUCCESSFULLY
   Response: Appointment booked: Civil Hospital Karachi at 27 Sep, 11:34 PM. Bring your ID card...
🎉 ============================================================
```

### **Color-Coded Logs**
- 🟢 **INFO**: Green for normal operations
- 🟡 **WARNING**: Yellow for warnings
- 🔴 **ERROR**: Red for errors
- 🔵 **DEBUG**: Cyan for debug information

## 🔍 **Log Analysis**

### **Agent Selection Patterns**
```bash
# Find all health agent selections
grep "selected_agent.*health_agent" logs/app.log

# Find lite mode activations
grep "lite_mode.*true" logs/app.log

# Find routing keywords
grep "routing_keywords" logs/app.log
```

### **Performance Tracking**
```bash
# Track workflow completion times
grep "workflow_complete" logs/app.log | jq '.timestamp'

# Monitor database operations
grep "DATABASE.*Success" logs/app.log

# Check error rates
grep "error_occurred" logs/app.log | wc -l
```

### **Case Type Distribution**
```bash
# Count cases by type
grep "case_type" logs/app.log | jq -r '.case_type' | sort | uniq -c

# Track urgency levels
grep "urgency" logs/app.log | jq -r '.urgency' | sort | uniq -c
```

## 🛠️ **Configuration**

### **Log Levels**
```python
# In app/logging_config.py
loggers_config = {
    'frontline.agents': {'level': logging.INFO},
    'frontline.gemini': {'level': logging.INFO},
    'frontline.flow': {'level': logging.INFO},
    'uvicorn': {'level': logging.WARNING},  # Reduce noise
}
```

### **Environment Variables**
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Disable visual logging
export DISABLE_VISUAL_LOGS=true

# Log to file
export LOG_FILE=logs/frontline.log
```

## 📈 **Monitoring Dashboard**

### **Key Metrics to Track**
1. **Agent Selection Accuracy**
   - Health vs Crime classification
   - Lite mode activation rate
   - Unknown case handling

2. **Performance Metrics**
   - Average processing time
   - Database operation success rate
   - Error rates by component

3. **Usage Patterns**
   - Peak usage times
   - Geographic distribution
   - Case type trends

### **Sample Queries**
```bash
# Most common case types
grep "case_type" logs/app.log | jq -r '.case_type' | sort | uniq -c | sort -nr

# Lite mode usage percentage
TOTAL=$(grep "agent_selection" logs/app.log | wc -l)
LITE=$(grep "lite_mode.*true" logs/app.log | wc -l)
echo "Lite mode usage: $((LITE * 100 / TOTAL))%"

# Average response time
grep "workflow_complete" logs/app.log | jq -r '.timestamp' | head -10
```

## 🚨 **Error Handling**

### **Common Error Patterns**
1. **Database Connection Issues**
   ```json
   {
     "event": "error_occurred",
     "error_type": "DatabaseError",
     "error_message": "Connection to SQLite failed"
   }
   ```

2. **Agent Execution Failures**
   ```json
   {
     "event": "error_occurred",
     "error_type": "AgentError",
     "error_message": "Health agent failed to process request"
   }
   ```

3. **Gemini API Errors**
   ```json
   {
     "event": "gemini_error",
     "error_type": "APIError",
     "error_message": "Rate limit exceeded"
   }
   ```

## 📝 **Best Practices**

### **For Development**
1. **Use Mock Mode**: Set `LLM_PROVIDER=mock` for cost-free testing
2. **Enable Debug Logs**: Use `LOG_LEVEL=DEBUG` for detailed information
3. **Monitor Agent Selection**: Check routing accuracy regularly
4. **Track Performance**: Monitor processing times and success rates

### **For Production**
1. **Structured Logging**: Use JSON format for log aggregation
2. **Log Rotation**: Implement log rotation to manage disk space
3. **Alerting**: Set up alerts for error rates and performance issues
4. **Retention**: Define log retention policies

## 🎯 **Debugging Workflow**

### **Step 1: Identify the Issue**
```bash
# Check recent errors
tail -100 logs/app.log | grep ERROR

# Check specific case
grep "FC-XXXXXXXX" logs/app.log
```

### **Step 2: Trace the Flow**
```bash
# Follow a specific request
grep "FC-XXXXXXXX" logs/app.log | jq '.'
```

### **Step 3: Analyze Patterns**
```bash
# Check agent selection patterns
grep "agent_selection" logs/app.log | jq '.case_type, .lite_mode, .selected_agent'

# Check performance metrics
grep "workflow_complete" logs/app.log | jq '.timestamp'
```

## 🚀 **Quick Start**

### **Enable Enhanced Logging**
```bash
export LLM_PROVIDER=mock
export DATABASE_TYPE=sqlite
python3 test_logging_demo.py
```

### **View Real-time Logs**
```bash
# Start server with enhanced logging
uvicorn app.main:app --reload --port 8000

# In another terminal, make requests
curl -X POST localhost:8000/cases \
  -H "Content-Type: application/json" \
  -d '{"message":"I have chest pain","lat":24.815,"lon":67.030}'
```

The enhanced logging system provides complete visibility into the multi-agent workflow, making debugging and optimization much easier!

