/**
 * Appointment Service
 * Handles booking, calendar sync, confirmations, and reminders
 */

// ============================================================================
// TYPES
// ============================================================================

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
export type ReminderType = 'confirmation' | '24h' | '1h' | 'follow_up';
export type ContactPreference = 'email' | 'sms' | 'both' | 'none';
export type CalendarProvider = 'google' | 'outlook' | 'apple' | 'none';

export interface Appointment {
    id: string;
    clientId: string;
    leadId?: string;

    // Customer info
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    customerContactPref: ContactPreference;

    // Scheduling
    scheduledAt: string; // ISO datetime
    durationMinutes: number;
    serviceType?: string;
    location?: string;
    notes?: string;

    // Status
    status: AppointmentStatus;

    // Confirmation tracking
    confirmationEmailSent: boolean;
    confirmationSmsSent: boolean;
    reminder24hEmailSent: boolean;
    reminder24hSmsSent: boolean;
    reminder1hEmailSent: boolean;
    reminder1hSmsSent: boolean;

    // Calendar sync
    calendarProvider?: CalendarProvider;
    googleEventId?: string;
    outlookEventId?: string;
    icsFileUrl?: string;

    createdAt: string;
}

export interface ClientCalendarSettings {
    clientId: string;
    defaultDurationMinutes: number;
    bufferMinutes: number;
    availableStartTime: string; // "08:00"
    availableEndTime: string; // "18:00"
    timezone: string;
    workingDays: number[]; // [1,2,3,4,5] = Mon-Fri

    // Subscriber settings
    sendCustomerConfirmation: boolean;
    sendCustomerReminders: boolean;
    send24hReminder: boolean;
    send1hReminder: boolean;
    sendFollowUp: boolean;

    // Calendar
    calendarProvider: CalendarProvider;
    googleCalendarId?: string;
    outlookCalendarId?: string;
}

export interface CreateAppointmentInput {
    clientId: string;
    leadId?: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    customerContactPref?: ContactPreference;
    scheduledAt: string;
    durationMinutes?: number;
    serviceType?: string;
    location?: string;
    notes?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Generate ICS file content for any calendar
 */
export function generateICSContent(appointment: Appointment, businessName: string): string {
    const startDate = new Date(appointment.scheduledAt);
    const endDate = new Date(startDate.getTime() + appointment.durationMinutes * 60 * 1000);

    const formatICSDate = (date: Date): string => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const uid = `${appointment.id}@recepticom.com`;
    const now = formatICSDate(new Date());

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Recepticom//Appointment Booking//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${appointment.serviceType || 'Appointment'} - ${businessName}
DESCRIPTION:Service: ${appointment.serviceType || 'General'}\\nCustomer: ${appointment.customerName}\\n${appointment.notes || ''}
LOCATION:${appointment.location || 'TBD'}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Reminder: ${appointment.serviceType || 'Appointment'} in 1 hour
END:VALARM
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Reminder: ${appointment.serviceType || 'Appointment'} tomorrow
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarUrl(appointment: Appointment): string {
    const startDate = new Date(appointment.scheduledAt);
    const endDate = new Date(startDate.getTime() + appointment.durationMinutes * 60 * 1000);

    const formatTime = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `${appointment.serviceType || 'Appointment'} - ${appointment.customerName}`,
        dates: `${formatTime(startDate)}/${formatTime(endDate)}`,
        details: appointment.notes || '',
        location: appointment.location || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL
 */
export function generateOutlookCalendarUrl(appointment: Appointment): string {
    const startDate = new Date(appointment.scheduledAt);
    const endDate = new Date(startDate.getTime() + appointment.durationMinutes * 60 * 1000);

    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: `${appointment.serviceType || 'Appointment'} - ${appointment.customerName}`,
        startdt: startDate.toISOString(),
        enddt: endDate.toISOString(),
        body: appointment.notes || '',
        location: appointment.location || '',
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

// ============================================================================
// APPOINTMENT CRUD
// ============================================================================

// In-memory store (replace with Supabase in production)
const appointments: Map<string, Appointment> = new Map();
const calendarSettings: Map<string, ClientCalendarSettings> = new Map();

/**
 * Create a new appointment
 */
export async function createAppointment(
    input: CreateAppointmentInput,
    settings?: ClientCalendarSettings
): Promise<Appointment> {
    const id = generateUUID();

    const appointment: Appointment = {
        id,
        clientId: input.clientId,
        leadId: input.leadId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        customerContactPref: input.customerContactPref || 'both',
        scheduledAt: input.scheduledAt,
        durationMinutes: input.durationMinutes || settings?.defaultDurationMinutes || 60,
        serviceType: input.serviceType,
        location: input.location,
        notes: input.notes,
        status: 'scheduled',
        confirmationEmailSent: false,
        confirmationSmsSent: false,
        reminder24hEmailSent: false,
        reminder24hSmsSent: false,
        reminder1hEmailSent: false,
        reminder1hSmsSent: false,
        calendarProvider: settings?.calendarProvider,
        createdAt: new Date().toISOString(),
    };

    appointments.set(id, appointment);

    console.log(`[Appointments] Created appointment ${id} for ${input.customerName} at ${input.scheduledAt}`);

    // Schedule reminders
    if (settings?.sendCustomerConfirmation) {
        await scheduleReminders(appointment, settings);
    }

    return appointment;
}

/**
 * Get appointment by ID
 */
export function getAppointment(id: string): Appointment | null {
    return appointments.get(id) || null;
}

/**
 * Get all appointments for a client
 */
export function getClientAppointments(clientId: string): Appointment[] {
    return Array.from(appointments.values())
        .filter(a => a.clientId === clientId)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

/**
 * Get upcoming appointments for a client
 */
export function getUpcomingAppointments(clientId: string): Appointment[] {
    const now = new Date();
    return getClientAppointments(clientId)
        .filter(a => new Date(a.scheduledAt) > now && a.status === 'scheduled');
}

/**
 * Update appointment status
 */
export function updateAppointmentStatus(id: string, status: AppointmentStatus): Appointment | null {
    const appointment = appointments.get(id);
    if (!appointment) return null;

    appointment.status = status;
    console.log(`[Appointments] Updated appointment ${id} status to ${status}`);
    return appointment;
}

/**
 * Cancel appointment
 */
export function cancelAppointment(id: string, reason?: string): Appointment | null {
    const appointment = appointments.get(id);
    if (!appointment) return null;

    appointment.status = 'cancelled';
    if (reason) {
        appointment.notes = `${appointment.notes || ''}\n\nCancelled: ${reason}`;
    }

    console.log(`[Appointments] Cancelled appointment ${id}`);
    return appointment;
}

/**
 * Reschedule appointment
 */
export function rescheduleAppointment(id: string, newScheduledAt: string): Appointment | null {
    const appointment = appointments.get(id);
    if (!appointment) return null;

    appointment.scheduledAt = newScheduledAt;
    appointment.status = 'rescheduled';

    // Reset reminder flags for new time
    appointment.reminder24hEmailSent = false;
    appointment.reminder24hSmsSent = false;
    appointment.reminder1hEmailSent = false;
    appointment.reminder1hSmsSent = false;

    console.log(`[Appointments] Rescheduled appointment ${id} to ${newScheduledAt}`);
    return appointment;
}

// ============================================================================
// CALENDAR SETTINGS
// ============================================================================

/**
 * Get calendar settings for a client
 */
export function getCalendarSettings(clientId: string): ClientCalendarSettings {
    return calendarSettings.get(clientId) || {
        clientId,
        defaultDurationMinutes: 60,
        bufferMinutes: 15,
        availableStartTime: '08:00',
        availableEndTime: '18:00',
        timezone: 'America/New_York',
        workingDays: [1, 2, 3, 4, 5],
        sendCustomerConfirmation: true,
        sendCustomerReminders: true,
        send24hReminder: true,
        send1hReminder: true,
        sendFollowUp: false,
        calendarProvider: 'none',
    };
}

/**
 * Update calendar settings for a client
 */
export function updateCalendarSettings(
    clientId: string,
    updates: Partial<ClientCalendarSettings>
): ClientCalendarSettings {
    const current = getCalendarSettings(clientId);
    const updated = { ...current, ...updates, clientId };
    calendarSettings.set(clientId, updated);
    console.log(`[Appointments] Updated calendar settings for client ${clientId}`);
    return updated;
}

// ============================================================================
// REMINDERS
// ============================================================================

/**
 * Schedule all reminders for an appointment
 */
async function scheduleReminders(
    appointment: Appointment,
    settings: ClientCalendarSettings
): Promise<void> {
    const scheduledAt = new Date(appointment.scheduledAt);
    const now = new Date();

    // Confirmation - immediate
    console.log(`[Appointments] Scheduling confirmation for appointment ${appointment.id}`);

    // 24h reminder
    if (settings.send24hReminder) {
        const reminder24h = new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000);
        if (reminder24h > now) {
            console.log(`[Appointments] 24h reminder scheduled for ${reminder24h.toISOString()}`);
        }
    }

    // 1h reminder
    if (settings.send1hReminder) {
        const reminder1h = new Date(scheduledAt.getTime() - 60 * 60 * 1000);
        if (reminder1h > now) {
            console.log(`[Appointments] 1h reminder scheduled for ${reminder1h.toISOString()}`);
        }
    }

    // TODO: Integrate with Supabase Edge Functions for scheduled execution
}

/**
 * Send confirmation to customer
 */
export async function sendConfirmation(
    appointment: Appointment,
    businessName: string,
    businessPhone: string
): Promise<{ email: boolean; sms: boolean }> {
    const result = { email: false, sms: false };
    const pref = appointment.customerContactPref;

    // Generate calendar links
    const googleLink = generateGoogleCalendarUrl(appointment);
    const outlookLink = generateOutlookCalendarUrl(appointment);

    // Send email if preferred
    if ((pref === 'email' || pref === 'both') && appointment.customerEmail) {
        console.log(`[Appointments] Sending confirmation email to ${appointment.customerEmail}`);
        // TODO: Integrate with Resend
        /*
        await resendService.sendConfirmationEmail({
          to: appointment.customerEmail,
          customerName: appointment.customerName,
          businessName,
          scheduledAt: appointment.scheduledAt,
          serviceType: appointment.serviceType,
          googleLink,
          outlookLink,
        });
        */
        appointment.confirmationEmailSent = true;
        result.email = true;
    }

    // Send SMS if preferred
    if ((pref === 'sms' || pref === 'both') && appointment.customerPhone) {
        console.log(`[Appointments] Sending confirmation SMS to ${appointment.customerPhone}`);
        // TODO: Integrate with Twilio
        /*
        await twilioService.sendSMS({
          to: appointment.customerPhone,
          body: `Your appointment with ${businessName} is confirmed for ${formatDate(appointment.scheduledAt)}. Reply CANCEL to cancel.`,
        });
        */
        appointment.confirmationSmsSent = true;
        result.sms = true;
    }

    return result;
}

/**
 * Send reminder to customer
 */
export async function sendReminder(
    appointment: Appointment,
    reminderType: '24h' | '1h',
    businessName: string
): Promise<{ email: boolean; sms: boolean }> {
    const result = { email: false, sms: false };
    const pref = appointment.customerContactPref;

    const timeLabel = reminderType === '24h' ? 'tomorrow' : 'in 1 hour';

    // Send email if preferred
    if ((pref === 'email' || pref === 'both') && appointment.customerEmail) {
        console.log(`[Appointments] Sending ${reminderType} reminder email to ${appointment.customerEmail}`);
        // TODO: Integrate with Resend
        if (reminderType === '24h') {
            appointment.reminder24hEmailSent = true;
        } else {
            appointment.reminder1hEmailSent = true;
        }
        result.email = true;
    }

    // Send SMS if preferred
    if ((pref === 'sms' || pref === 'both') && appointment.customerPhone) {
        console.log(`[Appointments] Sending ${reminderType} reminder SMS to ${appointment.customerPhone}`);
        // TODO: Integrate with Twilio
        /*
        await twilioService.sendSMS({
          to: appointment.customerPhone,
          body: `Reminder: Your appointment with ${businessName} is ${timeLabel}. See you soon!`,
        });
        */
        if (reminderType === '24h') {
            appointment.reminder24hSmsSent = true;
        } else {
            appointment.reminder1hSmsSent = true;
        }
        result.sms = true;
    }

    return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    createAppointment,
    getAppointment,
    getClientAppointments,
    getUpcomingAppointments,
    updateAppointmentStatus,
    cancelAppointment,
    rescheduleAppointment,
    getCalendarSettings,
    updateCalendarSettings,
    generateICSContent,
    generateGoogleCalendarUrl,
    generateOutlookCalendarUrl,
    sendConfirmation,
    sendReminder,
};
