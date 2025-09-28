import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY || ""
});

export interface TriageAssessment {
  priority: "critical" | "high" | "medium" | "low";
  assessment: string;
  confidence: number;
  recommendedActions: string[];
  estimatedResponseTime: string;
  emergencyType: "medical" | "crime" | "fire" | "flood" | "earthquake" | "urban" | "public_safety" | "unknown";
  urgencyLevel: "critical" | "high" | "medium" | "unknown";
}

export interface ServiceRecommendation {
  serviceType: string;
  reasoning: string;
  urgency: string;
  specialRequirements: string[];
}

export async function analyzeEmergencyTriage(
  description: string,
  location: string
): Promise<TriageAssessment> {
  try {
    const prompt = `As an emergency triage AI expert, analyze this emergency situation and provide a detailed assessment:

Description: ${description}
Location: ${location}

From the description, determine:
1. The specific emergency type (medical, crime, fire, flood, earthquake, urban, public_safety, or unknown)
2. The urgency level (critical, high, medium, or unknown)
3. Life-threatening potential
4. Time sensitivity
5. Resource requirements
6. Patient safety
7. Public health implications

Provide a comprehensive triage assessment with detected emergency type, urgency level, priority, detailed analysis, confidence score, recommended actions, and estimated response time.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            priority: { 
              type: "string", 
              enum: ["critical", "high", "medium", "low"] 
            },
            assessment: { type: "string" },
            confidence: { type: "number" },
            recommendedActions: {
              type: "array",
              items: { type: "string" }
            },
            estimatedResponseTime: { type: "string" },
            emergencyType: {
              type: "string",
              enum: ["medical", "crime", "fire", "flood", "earthquake", "urban", "public_safety", "unknown"]
            },
            urgencyLevel: {
              type: "string", 
              enum: ["critical", "high", "medium", "unknown"]
            }
          },
          required: ["priority", "assessment", "confidence", "recommendedActions", "estimatedResponseTime", "emergencyType", "urgencyLevel"]
        }
      },
      contents: prompt
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error("Gemini triage analysis error:", error);
    // Fallback assessment
    return {
      priority: "medium",
      assessment: "Unable to perform AI analysis. Manual triage required.",
      confidence: 0.5,
      recommendedActions: ["Contact emergency services immediately", "Await manual triage"],
      estimatedResponseTime: "5-10 minutes",
      emergencyType: "unknown",
      urgencyLevel: "unknown"
    };
  }
}

export async function recommendService(
  emergencyType: string,
  triageResults: TriageAssessment,
  availableHospitals: any[]
): Promise<ServiceRecommendation> {
  try {
    const prompt = `As a medical guidance AI, recommend the most appropriate emergency service based on:

Emergency Type: ${emergencyType}
Triage Priority: ${triageResults.priority}
Assessment: ${triageResults.assessment}
Available Hospitals: ${JSON.stringify(availableHospitals.slice(0, 5))}

Consider:
1. Severity and urgency
2. Required medical specialties
3. Hospital capacity and capabilities
4. Geographic proximity
5. Resource availability

Recommend the best service type and provide reasoning.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            serviceType: { type: "string" },
            reasoning: { type: "string" },
            urgency: { type: "string" },
            specialRequirements: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["serviceType", "reasoning", "urgency", "specialRequirements"]
        }
      },
      contents: prompt
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error("Gemini service recommendation error:", error);
    return {
      serviceType: "emergency_department",
      reasoning: "Unable to perform AI analysis. Default emergency department recommendation.",
      urgency: "immediate",
      specialRequirements: ["General emergency care"]
    };
  }
}

export async function generatePlainLanguageUpdate(
  caseStatus: string,
  hospitalInfo: any,
  appointmentDetails: any,
  language: "en" | "ur" = "en"
): Promise<{ english: string; urdu?: string }> {
  try {
    const prompt = `Generate a clear, plain-language update for an emergency case:

Case Status: ${caseStatus}
Hospital: ${hospitalInfo?.name || "Not assigned"}
Appointment: ${appointmentDetails?.appointmentTime || "Pending"}
Language: ${language}

Create a friendly, reassuring message that explains:
1. Current status
2. What happens next
3. What the patient should do
4. Contact information if needed

${language === "ur" ? "Also provide the message in Urdu/Roman Urdu." : ""}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const text = response.text || "Status update available. Please check with emergency services.";
    
    if (language === "ur") {
      // For bilingual response, parse or generate both
      return {
        english: text,
        urdu: text // In production, implement proper Urdu translation
      };
    }
    
    return { english: text };
  } catch (error) {
    console.error("Gemini language generation error:", error);
    return {
      english: "Your emergency case is being processed. You will receive updates shortly."
    };
  }
}
