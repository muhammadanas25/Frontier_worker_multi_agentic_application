import { EmergencyCase } from '@shared/schema';
import { analyzeEmergencyTriage, TriageAssessment } from './gemini';
import { storage } from '../storage';

export class TriageAgent {
  async processCase(emergencyCase: EmergencyCase): Promise<TriageAssessment> {
    console.log(`Triage Agent processing case: ${emergencyCase.caseId}`);

    try {
      // Use Gemini AI for intelligent triage (detects emergency type and urgency from description)
      const triageResults = await analyzeEmergencyTriage(
        emergencyCase.description,
        emergencyCase.location
      );

      // Update case with triage results and detected emergency type/urgency
      await storage.updateEmergencyCase(emergencyCase.id, {
        status: "triaged",
        emergencyType: triageResults.emergencyType,
        urgencyLevel: triageResults.urgencyLevel,
        triageResults: {
          priority: triageResults.priority,
          assessment: triageResults.assessment,
          confidence: triageResults.confidence
        }
      });

      // Log triage update
      await storage.createCaseUpdate({
        caseId: emergencyCase.caseId,
        updateType: "triage",
        message: `Triage completed. Emergency Type: ${triageResults.emergencyType}, Urgency: ${triageResults.urgencyLevel}, Priority: ${triageResults.priority}. ${triageResults.assessment}`,
        messageUrdu: emergencyCase.language === "ur" ? `ٹرائیج مکمل۔ قسم: ${triageResults.emergencyType}, فوریت: ${triageResults.urgencyLevel}, ترجیح: ${triageResults.priority}` : undefined,
        agentType: "triage_agent"
      });

      console.log(`Triage completed for case ${emergencyCase.caseId}: ${triageResults.emergencyType}/${triageResults.urgencyLevel}/${triageResults.priority}`);
      return triageResults;

    } catch (error) {
      console.error(`Triage Agent error for case ${emergencyCase.caseId}:`, error);
      
      // Fallback triage with default values
      const fallbackResults: TriageAssessment = {
        priority: "medium",
        assessment: "Automated triage unavailable. Manual review required.",
        confidence: 0.5,
        recommendedActions: ["Contact emergency services", "Manual triage needed"],
        estimatedResponseTime: "10-15 minutes",
        emergencyType: "unknown",
        urgencyLevel: "unknown"
      };

      await storage.updateEmergencyCase(emergencyCase.id, {
        status: "triaged",
        emergencyType: fallbackResults.emergencyType,
        urgencyLevel: fallbackResults.urgencyLevel,
        triageResults: {
          priority: fallbackResults.priority,
          assessment: fallbackResults.assessment,
          confidence: fallbackResults.confidence
        }
      });

      return fallbackResults;
    }
  }

  private mapUrgencyToPriority(urgencyLevel: string): "critical" | "high" | "medium" | "low" {
    switch (urgencyLevel) {
      case "critical": return "critical";
      case "high": return "high";
      case "medium": return "medium";
      default: return "low";
    }
  }

  async getTriageMetrics(): Promise<{
    totalCases: number;
    criticalCases: number;
    highPriorityCases: number;
    averageResponseTime: number;
  }> {
    const allCases = await storage.getAllEmergencyCases();
    const triagedCases = allCases.filter(c => c.triageResults);

    return {
      totalCases: allCases.length,
      criticalCases: triagedCases.filter(c => c.triageResults?.priority === "critical").length,
      highPriorityCases: triagedCases.filter(c => c.triageResults?.priority === "high").length,
      averageResponseTime: 5.2 // Mock metric - calculate from actual data
    };
  }
}

export const triageAgent = new TriageAgent();
