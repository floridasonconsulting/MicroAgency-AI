/**
 * Resend Email Service
 * Handles outbound transactional and campaign emails
 */

// ============================================================================
// TYPES
// ============================================================================

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const RESEND_API_URL = 'https://api.resend.com/emails';

function getApiKey(): string | null {
  // Check localStorage for API key (set in Settings)
  const settings = localStorage.getItem('agency_settings');
  if (settings) {
    const parsed = JSON.parse(settings);
    if (parsed.resendApiKey) return parsed.resendApiKey;
  }

  // Fallback to environment variable
  // @ts-ignore
  return import.meta.env?.VITE_RESEND_API_KEY || null;
}

function getDefaultFromEmail(): string {
  const settings = localStorage.getItem('agency_settings');
  if (settings) {
    const parsed = JSON.parse(settings);
    if (parsed.emailFrom) return parsed.emailFrom;
  }
  return 'noreply@recepticom.com';
}

// ============================================================================
// EMAIL FUNCTIONS
// ============================================================================

/**
 * Send an email via Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error('[Resend] No API key configured');
    return {
      success: false,
      error: 'Resend API key not configured. Add it in Settings > Integrations.'
    };
  }

  const payload = {
    from: options.from || getDefaultFromEmail(),
    to: [options.to],
    subject: options.subject,
    text: options.text,
    html: options.html,
    reply_to: options.replyTo
  };

  console.log('[Resend] Sending email:', {
    to: options.to,
    subject: options.subject
  });

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('[Resend] Email sent successfully:', data.id);
      return {
        success: true,
        messageId: data.id
      };
    } else {
      console.error('[Resend] API error:', data);
      return {
        success: false,
        error: data.message || 'Failed to send email'
      };
    }
  } catch (error) {
    console.error('[Resend] Network error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * Send a campaign outreach email
 */
export async function sendCampaignEmail(
  to: string,
  subject: string,
  body: string,
  replyTo?: string
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject,
    text: body,
    replyTo: replyTo || getDefaultFromEmail()
  });
}

/**
 * Send a demo link email
 */
export async function sendDemoEmail(
  to: string,
  businessName: string,
  demoLink: string
): Promise<EmailResult> {
  const subject = `Your personalized demo is ready - ${businessName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Your AI Receptionist Demo is Ready!</h2>
      
      <p>Hi there,</p>
      
      <p>Thanks for your interest in our AI receptionist service for <strong>${businessName}</strong>.</p>
      
      <p>I've set up a personalized demo so you can see exactly how it would work for your plumbing business:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${demoLink}" 
           style="background: linear-gradient(to right, #4F46E5, #7C3AED); 
                  color: white; 
                  padding: 15px 30px; 
                  text-decoration: none; 
                  border-radius: 8px;
                  font-weight: bold;
                  display: inline-block;">
          View Your Demo →
        </a>
      </div>
      
      <p>The demo includes:</p>
      <ul>
        <li>✓ Sample incoming calls and how AI handles them</li>
        <li>✓ Lead capture in action</li>
        <li>✓ Appointment booking flow</li>
        <li>✓ Your personalized dashboard</li>
      </ul>
      
      <p>Have questions? Just reply to this email.</p>
      
      <p>Best,<br>
      <strong>Recepticom Team</strong></p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `Your AI Receptionist Demo is ready! View it here: ${demoLink}`
  });
}

/**
 * Send onboarding welcome email
 */
export async function sendWelcomeEmail(
  to: string,
  businessName: string,
  aiPhoneNumber?: string
): Promise<EmailResult> {
  const subject = `Welcome to Recepticom - ${businessName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10B981;">🎉 Welcome to Recepticom!</h2>
      
      <p>Hi there,</p>
      
      <p>Congratulations! Your AI receptionist for <strong>${businessName}</strong> is now active.</p>
      
      ${aiPhoneNumber ? `
      <div style="background: #F0FDF4; border: 1px solid #10B981; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #065F46;">Your AI Phone Number:</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #10B981;">${aiPhoneNumber}</p>
      </div>
      
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Forward your missed calls to ${aiPhoneNumber}</li>
        <li>Test it by calling the number</li>
        <li>Watch leads appear in your dashboard</li>
      </ol>
      ` : `
      <p>Your phone number is being provisioned and you'll receive another email with the details shortly.</p>
      `}
      
      <p>Need help? Reply to this email or check out your dashboard.</p>
      
      <p>Best,<br>
      <strong>Recepticom Team</strong></p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `Welcome to Recepticom! Your AI receptionist for ${businessName} is now active.${aiPhoneNumber ? ` Your AI phone number is: ${aiPhoneNumber}` : ''}`
  });
}

// ============================================================================
// APPOINTMENT EMAILS
// ============================================================================

export interface AppointmentEmailData {
  customerEmail: string;
  customerName: string;
  businessName: string;
  businessPhone: string;
  scheduledAt: string;
  durationMinutes: number;
  serviceType?: string;
  location?: string;
  googleCalendarUrl: string;
  outlookCalendarUrl: string;
  icsDownloadUrl?: string;
}

/**
 * Send appointment confirmation email to customer
 */
export async function sendAppointmentConfirmation(data: AppointmentEmailData): Promise<EmailResult> {
  const appointmentDate = new Date(data.scheduledAt);
  const dateStr = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = appointmentDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const subject = `Appointment Confirmed - ${dateStr} at ${timeStr}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #10B981, #059669); padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">✓ Appointment Confirmed</h2>
      </div>
      
      <div style="border: 1px solid #E5E7EB; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi ${data.customerName},</p>
        
        <p>Your appointment with <strong>${data.businessName}</strong> is confirmed!</p>
        
        <div style="background: #F9FAFB; border: 1px solid #E5E7EB; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6B7280;">📅 Date:</td>
              <td style="padding: 8px 0; font-weight: bold;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280;">⏰ Time:</td>
              <td style="padding: 8px 0; font-weight: bold;">${timeStr}</td>
            </tr>
            ${data.serviceType ? `
            <tr>
              <td style="padding: 8px 0; color: #6B7280;">🔧 Service:</td>
              <td style="padding: 8px 0; font-weight: bold;">${data.serviceType}</td>
            </tr>
            ` : ''}
            ${data.location ? `
            <tr>
              <td style="padding: 8px 0; color: #6B7280;">📍 Location:</td>
              <td style="padding: 8px 0; font-weight: bold;">${data.location}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <p style="margin-bottom: 5px;"><strong>Add to Calendar:</strong></p>
        <div style="margin-bottom: 20px;">
          <a href="${data.googleCalendarUrl}" 
             style="display: inline-block; background: #4285F4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px; margin-bottom: 10px;">
            📅 Google Calendar
          </a>
          <a href="${data.outlookCalendarUrl}" 
             style="display: inline-block; background: #0078D4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px; margin-bottom: 10px;">
            📆 Outlook
          </a>
        </div>
        
        <p style="color: #6B7280; font-size: 14px;">
          Need to reschedule or cancel? Reply to this email or call <strong>${data.businessPhone}</strong>.
        </p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
        
        <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
          This appointment was scheduled via ${data.businessName}'s AI receptionist.
        </p>
      </div>
    </div>
    `;

  return sendEmail({
    to: data.customerEmail,
    subject,
    html,
    text: `Your appointment with ${data.businessName} is confirmed for ${dateStr} at ${timeStr}. ${data.serviceType ? `Service: ${data.serviceType}. ` : ''}Need to reschedule? Reply to this email or call ${data.businessPhone}.`
  });
}

/**
 * Send appointment reminder email to customer (24h or 1h)
 */
export async function sendAppointmentReminder(
  data: AppointmentEmailData,
  reminderType: '24h' | '1h'
): Promise<EmailResult> {
  const appointmentDate = new Date(data.scheduledAt);
  const dateStr = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  const timeStr = appointmentDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const timeLabel = reminderType === '24h' ? 'tomorrow' : 'in 1 hour';
  const subject = `Reminder: Your appointment ${timeLabel} - ${timeStr}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #F59E0B, #D97706); padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">⏰ Appointment Reminder</h2>
      </div>
      
      <div style="border: 1px solid #E5E7EB; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi ${data.customerName},</p>
        
        <p>This is a friendly reminder that your appointment with <strong>${data.businessName}</strong> is <strong>${timeLabel}</strong>.</p>
        
        <div style="background: #FFFBEB; border: 1px solid #F59E0B; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #92400E;">📅</td>
              <td style="padding: 8px 0; font-weight: bold; color: #92400E;">${dateStr} at ${timeStr}</td>
            </tr>
            ${data.serviceType ? `
            <tr>
              <td style="padding: 8px 0; color: #92400E;">🔧</td>
              <td style="padding: 8px 0; font-weight: bold; color: #92400E;">${data.serviceType}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <p style="color: #6B7280; font-size: 14px;">
          Need to reschedule? Reply to this email or call <strong>${data.businessPhone}</strong>.
        </p>
        
        <p>See you soon!</p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
        
        <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
          This reminder was sent by ${data.businessName}'s AI receptionist.
        </p>
      </div>
    </div>
    `;

  return sendEmail({
    to: data.customerEmail,
    subject,
    html,
    text: `Reminder: Your appointment with ${data.businessName} is ${timeLabel} - ${dateStr} at ${timeStr}. ${data.serviceType ? `Service: ${data.serviceType}. ` : ''}Need to reschedule? Reply to this email or call ${data.businessPhone}.`
  });
}

export default {
  sendEmail,
  sendCampaignEmail,
  sendDemoEmail,
  sendWelcomeEmail,
  sendAppointmentConfirmation,
  sendAppointmentReminder
};
