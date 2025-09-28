import { EmergencyCase } from '@shared/schema';
import { storage } from '../storage';
import { smsService } from './sms-service';
import { generatePlainLanguageUpdate } from './gemini';

export class FollowUpAgent {
  async processCase(emergencyCase: EmergencyCase): Promise<void> {
    console.log(`Follow-up Agent processing case: ${emergencyCase.caseId}`);

    try {
      // Generate plain language update
      const languageUpdate = await generatePlainLanguageUpdate(
        emergencyCase.status,
        emergencyCase.assignedService,
        emergencyCase.bookingDetails,
        emergencyCase.language as "en" | "ur"
      );

      // Create follow-up update
      await storage.createCaseUpdate({
        caseId: emergencyCase.caseId,
        updateType: "follow_up",
        message: languageUpdate.english,
        messageUrdu: languageUpdate.urdu,
        agentType: "follow_up_agent"
      });

      // Send SMS update for degraded mode or critical cases
      if (emergencyCase.degradedMode || emergencyCase.triageResults?.priority === "critical") {
        await smsService.sendStatusUpdateSMS(
          emergencyCase.phoneNumber,
          emergencyCase.caseId,
          emergencyCase.status,
          languageUpdate.english
        );
      }

      // Send emergency contacts SMS for degraded mode
      if (emergencyCase.degradedMode) {
        await smsService.sendEmergencyContactsSMS(
          emergencyCase.phoneNumber,
          emergencyCase.caseId,
          emergencyCase.assignedService
        );
      }

      console.log(`Follow-up completed for case ${emergencyCase.caseId}`);

    } catch (error) {
      console.error(`Follow-up Agent error for case ${emergencyCase.caseId}:`, error);
      
      // Fallback follow-up
      await storage.createCaseUpdate({
        caseId: emergencyCase.caseId,
        updateType: "follow_up",
        message: "Your emergency case is being processed. You will receive updates as they become available.",
        messageUrdu: emergencyCase.language === "ur" ? "آپ کا ایمرجنسی کیس پروسیس ہو رہا ہے۔" : undefined,
        agentType: "follow_up_agent"
      });
    }
  }

  async scheduleFollowUp(caseId: string, delayMinutes: number = 15): Promise<void> {
    // In production, implement with job queue (Bull, Agenda, etc.)
    setTimeout(async () => {
      const emergencyCase = await storage.getEmergencyCaseByCaseId(caseId);
      if (emergencyCase && emergencyCase.status !== "resolved") {
        await this.processCase(emergencyCase);
      }
    }, delayMinutes * 60 * 1000);
  }

  async sendProgressReminder(emergencyCase: EmergencyCase): Promise<void> {
    const timeSinceCreated = Date.now() - emergencyCase.createdAt.getTime();
    const minutesElapsed = Math.floor(timeSinceCreated / (1000 * 60));

    let reminderMessage = "";
    
    if (minutesElapsed < 30) {
      reminderMessage = `Your emergency case ${emergencyCase.caseId} is being processed. Current status: ${emergencyCase.status}. Expected update in 15-30 minutes.`;
    } else if (minutesElapsed < 60) {
      reminderMessage = `Case ${emergencyCase.caseId} update: Still processing. Please remain patient. Contact 1122 if condition worsens.`;
    } else {
      reminderMessage = `Case ${emergencyCase.caseId}: Processing taking longer than expected. Please contact ${emergencyCase.assignedService?.contactNumber || '1122'} directly.`;
    }

    await storage.createCaseUpdate({
      caseId: emergencyCase.caseId,
      updateType: "follow_up",
      message: reminderMessage,
      messageUrdu: emergencyCase.language === "ur" ? `کیس ${emergencyCase.caseId} کی اپڈیٹ` : undefined,
      agentType: "follow_up_agent"
    });

    // Send SMS reminder for degraded mode
    if (emergencyCase.degradedMode) {
      await smsService.sendStatusUpdateSMS(
        emergencyCase.phoneNumber,
        emergencyCase.caseId,
        emergencyCase.status,
        reminderMessage
      );
    }
  }

  async resolveCase(caseId: string, resolutionNotes: string): Promise<void> {
    const emergencyCase = await storage.getEmergencyCaseByCaseId(caseId);
    if (!emergencyCase) return;

    await storage.updateEmergencyCase(emergencyCase.id, {
      status: "resolved"
    });

    const resolutionMessage = `Case ${caseId} has been resolved. ${resolutionNotes} Thank you for using Emergency Response AI. Rate our service at [feedback link].`;

    await storage.createCaseUpdate({
      caseId,
      updateType: "follow_up",
      message: resolutionMessage,
      messageUrdu: emergencyCase.language === "ur" ? `کیس ${caseId} حل ہو گیا۔ ${resolutionNotes}` : undefined,
      agentType: "follow_up_agent"
    });

    // Send resolution SMS
    await smsService.sendStatusUpdateSMS(
      emergencyCase.phoneNumber,
      caseId,
      "resolved",
      resolutionMessage
    );
  }

  async getFollowUpMetrics(): Promise<{
    totalFollowUps: number;
    avgResponseTime: number;
    resolutionRate: number;
    patientSatisfaction: number;
  }> {
    const allCases = await storage.getAllEmergencyCases();
    const resolvedCases = allCases.filter(c => c.status === "resolved");
    
    return {
      totalFollowUps: allCases.length,
      avgResponseTime: 18.5, // Mock metric - calculate from actual data
      resolutionRate: resolvedCases.length / allCases.length * 100,
      patientSatisfaction: 4.2 // Mock metric - from actual feedback
    };
  }
}

export const followUpAgent = new FollowUpAgent();
