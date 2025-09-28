import { EmergencyCase } from '@shared/schema';
import { storage } from '../storage';
import { smsService } from './sms-service';

export class BookingAgent {
  async processCase(emergencyCase: EmergencyCase): Promise<any> {
    console.log(`Booking Agent processing case: ${emergencyCase.caseId}`);

    if (!emergencyCase.assignedService) {
      throw new Error("Case must have assigned service before booking");
    }

    try {
      // Generate appointment time based on priority
      const appointmentTime = this.generateAppointmentTime(
        emergencyCase.triageResults?.priority || "medium"
      );

      // Create confirmation number
      const confirmationNumber = this.generateConfirmationNumber(emergencyCase.caseId);

      // Generate instructions based on emergency type and hospital
      const instructions = this.generateInstructions(
        emergencyCase.emergencyType,
        emergencyCase.triageResults?.priority || "medium",
        emergencyCase.assignedService.hospitalName
      );

      const bookingDetails = {
        appointmentTime,
        confirmationNumber,
        instructions
      };

      // Update case with booking details
      await storage.updateEmergencyCase(emergencyCase.id, {
        status: "in_progress",
        bookingDetails
      });

      // Log booking update
      const updateMessage = `Appointment booked at ${emergencyCase.assignedService.hospitalName} for ${appointmentTime}. Confirmation: ${confirmationNumber}`;
      
      await storage.createCaseUpdate({
        caseId: emergencyCase.caseId,
        updateType: "booking",
        message: updateMessage,
        messageUrdu: emergencyCase.language === "ur" ? 
          `اپوائنٹمنٹ بک: ${emergencyCase.assignedService.hospitalName} - ${appointmentTime}` : undefined,
        agentType: "booking_agent"
      });

      // Send SMS confirmation if degraded mode or high priority
      if (emergencyCase.degradedMode || emergencyCase.triageResults?.priority === "critical") {
        await smsService.sendAppointmentConfirmationSMS(
          emergencyCase.phoneNumber,
          emergencyCase.caseId,
          emergencyCase.assignedService.hospitalName,
          appointmentTime,
          instructions
        );
      }

      console.log(`Booking completed for case ${emergencyCase.caseId}: ${appointmentTime}`);
      return { bookingDetails, appointmentTime, confirmationNumber, instructions };

    } catch (error) {
      console.error(`Booking Agent error for case ${emergencyCase.caseId}:`, error);
      
      // Fallback booking
      const fallbackBooking = {
        appointmentTime: "Contact hospital directly",
        confirmationNumber: emergencyCase.caseId,
        instructions: `Contact ${emergencyCase.assignedService.contactNumber || '1122'} immediately for assistance.`
      };

      await storage.updateEmergencyCase(emergencyCase.id, {
        status: "in_progress",
        bookingDetails: fallbackBooking
      });

      await storage.createCaseUpdate({
        caseId: emergencyCase.caseId,
        updateType: "booking",
        message: "Manual booking required. Contact hospital directly for appointment.",
        messageUrdu: emergencyCase.language === "ur" ? "دستی بکنگ درکار۔ اپوائنٹمنٹ کے لیے ہسپتال سے رابطہ کریں۔" : undefined,
        agentType: "booking_agent"
      });

      return { bookingDetails: fallbackBooking };
    }
  }

  private generateAppointmentTime(priority: string): string {
    const now = new Date();
    
    switch (priority) {
      case "critical":
        // Immediate - within 15 minutes
        now.setMinutes(now.getMinutes() + 15);
        return `Emergency - Immediate (${now.toLocaleTimeString()})`;
      
      case "high":
        // Within 1 hour
        now.setHours(now.getHours() + 1);
        return `Today ${now.toLocaleTimeString()} (within 1 hour)`;
      
      case "medium":
        // Within 4 hours
        now.setHours(now.getHours() + 4);
        return `Today ${now.toLocaleTimeString()} (within 4 hours)`;
      
      default:
        // Next available slot (next day)
        now.setDate(now.getDate() + 1);
        now.setHours(9, 0, 0, 0); // 9 AM next day
        return `Tomorrow ${now.toLocaleTimeString()}`;
    }
  }

  private generateConfirmationNumber(caseId: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${caseId}-${timestamp}-${random}`;
  }

  private generateInstructions(emergencyType: string, priority: string, hospitalName: string): string {
    const baseInstructions = [
      "Bring your CNIC or identification",
      "Bring any current medications",
      "Arrive 15 minutes early for registration"
    ];

    const emergencySpecificInstructions: { [key: string]: string[] } = {
      medical: [
        "Bring medical history if available",
        "Note symptoms and when they started",
        "Contact emergency services (1122) if condition worsens"
      ],
      crime: [
        "Bring any evidence or documentation",
        "Contact police (15) if immediate danger",
        "Prepare to provide statement"
      ],
      fire: [
        "Evacuate immediately if fire spreads",
        "Call fire brigade (16) for active fires",
        "Ensure everyone is accounted for"
      ],
      flood: [
        "Move to higher ground if flooding continues",
        "Call rescue services (1122) if trapped",
        "Avoid contaminated water"
      ]
    };

    const priorityInstructions: { [key: string]: string[] } = {
      critical: [
        "This is an EMERGENCY appointment",
        "Go directly to Emergency Department",
        "Call 1122 if you cannot reach the hospital"
      ],
      high: [
        "This is an urgent appointment",
        "Do not delay - arrive on time",
        "Call hospital if any delays"
      ]
    };

    let instructions = [...baseInstructions];
    
    if (emergencySpecificInstructions[emergencyType]) {
      instructions.push(...emergencySpecificInstructions[emergencyType]);
    }

    if (priorityInstructions[priority]) {
      instructions.push(...priorityInstructions[priority]);
    }

    instructions.push(`Hospital: ${hospitalName}`);
    
    return instructions.join(". ");
  }

  async getBookingMetrics(): Promise<{
    totalBookings: number;
    emergencyBookings: number;
    averageWaitTime: number;
    successfulBookings: number;
  }> {
    const allCases = await storage.getAllEmergencyCases();
    const bookedCases = allCases.filter(c => c.bookingDetails);

    return {
      totalBookings: bookedCases.length,
      emergencyBookings: bookedCases.filter(c => c.triageResults?.priority === "critical").length,
      averageWaitTime: 32, // Mock metric - calculate from actual data
      successfulBookings: bookedCases.filter(c => c.bookingDetails?.confirmationNumber).length
    };
  }
}

export const bookingAgent = new BookingAgent();
