import { Schedule, Discipline } from '../types';
import { timeToMinutes } from '../utils/dateUtils';

type AlarmCallback = (schedule: Schedule, discipline: Discipline, isAdvanceAlert: boolean) => void;

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

  // Play rich alarm chime via Web Audio API + vibration on mobile
  playAlarmChime() {
    // Vibrate device on Android if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([400, 150, 400, 150, 600]);
      } catch {
        // ignore
      }
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Ensure audio context is running (unmuted)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // High-clarity chime chord (E5, A5, C#6, E6)
      const chord = [659.25, 880.0, 1108.73, 1318.51];

      // Two pleasant rings: primary + echo
      [0, 0.45].forEach((offset) => {
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + offset + idx * 0.04);

          gain.gain.setValueAtTime(0, now + offset + idx * 0.04);
          gain.gain.linearRampToValueAtTime(0.3, now + offset + idx * 0.04 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + idx * 0.04 + 0.9);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + offset + idx * 0.04);
          osc.stop(now + offset + idx * 0.04 + 1.0);
        });
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
  checkAlarms(
    schedules: Schedule[],
    disciplines: Discipline[],
    studiedScheduleIdsToday: Set<string> = new Set()
  ) {
    const now = new Date();
    const jsDay = now.getDay();
    const currentDayOfWeek = jsDay === 0 ? 7 : jsDay;

    // Reset daily cache if day changed
    if (this.lastCheckedDay !== currentDayOfWeek) {
      this.firedAlarmsToday.clear();
      this.lastCheckedDay = currentDayOfWeek;
    }

    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
    const todayDateStr = now.toISOString().split('T')[0];

    const discMap = new Map(disciplines.map((d) => [d.id, d]));

    schedules.forEach((schedule) => {
      if (!schedule.alarmEnabled) return;
      if (schedule.dayOfWeek !== currentDayOfWeek) return;

      const discipline = discMap.get(schedule.disciplineId);
      if (!discipline || discipline.archived) return;

      // Skip if already marked studied today
      if (studiedScheduleIdsToday.has(schedule.id)) return;

      const scheduleStartTotalMins = timeToMinutes(schedule.startTime);
      const minutesBefore = schedule.alarmMinutesBefore || 0;

      // 1. Advance Alert (if configured, e.g., 5, 10, 15, 30 min before)
      if (minutesBefore > 0) {
        const advanceTargetMins = scheduleStartTotalMins - minutesBefore;
        if (advanceTargetMins === currentTotalMinutes) {
          const advanceKey = `${todayDateStr}_${schedule.id}_advance_${minutesBefore}`;
          if (!this.firedAlarmsToday.has(advanceKey)) {
            this.firedAlarmsToday.add(advanceKey);
            this.triggerAlert(
              schedule,
              discipline,
              true,
              `Lembrete: Estudo de ${discipline.name} começa em ${minutesBefore} minutos! (${schedule.startTime} - ${schedule.endTime})`
            );
          }
        }
      }

      // 2. Exact On-Time Alert (at startTime)
      if (schedule.startTime === currentTimeStr) {
        const onTimeKey = `${todayDateStr}_${schedule.id}_ontime`;
        if (!this.firedAlarmsToday.has(onTimeKey)) {
          this.firedAlarmsToday.add(onTimeKey);
          this.triggerAlert(
            schedule,
            discipline,
            false,
            `Está na hora de estudar ${discipline.name}! (${schedule.startTime} - ${schedule.endTime})`
          );
        }
      }

      // 3. Repeat Alert (if alarmRepeat is true, repeat 5 minutes after startTime if still not studied)
      if (schedule.alarmRepeat) {
        const repeatTargetMins = scheduleStartTotalMins + 5;
        if (repeatTargetMins === currentTotalMinutes) {
          const repeatKey = `${todayDateStr}_${schedule.id}_repeat_5`;
          if (!this.firedAlarmsToday.has(repeatKey)) {
            this.firedAlarmsToday.add(repeatKey);
            this.triggerAlert(
              schedule,
              discipline,
              false,
              `Segundo aviso: Ainda não iniciou ${discipline.name}! (${schedule.startTime} - ${schedule.endTime})`
            );
          }
        }
      }
    });
  }

  private triggerAlert(
    schedule: Schedule,
    discipline: Discipline,
    isAdvance: boolean,
    message: string
  ) {
    // 1. Audio and Vibration
    this.playAlarmChime();

    // 2. Web Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const baseUrl = import.meta.env.BASE_URL || '/';
        const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const options: NotificationOptions = {
          body: message,
          icon: `${cleanBase}pwa-192x192.png`,
          badge: `${cleanBase}icon.svg`,
          tag: `studytrack_alarm_${schedule.id}`,
          requireInteraction: true,
        };

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(`StudyTrack: ${discipline.name}`, options);
          }).catch(() => {
            new Notification(`StudyTrack: ${discipline.name}`, options);
          });
        } else {
          new Notification(`StudyTrack: ${discipline.name}`, options);
        }
      } catch (e) {
        console.warn('Notification trigger error:', e);
      }
    }

    // 3. In-App Listeners (banner & modals)
    this.listeners.forEach((cb) => cb(schedule, discipline, isAdvance));
  }

  private startScheduleChecker() {
    if (this.checkInterval) return;
    this.checkInterval = window.setInterval(() => {
      // Checked reactively via StudyContext
    }, 10000);
  }
}

export const alarmService = new AlarmService();
