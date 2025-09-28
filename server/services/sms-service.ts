export interface SMSMessage {
  to: string;
  message: string;
  caseId: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SMSService {
  private twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  private twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  private twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  async sendSMS(smsData: SMSMessage): Promise<SMSResponse> {
    try {
      // In production, integrate with Twilio, AWS SNS, or local SMS gateway
      console.log(`SMS sent to ${smsData.to}: ${smsData.message}`);
      
      // Simulate SMS sending for now
      return {
        success: true,
        messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMS error'
      };
    }
  }

  generateEmergencyContactSMS(caseId: string, hospitalInfo: any): string {
    const message = `Emergency Case ${caseId} - IMPORTANT CONTACTS:
Emergency: 1122
Police: 15
Fire: 16
${hospitalInfo?.name ? `Hospital: ${hospitalInfo.name}` : ''}
${hospitalInfo?.contactNumber ? `Ph: ${hospitalInfo.contactNumber}` : ''}
Keep this message for reference.`;

    return message;
  }

  generateStatusUpdateSMS(caseId: string, status: string, details?: string): string {
    const statusMessages = {
      triaged: `Case ${caseId}: Triage complete. Priority assigned. Next: Service assignment.`,
      assigned: `Case ${caseId}: Service assigned. ${details || 'You will be contacted shortly.'}`,
      in_progress: `Case ${caseId}: Help is on the way. ${details || 'Stay calm and wait for assistance.'}`,
      resolved: `Case ${caseId}: Case resolved. Thank you for using Emergency Response AI.`
    };

    return statusMessages[status as keyof typeof statusMessages] || 
           `Case ${caseId}: Status updated to ${status}. ${details || ''}`;
  }

  generateAppointmentSMS(caseId: string, hospitalName: string, time: string, instructions: string): string {
    return `Case ${caseId}: APPOINTMENT CONFIRMED
Hospital: ${hospitalName}
Time: ${time}
Instructions: ${instructions}
Bring: CNIC, medical history
Contact: 1122 for emergencies`;
  }

  async sendEmergencyContactsSMS(phoneNumber: string, caseId: string, hospitalInfo?: any): Promise<SMSResponse> {
    const message = this.generateEmergencyContactSMS(caseId, hospitalInfo);
    return this.sendSMS({ to: phoneNumber, message, caseId });
  }

  async sendStatusUpdateSMS(phoneNumber: string, caseId: string, status: string, details?: string): Promise<SMSResponse> {
    const message = this.generateStatusUpdateSMS(caseId, status, details);
    return this.sendSMS({ to: phoneNumber, message, caseId });
  }

  async sendAppointmentConfirmationSMS(
    phoneNumber: string, 
    caseId: string, 
    hospitalName: string, 
    time: string, 
    instructions: string
  ): Promise<SMSResponse> {
    const message = this.generateAppointmentSMS(caseId, hospitalName, time, instructions);
    return this.sendSMS({ to: phoneNumber, message, caseId });
  }
}

export const smsService = new SMSService();
