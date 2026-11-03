import { Capacitor, registerPlugin } from '@capacitor/core';
import { Schedule, Discipline } from '../types';

interface StudyTrackAlarmPluginInterface {
  scheduleAlarm(options: {
    scheduleId: string;
    disciplineId: string;
    disciplineName: string;
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    color: string;
    advanceMinutes: number;
    alarmId?: string;
  }): Promise<{ success: boolean; alarmId: string; targetTimestamp: number }>;

  cancelAlarm(options: { alarmId: string }): Promise<{ success: boolean }>;
  cancelAllAlarms(): Promise<{ success: boolean }>;
  stopActiveAlarm(): Promise<{ success: boolean }>;
  testTriggerAlarm(options?: {
    disciplineName?: string;
    scheduleId?: string;
    disciplineId?: string;
  }): Promise<{ success: boolean }>;

  checkPermissions(): Promise<{
    exactAlarmGranted: boolean;
    notificationsGranted: boolean;
    batteryOptimizationIgnored: boolean;
    isAndroid: boolean;
  }>;

  requestExactAlarmPermission(): Promise<{ success: boolean }>;
  requestBatteryOptimizationExemption(): Promise<{ success: boolean }>;
  getPendingAlarms(): Promise<{ alarms: any[] }>;
}

const StudyTrackAlarm = registerPlugin<StudyTrackAlarmPluginInterface>('StudyTrackAlarm');

class NativeAlarmBridge {
  isNative(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

  async checkPermissions() {
    if (!this.isNative()) {
      return {
        isNative: false,
        exactAlarmGranted: true,
        notificationsGranted: typeof Notification !== 'undefined' && Notification.permission === 'granted',
        batteryOptimizationIgnored: true,
      };
    }
    try {
      const res = await StudyTrackAlarm.checkPermissions();
      return {
        isNative: true,
        exactAlarmGranted: res.exactAlarmGranted,
        notificationsGranted: res.notificationsGranted,
        batteryOptimizationIgnored: res.batteryOptimizationIgnored,
      };
    } catch (e) {
      console.warn('Native checkPermissions error:', e);
      return {
        isNative: true,
        exactAlarmGranted: false,
        notificationsGranted: false,
        batteryOptimizationIgnored: false,
      };
    }
  }

  async requestExactAlarmPermission(): Promise<boolean> {
    if (!this.isNative()) return true;
    try {
      await StudyTrackAlarm.requestExactAlarmPermission();
      return true;
    } catch (e) {
      console.warn('requestExactAlarmPermission error:', e);
      return false;
    }
  }

  async requestBatteryOptimizationExemption(): Promise<boolean> {
    if (!this.isNative()) return true;
    try {
      await StudyTrackAlarm.requestBatteryOptimizationExemption();
      return true;
    } catch (e) {
      console.warn('requestBatteryOptimizationExemption error:', e);
      return false;
    }
  }

  async scheduleScheduleAlarms(schedule: Schedule, discipline: Discipline) {
    if (!this.isNative() || !schedule.alarmEnabled) return;

    try {
      // 1. Advance Alert (if configured)
      const advance = schedule.alarmMinutesBefore || 0;
      if (advance > 0) {
        await StudyTrackAlarm.scheduleAlarm({
          alarmId: `sched_${schedule.id}_adv_${advance}`,
          scheduleId: schedule.id,
          disciplineId: discipline.id,
          disciplineName: discipline.name,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          dayOfWeek: schedule.dayOfWeek,
          color: discipline.color,
          advanceMinutes: advance,
        });
      }

      // 2. Exact On-Time Alarm
      await StudyTrackAlarm.scheduleAlarm({
        alarmId: `sched_${schedule.id}_ontime`,
        scheduleId: schedule.id,
        disciplineId: discipline.id,
        disciplineName: discipline.name,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        dayOfWeek: schedule.dayOfWeek,
        color: discipline.color,
        advanceMinutes: 0,
      });
    } catch (e) {
      console.warn('scheduleScheduleAlarms native error:', e);
    }
  }

  async cancelScheduleAlarms(scheduleId: string) {
    if (!this.isNative()) return;
    try {
      await StudyTrackAlarm.cancelAlarm({ alarmId: `sched_${scheduleId}_ontime` });
      await StudyTrackAlarm.cancelAlarm({ alarmId: `sched_${scheduleId}_adv_5` });
      await StudyTrackAlarm.cancelAlarm({ alarmId: `sched_${scheduleId}_adv_10` });
      await StudyTrackAlarm.cancelAlarm({ alarmId: `sched_${scheduleId}_adv_15` });
      await StudyTrackAlarm.cancelAlarm({ alarmId: `sched_${scheduleId}_adv_30` });
    } catch (e) {
      console.warn('cancelScheduleAlarms native error:', e);
    }
  }

  async syncAllSchedules(schedules: Schedule[], disciplines: Discipline[]) {
    if (!this.isNative()) return;

    try {
      // Clear and reschedule fresh
      await StudyTrackAlarm.cancelAllAlarms();
      const discMap = new Map(disciplines.map((d) => [d.id, d]));

      for (const sched of schedules) {
        if (!sched.alarmEnabled) continue;
        const disc = discMap.get(sched.disciplineId);
        if (!disc || disc.archived) continue;
        await this.scheduleScheduleAlarms(sched, disc);
      }
    } catch (e) {
      console.warn('syncAllSchedules error:', e);
    }
  }

  async stopActiveAlarm() {
    if (!this.isNative()) return;
    try {
      await StudyTrackAlarm.stopActiveAlarm();
    } catch (e) {
      console.warn('stopActiveAlarm error:', e);
    }
  }

  async testTriggerAlarm(disciplineName = 'Excel e Análise de Dados', scheduleId = 'test', disciplineId = 'test') {
    if (!this.isNative()) return;
    try {
      await StudyTrackAlarm.testTriggerAlarm({
        disciplineName,
        scheduleId,
        disciplineId,
      });
    } catch (e) {
      console.warn('testTriggerAlarm error:', e);
    }
  }
}

export const nativeAlarmBridge = new NativeAlarmBridge();
