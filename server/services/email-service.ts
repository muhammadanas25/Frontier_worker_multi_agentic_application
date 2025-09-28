import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set - email notifications disabled");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('Email sending skipped - no SendGrid API key configured');
    return false;
  }

  try {
    const emailData: any = {
      to: params.to,
      from: params.from || 'noreply@emergency-response.pk',
      subject: params.subject,
    };
    
    if (params.text) emailData.text = params.text;
    if (params.html) emailData.html = params.html;
    
    await mailService.send(emailData);
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendBookingConfirmation(
  phoneNumber: string, 
  hospitalName: string, 
  appointmentTime: string,
  confirmationNumber: string
): Promise<boolean> {
  // In a real implementation, you'd have a mapping from phone to email
  // For now, we'll use a placeholder email format or skip if no email mapping exists
  const email = `${phoneNumber.replace(/[^0-9]/g, '')}@example.com`; // Placeholder
  
  const subject = `Emergency Booking Confirmation - ${confirmationNumber}`;
  const text = `Your emergency booking has been confirmed:
  
Hospital: ${hospitalName}
Appointment Time: ${appointmentTime}
Confirmation Number: ${confirmationNumber}

Please arrive 15 minutes early and bring valid identification.

This is an automated message from Pakistan Emergency Response System.`;

  const html = `
    <h2>🏥 Emergency Booking Confirmed</h2>
    <p><strong>Hospital:</strong> ${hospitalName}</p>
    <p><strong>Appointment Time:</strong> ${appointmentTime}</p>
    <p><strong>Confirmation Number:</strong> ${confirmationNumber}</p>
    <hr>
    <p><em>Please arrive 15 minutes early and bring valid identification.</em></p>
    <p><small>This is an automated message from Pakistan Emergency Response System.</small></p>
  `;

  return await sendEmail({
    to: email,
    from: 'noreply@emergency-response.pk', // You should configure this with a verified sender
    subject,
    text,
    html
  });
}