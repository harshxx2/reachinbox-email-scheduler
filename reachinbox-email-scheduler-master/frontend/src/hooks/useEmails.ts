import { useCallback, useEffect, useState } from 'react';
import { getScheduled, getSent } from '../services/api';
import type { ScheduledEmail, SentEmail } from '../types/email';

export function useEmails() {
  const [scheduled, setScheduled] = useState<ScheduledEmail[]>([]);
  const [sent, setSent] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [scheduledData, sentData] = await Promise.all([getScheduled(), getSent()]);
      setScheduled(scheduledData.emails);
      setSent(sentData.emails);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return { scheduled, sent, loading, refresh };
}
