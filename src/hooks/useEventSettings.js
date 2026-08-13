import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useEventSettings
 *
 * Fetches the singleton `event_settings` row and subscribes to realtime
 * changes so any admin update is instantly reflected in the hacker portal.
 *
 * Returns:
 *  - deadline       : Date | null   — submission_deadline as a JS Date
 *  - submissionsOpen: boolean       — admin kill-switch
 *  - secondsLeft    : number | null — seconds until deadline (null if no deadline)
 *  - isExpired      : boolean       — true when past deadline OR submissions_open=false
 */
export function useEventSettings() {
  const [deadline, setDeadline]             = useState(null);
  const [submissionsOpen, setSubmissionsOpen] = useState(true);
  const [secondsLeft, setSecondsLeft]       = useState(null);
  const [tick, setTick]                     = useState(0);

  // ── Fetch + realtime subscription ────────────────────────────────────────
  useEffect(() => {
    let channel;

    async function load() {
      const { data, error } = await supabase
        .from('event_settings')
        .select('submission_deadline, submissions_open')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        console.error('[useEventSettings] fetch error:', error);
        return;
      }

      if (data) {
        setDeadline(data.submission_deadline ? new Date(data.submission_deadline) : null);
        setSubmissionsOpen(data.submissions_open ?? true);
      }
    }

    load();

    // Subscribe to realtime changes on event_settings
    channel = supabase
      .channel('event_settings_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'event_settings' },
        (payload) => {
          const d = payload.new;
          setDeadline(d.submission_deadline ? new Date(d.submission_deadline) : null);
          setSubmissionsOpen(d.submissions_open ?? true);
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // ── Local countdown ticker (every second) ─────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!deadline) {
        setSecondsLeft(null);
        return;
      }
      const diff = Math.floor((deadline.getTime() - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, diff));
    }, 0);
    return () => clearTimeout(timer);
  }, [deadline, tick]);

  const isExpired = !submissionsOpen || (secondsLeft !== null && secondsLeft <= 0);

  return { deadline, submissionsOpen, secondsLeft, isExpired };
}
