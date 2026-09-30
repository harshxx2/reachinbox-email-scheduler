import type { ScheduledEmail, SentEmail, User } from '../types/email';

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};

export async function getMe() {
  return api<{ user: User }>('/api/auth/me');
}

export async function logout() {
  return api<void>('/api/auth/logout', { method: 'POST' });
}

export async function getScheduled() {
  return api<{ emails: ScheduledEmail[] }>('/api/emails/scheduled');
}

export async function getSent() {
  return api<{ emails: SentEmail[] }>('/api/emails/sent');
}

export async function scheduleEmails(payload: {
  subject: string;
  body: string;
  recipients: string[];
  startTime: string;
  delayMs: number;
  hourlyLimit: number;
  idempotencyKey: string;
}) {
  return api<{ created: number; campaign: { id: string } }>('/api/emails/schedule', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
