import { Schedule, Discipline } from '../types';

type AlarmCallback = (schedule: Schedule, discipline: Discipline) => void;

class AlarmService {
  private firedAlarmsToday: Set<string> = new Set();
  private checkInterval: number | null = null;
  private listeners: Set<AlarmCallback> = new Set();
  private lastCheckedDay: number = -1;

  constructor() {
    this.startScheduleChecker();
  }

  // Request browser Notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return Notification.permission;
    }
  }

  getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  // Play gentle bell chime via Web Audio API (works 100% offline and requires zero audio file downloads)
  playAlarmChime() {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const now = ctx.currentTime;
      // Primary chime tone 587.33 Hz (D5) and 880 Hz (A5)
      const freqs = [587.33, 880, 1174.66];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);

        gain.gain.setValueAtTime(0, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.25, now + i * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 1.3);
      });
    } catch (e) {
      console.warn('Audio chime could not be played:', e);
    }
  }

  subscribe(callback: AlarmCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Check schedules against current time
  checkAlarms(schedules: Schedule[], disciplines: Discipline[]) {
    const now = new Date();
    // In JavaScript: Sunday = 0, Monday = 1, ... Saturday = 6
    // In StudyTrack: Monday = 1, Tuesday = 2, ... Sunday = 7
    const jsDay = now.getDay();
    const currentDayOfWeek = jsDay === 0 ? 7 : jsDay;

    // Reset daily cache if day changed
    if (this.lastCheckedDay !== currentDayOfWeek) {
      this.firedAlarmsToday.clear();
      this.lastCheckedDay = currentDayOfWeek;
    }

    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const todayDateStr = now.toISOString().split('T')[0];

    const discMap = new Map(disciplines.map(d => [d.id, d]));

    schedules.forEach(schedule => {
      if (!schedule.alarmEnabled) return;
      if (schedule.dayOfWeek !== currentDayOfWeek) return;

      const alarmKey = `${todayDateStr}_${schedule.id}_${schedule.startTime}`;
      if (this.firedAlarmsToday.has(alarmKey)) return;

      if (schedule.startTime === currentTimeStr) {
        this.firedAlarmsToday.add(alarmKey);
        const discipline = discMap.get(schedule.disciplineId);
        if (!discipline || discipline.archived) return;

        // Trigger alarm chime
        this.playAlarmChime();

        // Trigger Web Notification if allowed
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            navigator.serviceWorker?.ready.then(reg => {
              reg.showNotification(`Está na hora de estudar ${discipline.name}!`, {
                body: `Horário: ${schedule.startTime} - ${schedule.endTime}. Abra o StudyTrack para iniciar o cronómetro.`,
                icon: '/pwa-192x192.png',
                badge: '/icon.svg',
                tag: alarmKey,
              });
            }).catch(() => {
              new Notification(`Está na hora de estudar ${discipline.name}!`, {
                body: `Horário: ${schedule.startTime} - ${schedule.endTime}`,
                icon: '/pwa-192x192.png',
              });
            });
          } catch (e) {
            console.warn('Notification error:', e);
          }
        }

        // Notify in-app listeners
        this.listeners.forEach(cb => cb(schedule, discipline));
      }
    });
  }

  private startScheduleChecker() {
    if (this.checkInterval) return;
    // Check every 10 seconds
    this.checkInterval = window.setInterval(() => {
      // Periodic check tick triggered by react state consumer
    }, 10000);
  }
}

export const alarmService = new AlarmService();
