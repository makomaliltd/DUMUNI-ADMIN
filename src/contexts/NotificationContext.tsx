import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getSupabaseClientSafe } from '@/lib/supabase-browser';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface NotificationContextValue {
  unreadCount: number;
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  fetchNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationContext must be used within NotificationProvider');
  return ctx;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('notification-sound') !== 'off';
  });

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?pageSize=10');
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(json.data);
        setUnreadCount(json.data.filter((n: any) => !n.read).length);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('notification-sound', next ? 'on' : 'off');
      return next;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Fetch initial notifications
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription to new notifications
  useEffect(() => {
    let supabase: any = null;
    try {
      supabase = getSupabaseClientSafe();
    } catch {
      return; // Supabase not configured yet
    }
    if (!supabase) return; // Config not loaded yet
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: any) => {
          const newNotif = payload.new as Record<string, unknown>;
          const notification: Notification = {
            id: String(newNotif.id),
            title: String(newNotif.title || ''),
            message: String(newNotif.message || ''),
            type: String(newNotif.type || 'system'),
            read: false,
            created_at: String(newNotif.created_at || new Date().toISOString()),
          };
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          if (soundEnabled) {
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [soundEnabled]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        markAsRead,
        markAllAsRead,
        soundEnabled,
        toggleSound,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.1;

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.15);
  } catch {
    // Audio not supported
  }
}