import { EmergencyCase } from '@shared/schema';
import { storage } from '../storage';
import { smsService } from './sms-service';
import { generatePlainLanguageUpdate } from './gemini';

export class FollowUpAgent {
  async processCase(emergencyCase: EmergencyCase): Promise<void> {
    console.log(`Follow-up Agent processing case: ${emergencyCase.caseId}`);

    try {
      // Check if this case type needs immediate resolution or appointment booking
      const shouldResolveImmediately = this.shouldResolveImmediately(emergencyCase);
      
      if (shouldResolveImmediately) {
        await this.resolveImmediately(emergencyCase);
        return;
      }

      // Generate context-aware update based on emergency type
      const contextualUpdate = await this.generateContextualUpdate(emergencyCase);

      // Create follow-up update
      await storage.createCaseUpdate({
        caseId: emergencyCase.caseId,
        updateType: "follow_up",
        message: contextualUpdate.english,
        messageUrdu: contextualUpdate.urdu,
        agentType: "follow_up_agent"
      });

      // Send SMS update for degraded mode or critical cases
      if (emergencyCase.degradedMode || emergencyCase.triageResults?.priority === "critical") {
        await smsService.sendStatusUpdateSMS(
          emergencyCase.phoneNumber,
          emergencyCase.caseId,
          emergencyCase.status,
          contextualUpdate.english
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
      
      // Fallback follow-up with emergency-specific message
      const fallbackMessage = this.getFallbackMessage(emergencyCase);
      await storage.createCaseUpdate({
        caseId: emergencyCase.caseId,
        updateType: "follow_up",
        message: fallbackMessage.english,
        messageUrdu: fallbackMessage.urdu,
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
      status: "resolved",
      resolvedAt: new Date()
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
    
    // Calculate actual average response time for follow-ups
    let totalResponseTime = 0;
    let countWithResponseTime = 0;
    
    for (const case_ of allCases) {
      if (case_.createdAt && case_.updatedAt) {
        const createdTime = new Date(case_.createdAt).getTime();
        const lastUpdateTime = new Date(case_.updatedAt).getTime();
        const responseTimeMinutes = (lastUpdateTime - createdTime) / (1000 * 60);
        if (responseTimeMinutes > 0 && responseTimeMinutes < 180) { // Filter out unrealistic times
          totalResponseTime += responseTimeMinutes;
          countWithResponseTime++;
        }
      }
    }
    
    const avgResponseTime = countWithResponseTime > 0 
      ? Number((totalResponseTime / countWithResponseTime).toFixed(1))
      : 18.5; // Default fallback
    
    // Calculate resolution rate as percentage
    const resolutionRate = allCases.length > 0 
      ? Math.round((resolvedCases.length / allCases.length) * 100) 
      : 0;
    
    // Simulate patient satisfaction based on response time (better times = higher satisfaction)
    const patientSatisfaction = avgResponseTime < 10 ? 4.8 :
                               avgResponseTime < 20 ? 4.5 :
                               avgResponseTime < 30 ? 4.2 :
                               avgResponseTime < 60 ? 3.8 : 3.5;
    
    return {
      totalFollowUps: allCases.length,
      avgResponseTime,
      resolutionRate,
      patientSatisfaction: Number(patientSatisfaction.toFixed(1))
    };
  }

  private shouldResolveImmediately(emergencyCase: EmergencyCase): boolean {
    // Cases that should be resolved immediately after guidance (no appointment needed)
    const immediateResolutionTypes = ['crime', 'public_safety'];
    
    // Crime cases that just need police contact info
    if (immediateResolutionTypes.includes(emergencyCase.emergencyType)) {
      return true;
    }
    
    // Low priority urban issues that just need guidance
    if (emergencyCase.emergencyType === 'urban' && 
        emergencyCase.triageResults?.priority === 'low') {
      return true;
    }
    
    return false;
  }

  private async resolveImmediately(emergencyCase: EmergencyCase): Promise<void> {
    const resolutionMessage = this.getImmediateResolutionMessage(emergencyCase);
    
    // Mark case as resolved
    await storage.updateEmergencyCase(emergencyCase.id, {
      status: "resolved",
      resolvedAt: new Date()
    });

    // Send final update
    await storage.createCaseUpdate({
      caseId: emergencyCase.caseId,
      updateType: "follow_up",
      message: resolutionMessage.english,
      messageUrdu: resolutionMessage.urdu,
      agentType: "follow_up_agent"
    });

    // Send SMS for degraded mode or critical cases
    if (emergencyCase.degradedMode || emergencyCase.triageResults?.priority === "critical") {
      await smsService.sendStatusUpdateSMS(
        emergencyCase.phoneNumber,
        emergencyCase.caseId,
        "resolved",
        resolutionMessage.english
      );
    }

    console.log(`Case ${emergencyCase.caseId} resolved immediately - no appointment needed`);
  }

  private getImmediateResolutionMessage(emergencyCase: EmergencyCase): { english: string; urdu?: string } {
    const serviceName = emergencyCase.assignedService?.hospitalName || "Emergency Services";
    const contactNumber = emergencyCase.assignedService?.contactNumber || "1122";
    
    switch (emergencyCase.emergencyType) {
      case 'crime':
        return {
          english: `🚔 **CRIME RESPONSE COMPLETE**\n\nYour case ${emergencyCase.caseId} has been processed:\n\n✅ **Assigned Service:** ${serviceName}\n📞 **Direct Contact:** ${contactNumber}\n🆘 **Police Helpline:** 15\n\n**Next Steps:**\n• Contact the assigned station directly for immediate assistance\n• Call 15 for emergency police response\n• Keep this case number for reference: ${emergencyCase.caseId}\n\n**Your safety is our priority. Stay safe!**`,
          urdu: emergencyCase.language === "ur" ? `آپ کا کیس ${emergencyCase.caseId} مکمل ہو گیا ہے۔ پولیس سے رابطہ: ${contactNumber}` : undefined
        };
        
      case 'public_safety':
        return {
          english: `🛡️ **PUBLIC SAFETY GUIDANCE PROVIDED**\n\nYour case ${emergencyCase.caseId} has been resolved:\n\n✅ **Guidance Service:** ${serviceName}\n📞 **Contact:** ${contactNumber}\n🆘 **Emergency Helpline:** 1122\n\n**You have been provided with safety guidance and appropriate contact information.**\n\nCase Reference: ${emergencyCase.caseId}`,
          urdu: emergencyCase.language === "ur" ? `آپ کا کیس ${emergencyCase.caseId} حل ہو گیا ہے۔ محفوظیت کی رہنمائی فراہم کی گئی۔` : undefined
        };
        
      case 'urban':
        return {
          english: `🏙️ **URBAN ISSUE GUIDANCE COMPLETE**\n\nYour case ${emergencyCase.caseId} has been resolved:\n\n✅ **Guidance Provided:** Municipal services contact information\n📞 **Local Authority:** ${contactNumber}\n\n**You have been connected with the appropriate municipal services for your urban issue.**\n\nCase Reference: ${emergencyCase.caseId}`,
          urdu: emergencyCase.language === "ur" ? `آپ کا شہری مسئلہ ${emergencyCase.caseId} حل ہو گیا ہے۔` : undefined
        };
        
      default:
        return {
          english: `✅ **CASE RESOLVED**\n\nYour case ${emergencyCase.caseId} has been completed:\n\n📞 **Contact:** ${contactNumber}\n🆘 **Emergency:** 1122\n\nThank you for using Emergency Response AI.`,
          urdu: emergencyCase.language === "ur" ? `آپ کا کیس ${emergencyCase.caseId} مکمل ہو گیا ہے۔` : undefined
        };
    }
  }

  private async generateContextualUpdate(emergencyCase: EmergencyCase): Promise<{ english: string; urdu?: string }> {
    const serviceName = emergencyCase.assignedService?.hospitalName || "Emergency Services";
    const contactNumber = emergencyCase.assignedService?.contactNumber || "1122";
    const appointmentTime = emergencyCase.bookingDetails?.appointmentTime || "being scheduled";
    const confirmationNumber = emergencyCase.bookingDetails?.confirmationNumber || emergencyCase.caseId;
    
    switch (emergencyCase.emergencyType) {
      case 'medical':
        return {
          english: `🏥 **MEDICAL EMERGENCY UPDATE**\n\nCase ${emergencyCase.caseId} Status: **${emergencyCase.status.toUpperCase()}**\n\n✅ **Hospital Assigned:** ${serviceName}\n📅 **Appointment:** ${appointmentTime}\n🎫 **Confirmation:** ${confirmationNumber}\n📞 **Hospital Contact:** ${contactNumber}\n🆘 **Medical Emergency:** 1122\n\n**What to bring:**\n• Valid ID (CNIC)\n• Current medications list\n• Any medical reports\n\n**If your condition worsens, call 1122 immediately.**`,
          urdu: emergencyCase.language === "ur" ? `آپ کا طبی ایمرجنسی کیس ${emergencyCase.caseId} - ہسپتال: ${serviceName}, اپوائنٹمنٹ: ${appointmentTime}` : undefined
        };
        
      case 'fire':
        return {
          english: `🔥 **FIRE EMERGENCY UPDATE**\n\nCase ${emergencyCase.caseId} Status: **${emergencyCase.status.toUpperCase()}**\n\n✅ **Relief Center:** ${serviceName}\n📍 **Shelter Location:** ${emergencyCase.assignedService?.address || "Location details being confirmed"}\n📞 **Relief Contact:** ${contactNumber}\n🆘 **Fire Brigade:** 16\n\n**Safety Instructions:**\n• Follow evacuation routes provided\n• Stay away from fire areas\n• Report to assigned relief center\n\n**If fire spreads, call 16 immediately.**`,
          urdu: emergencyCase.language === "ur" ? `آپ کا آگ کا ایمرجنسی کیس ${emergencyCase.caseId} - ریلیف سینٹر: ${serviceName}` : undefined
        };
        
      case 'flood':
        return {
          english: `🌊 **FLOOD EMERGENCY UPDATE**\n\nCase ${emergencyCase.caseId} Status: **${emergencyCase.status.toUpperCase()}**\n\n✅ **Relief Center:** ${serviceName}\n📍 **Safe Location:** ${emergencyCase.assignedService?.address || "Location details being confirmed"}\n📞 **Rescue Contact:** ${contactNumber}\n🆘 **Rescue Services:** 1122\n\n**Safety Instructions:**\n• Move to higher ground immediately\n• Avoid flood water\n• Proceed to assigned relief center\n\n**If trapped, call 1122 immediately.**`,
          urdu: emergencyCase.language === "ur" ? `آپ کا سیلاب ایمرجنسی کیس ${emergencyCase.caseId} - ریلیف سینٹر: ${serviceName}` : undefined
        };
        
      case 'earthquake':
        return {
          english: `🏗️ **EARTHQUAKE EMERGENCY UPDATE**\n\nCase ${emergencyCase.caseId} Status: **${emergencyCase.status.toUpperCase()}**\n\n✅ **Relief Center:** ${serviceName}\n📍 **Safe Shelter:** ${emergencyCase.assignedService?.address || "Location details being confirmed"}\n📞 **Rescue Contact:** ${contactNumber}\n🆘 **Emergency:** 1122\n\n**Safety Instructions:**\n• Stay in open areas\n• Avoid damaged buildings\n• Report to assigned relief center\n\n**If aftershocks occur, call 1122.**`,
          urdu: emergencyCase.language === "ur" ? `آپ کا زلزلہ ایمرجنسی کیس ${emergencyCase.caseId} - ریلیف سینٹر: ${serviceName}` : undefined
        };
        
      default:
        return {
          english: `📋 **EMERGENCY UPDATE**\n\nCase ${emergencyCase.caseId} Status: **${emergencyCase.status.toUpperCase()}**\n\n✅ **Assigned Service:** ${serviceName}\n📞 **Contact:** ${contactNumber}\n🆘 **Emergency Helpline:** 1122\n\nYour case is being actively managed. You will receive further updates as processing continues.`,
          urdu: emergencyCase.language === "ur" ? `آپ کا ایمرجنسی کیس ${emergencyCase.caseId} کی اپڈیٹ - سروس: ${serviceName}` : undefined
        };
    }
  }

  private getFallbackMessage(emergencyCase: EmergencyCase): { english: string; urdu?: string } {
    const emergencyNumbers: { [key: string]: string } = {
      'medical': '1122',
      'crime': '15', 
      'fire': '16',
      'flood': '1122',
      'earthquake': '1122',
      'public_safety': '15',
      'urban': '1122'
    };
    
    const number = emergencyNumbers[emergencyCase.emergencyType] || '1122';
    
    return {
      english: `⚠️ **EMERGENCY PROCESSING**\n\nYour case ${emergencyCase.caseId} is being processed.\n\n🆘 **If urgent, call:** ${number}\n\nYou will receive updates as they become available.`,
      urdu: emergencyCase.language === "ur" ? `آپ کا ایمرجنسی کیس ${emergencyCase.caseId} پروسیس ہو رہا ہے۔ فوری ضرورت: ${number}` : undefined
    };
  }
}

export const followUpAgent = new FollowUpAgent();
