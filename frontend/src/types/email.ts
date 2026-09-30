export type EmailStatus = 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface ScheduledEmail {
  id: string;
  recipient: string;
  subject: string;
  scheduledAt: string;
  status: Extract<EmailStatus, 'SCHEDULED' | 'PROCESSING'>;
  sender: { email: string };
}

export interface SentEmail {
  id: string;
  recipient: string;
  subject: string;
  sentAt: string | null;
  status: Extract<EmailStatus, 'SENT' | 'FAILED'>;
  lastError: string | null;
  sender: { email: string };
}
