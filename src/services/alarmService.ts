import { Schedule, Discipline } from '../types';
import { timeToMinutes } from '../utils/dateUtils';

export interface SnoozeItem {
  id: string;
  schedule: Schedule;
  discipline: Discipline;
  targetTimestamp: number;
  minutes: number;
}

type AlarmCallback = (
  schedule: Schedule,
  discipline: Discipline,
  isAdvanceAlert: boolean,
  isSnoozedAlert?: boolean
) => void;

class AlarmService {
  private firedAlarmsToday: Set<string> = new Set();
  private checkInterval: number | null = null;
  private listeners: Set<AlarmCallback> = new Set();
  private lastCheckedDay: number = -1;

  // Continuous sound & vibration loop state
  private isRinging: boolean = false;
  private soundLoopInterval: number | null = null;
  private audioCtx: AudioContext | null = null;
  private wakeLockSentinel: any = null;

  // Active ringing schedule reference
  private currentRingingSchedule: Schedule | null = null;
  private currentRingingDiscipline: Discipline | null = null;

  // Snooze Queue (persisted in localStorage)
  private snoozeQueue: SnoozeItem[] = [];

  constructor() {
    this.loadSnoozeQueue();
    this.startScheduleChecker();
  }

  private loadSnoozeQueue() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('studytrack_snooze_queue');
      if (raw) {
        this.snoozeQueue = JSON.parse(raw);
      }
    } catch {
      this.snoozeQueue = [];
    }
  }

  private saveSnoozeQueue() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('studytrack_snooze_queue', JSON.stringify(this.snoozeQueue));
    } catch {
      // ignore
    }
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

  // Returns whether alarm is currently ringing continuously
  getIsRinging(): boolean {
    return this.isRinging;
  }

  getCurrentRinging() {
    return {
      schedule: this.currentRingingSchedule,
      discipline: this.currentRingingDiscipline,
    };
  }

  // Play a single iteration of the rich alarm chime chord
  private playChordBurst() {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtx();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      // High-clarity alarm chime chord: D5 (587.33Hz), A5 (880Hz), D6 (1174.66Hz), F#6 (1479.98Hz)
      const chord = [587.33, 880.0, 1174.66, 1479.98];

      // Double-ring per burst: primary ring + echo ring
      [0, 0.35].forEach((offset) => {
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + offset + idx * 0.03);

          gain.gain.setValueAtTime(0, now + offset + idx * 0.03);
          gain.gain.linearRampToValueAtTime(0.35, now + offset + idx * 0.03 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + idx * 0.03 + 0.85);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + offset + idx * 0.03);
          osc.stop(now + offset + idx * 0.03 + 0.9);
        });
      });
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  // Start continuous alarm ringing: sound and vibration loop without stopping until user acts
  startContinuousAlarm(
    schedule: Schedule,
    discipline: Discipline,
    isAdvance: boolean,
    isSnoozed = false
  ) {
    this.currentRingingSchedule = schedule;
    this.currentRingingDiscipline = discipline;
    this.isRinging = true;

    // 1. Play first chime burst immediately
    this.playChordBurst();

    // 2. Clear any existing intervals
    if (this.soundLoopInterval) {
      clearInterval(this.soundLoopInterval);
    }

    // 3. Repeat chime every 1.8 seconds continuously
    this.soundLoopInterval = window.setInterval(() => {
      if (!this.isRinging) return;
      this.playChordBurst();
    }, 1800);

    // 4. Repeat vibration loop on Android (e.g. 600ms on, 200ms off, 600ms on, 200ms off)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([600, 200, 600, 200, 900]);
      } catch {
        // ignore
      }
    }

    // 5. Acquire Screen Wake Lock if available so phone screen stays on
    this.requestWakeLock();

    // 6. Show persistent Web Notification with direct actions
    this.showSystemNotification(schedule, discipline, isAdvance, isSnoozed);

    // 7. Notify in-app UI listeners (activates FullscreenAlarmModal)
    this.listeners.forEach((cb) => cb(schedule, discipline, isAdvance, isSnoozed));
  }

  // Stop continuous alarm immediately
  stopContinuousAlarm() {
    this.isRinging = false;
    this.currentRingingSchedule = null;
    this.currentRingingDiscipline = null;

    if (this.soundLoopInterval) {
      clearInterval(this.soundLoopInterval);
      this.soundLoopInterval = null;
    }

    // Stop vibration immediately
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {
        // ignore
      }
    }

    // Release wake lock
    this.releaseWakeLock();

    // Close active audio context
    if (this.audioCtx && this.audioCtx.state === 'running') {
      try {
        this.audioCtx.suspend();
      } catch {
        // ignore
      }
    }
  }

  // Snooze current alarm for N minutes
  snoozeCurrentAlarm(schedule: Schedule, discipline: Discipline, minutes: number) {
    this.stopContinuousAlarm();

    const targetTimestamp = Date.now() + minutes * 60 * 1000;
    const snoozeItem: SnoozeItem = {
      id: `snooze_${schedule.id}_${Date.now()}`,
      schedule,
      discipline,
      targetTimestamp,
      minutes,
    };

    // Filter out existing snooze for this schedule and add new one
    this.snoozeQueue = this.snoozeQueue.filter((s) => s.schedule.id !== schedule.id);
    this.snoozeQueue.push(snoozeItem);
    this.saveSnoozeQueue();
  }

  // Preview / Test sound once
  playAlarmChime() {
    this.playChordBurst();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([400, 150, 400, 150, 600]);
      } catch {
        // ignore
      }
    }
  }

  private async requestWakeLock() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      } catch {
        // wakeLock might fail if tab is not active, ignore gracefully
      }
    }
  }

  private releaseWakeLock() {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch {
        // ignore
      }
      this.wakeLockSentinel = null;
    }
  }

  private showSystemNotification(
    schedule: Schedule,
    discipline: Discipline,
    isAdvance: boolean,
    isSnoozed = false
  ) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

      let title = `Despertador StudyTrack: ${discipline.name}`;
      let body = `Horário: ${schedule.startTime} - ${schedule.endTime}. Toque para abrir a tela de alarme.`;

      if (isSnoozed) {
        title = `Lembrete Adiado: ${discipline.name}`;
        body = `O tempo de adiamento terminou! Inicie a sua sessão de estudo agora.`;
      } else if (isAdvance) {
        title = `Lembrete: ${discipline.name} em breve`;
        body = `A sua sessão programada começa em ${schedule.alarmMinutesBefore || 5} minutos!`;
      }

      const options: any = {
        body,
        icon: `${cleanBase}pwa-192x192.png`,
        badge: `${cleanBase}icon.svg`,
        tag: `studytrack_alarm_${schedule.id}`,
        requireInteraction: true, // Keep notification visible until user interacts
        renotify: true,
        vibrate: [600, 250, 600, 250, 900],
        actions: [
          { action: 'study', title: '▶ Estudar Agora' },
          { action: 'snooze', title: '⏱ Adiar' },
          { action: 'skip', title: '✕ Não estudar' },
        ],
        data: {
          scheduleId: schedule.id,
          disciplineId: discipline.id,
        },
      };

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, options);
        }).catch(() => {
          new Notification(title, options);
        });
      } else {
        new Notification(title, options);
      }
    } catch (e) {
      console.warn('Notification trigger error:', e);
    }
  }

  subscribe(callback: AlarmCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Periodic checker for scheduled alarms and snooze timers
  checkAlarms(
    schedules: Schedule[],
    disciplines: Discipline[],
    studiedScheduleIdsToday: Set<string> = new Set()
  ) {
    const now = new Date();
    const nowMs = now.getTime();

    // 1. Check Snooze Queue first
    if (this.snoozeQueue.length > 0) {
      const dueSnoozes: SnoozeItem[] = [];
      const remainingSnoozes: SnoozeItem[] = [];

      this.snoozeQueue.forEach((item) => {
        if (nowMs >= item.targetTimestamp) {
          dueSnoozes.push(item);
        } else {
          remainingSnoozes.push(item);
        }
      });

      if (dueSnoozes.length > 0) {
        this.snoozeQueue = remainingSnoozes;
        this.saveSnoozeQueue();

        const item = dueSnoozes[0];
        if (!studiedScheduleIdsToday.has(item.schedule.id) && !this.isRinging) {
          this.startContinuousAlarm(item.schedule, item.discipline, false, true);
          return;
        }
      }
    }

    // 2. Check Daily Schedules
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

      // A. Advance Alert (e.g. 5, 10, 15, 30 min before)
      if (minutesBefore > 0) {
        const advanceTargetMins = scheduleStartTotalMins - minutesBefore;
        if (advanceTargetMins === currentTotalMinutes) {
          const advanceKey = `${todayDateStr}_${schedule.id}_advance_${minutesBefore}`;
          if (!this.firedAlarmsToday.has(advanceKey)) {
            this.firedAlarmsToday.add(advanceKey);
            if (!this.isRinging) {
              this.startContinuousAlarm(schedule, discipline, true, false);
            }
          }
        }
      }

      // B. Exact On-Time Alert (at startTime) -> Continuous Alarm
      if (schedule.startTime === currentTimeStr) {
        const onTimeKey = `${todayDateStr}_${schedule.id}_ontime`;
        if (!this.firedAlarmsToday.has(onTimeKey)) {
          this.firedAlarmsToday.add(onTimeKey);
          if (!this.isRinging) {
            this.startContinuousAlarm(schedule, discipline, false, false);
          }
        }
      }

      // C. Repeat Alert (if alarmRepeat is true and 5 min elapsed without being studied)
      if (schedule.alarmRepeat) {
        const repeatTargetMins = scheduleStartTotalMins + 5;
        if (repeatTargetMins === currentTotalMinutes) {
          const repeatKey = `${todayDateStr}_${schedule.id}_repeat_5`;
          if (!this.firedAlarmsToday.has(repeatKey)) {
            this.firedAlarmsToday.add(repeatKey);
            if (!this.isRinging) {
              this.startContinuousAlarm(schedule, discipline, false, false);
            }
          }
        }
      }
    });
  }

  private startScheduleChecker() {
    if (this.checkInterval) return;
    // Check every 5 seconds for precise second-level triggering
    this.checkInterval = window.setInterval(() => {
      // Periodic check tick triggered by StudyContext
    }, 5000);
  }
}

export const alarmService = new AlarmService();
