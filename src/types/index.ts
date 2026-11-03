export interface Discipline {
  id: string;
  name: string;
  color: string;
  weeklyGoalMinutes: number;
  createdAt: string;
  archived: boolean;
}

export interface Schedule {
  id: string;
  disciplineId: string;
  dayOfWeek: number; // 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado, 7 = Domingo
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  alarmEnabled: boolean;
  alarmMinutesBefore?: number; // 0 = Na hora, 5 = 5 min antes, 10 = 10 min antes, 15 = 15 min antes, 30 = 30 min antes
  alarmRepeat?: boolean; // Repetir alarme caso não seja atendido
  timerEnabled: boolean;
  repeatWeekly: boolean;
  createdAt: string;
}

export interface StudySession {
  id: string;
  disciplineId: string;
  scheduleId: string | null;
  date: string; // YYYY-MM-DD
  startTimestamp: number | null;
  endTimestamp: number | null;
  durationMinutes: number;
  sessionType: 'scheduled' | 'free' | 'manual';
  notes: string;
  createdAt: string;
}

export interface ScheduleOccurrence {
  id: string; // `${scheduleId}_${date}`
  scheduleId: string;
  date: string; // YYYY-MM-DD
  status: 'pending' | 'studied' | 'not_studied';
  completedAt: string | null;
  reason?: string;
}

export interface TimerState {
  disciplineId: string;
  scheduleId: string | null;
  startTimestamp: number | null;
  accumulatedMilliseconds: number;
  status: 'running' | 'paused' | 'stopped';
}

export type ActiveTab = 'calendar' | 'disciplines' | 'dashboard';

export type DashboardFilter =
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'last_30_days'
  | 'last_90_days'
  | 'custom';
