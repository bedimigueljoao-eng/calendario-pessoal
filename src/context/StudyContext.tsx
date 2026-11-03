import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  Discipline,
  Schedule,
  StudySession,
  ScheduleOccurrence,
  TimerState,
  ActiveTab,
} from '../types';
import { dbService } from '../database/db';
import { alarmService } from '../services/alarmService';
import { nativeAlarmBridge } from '../services/nativeAlarmBridge';
import { getMondayOfWeek, toDateString } from '../utils/dateUtils';
import confetti from 'canvas-confetti';

interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

interface ActiveAlarmData {
  schedule: Schedule;
  discipline: Discipline;
  isAdvanceAlert?: boolean;
  isSnoozed?: boolean;
}

interface StudyContextType {
  disciplines: Discipline[];
  schedules: Schedule[];
  studySessions: StudySession[];
  scheduleOccurrences: ScheduleOccurrence[];
  timerState: TimerState | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentWeekMonday: Date;
  setCurrentWeekMonday: (date: Date) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isLoading: boolean;

  // Disciplines
  addDiscipline: (data: { name: string; color: string; weeklyGoalMinutes: number }) => Promise<string>;
  updateDiscipline: (id: string, data: Partial<Discipline>) => Promise<void>;
  archiveDiscipline: (id: string, archived: boolean) => Promise<void>;
  deleteDiscipline: (id: string) => Promise<void>;

  // Schedules
  addSchedule: (data: Omit<Schedule, 'id' | 'createdAt'>) => Promise<string>;
  updateSchedule: (id: string, data: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;

  // Occurrences
  markOccurrenceAsStudied: (
    scheduleId: string,
    date: string,
    hours: number,
    minutes: number,
    notes?: string
  ) => Promise<void>;
  markOccurrenceAsNotStudied: (scheduleId: string, date: string, reason?: string) => Promise<void>;
  markOccurrenceAsPending: (scheduleId: string, date: string) => Promise<void>;

  // Sessions
  addManualSession: (
    disciplineId: string,
    date: string,
    hours: number,
    minutes: number,
    notes?: string
  ) => Promise<void>;
  deleteStudySession: (id: string) => Promise<void>;

  // Timer
  startTimer: (disciplineId: string, scheduleId?: string | null) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: (save: boolean, notes?: string) => Promise<StudySession | null>;
  currentElapsedMs: number;

  // Modals & Triggers
  isTimerModalOpen: boolean;
  setIsTimerModalOpen: (open: boolean) => void;
  isManualModalOpen: boolean;
  setIsManualModalOpen: (open: boolean) => void;
  isAndroidNoticeOpen: boolean;
  setIsAndroidNoticeOpen: (open: boolean) => void;
  isAndroidSetupOpen: boolean;
  setIsAndroidSetupOpen: (open: boolean) => void;

  // Alarm & Actions
  activeAlarm: ActiveAlarmData | null;
  isAlarmRinging: boolean;
  handleAlarmStudy: () => Promise<void>;
  handleAlarmSnooze: (minutes: number) => void;
  handleAlarmSkip: (reason?: string) => Promise<void>;
  dismissActiveAlarm: () => void;
  notificationPermission: NotificationPermission;
  requestNotificationAccess: () => Promise<void>;

  // Toast
  toast: ToastData | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [scheduleOccurrences, setScheduleOccurrences] = useState<ScheduleOccurrence[]>([]);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('calendar');
  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateString(new Date()));

  // Active alarms & modal controllers
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarmData | null>(null);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAndroidNoticeOpen, setIsAndroidNoticeOpen] = useState(false);
  const [isAndroidSetupOpen, setIsAndroidSetupOpen] = useState(() => {
    try {
      return localStorage.getItem('studytrack_setup_done') !== 'true';
    } catch {
      return false;
    }
  });
  const [toast, setToast] = useState<ToastData | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
    alarmService.getPermissionStatus()
  );

  // Live timer tick
  const [currentElapsedMs, setCurrentElapsedMs] = useState(0);
  const isSavingSessionRef = useRef(false);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(curr => (curr?.id === id ? null : curr));
    }, 3800);
  }, []);

  // Initial data load
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [dList, sList, sessList, occList, tState] = await Promise.all([
          dbService.getDisciplines(),
          dbService.getSchedules(),
          dbService.getStudySessions(),
          dbService.getScheduleOccurrences(),
          dbService.getTimerState(),
        ]);
        if (mounted) {
          setDisciplines(dList);
          setSchedules(sList);
          setStudySessions(sessList);
          setScheduleOccurrences(occList);
          setTimerState(tState);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Alarm listener and periodic check
  useEffect(() => {
    const unsubscribe = alarmService.subscribe((schedule, discipline, isAdvanceAlert, isSnoozed) => {
      setActiveAlarm({ schedule, discipline, isAdvanceAlert, isSnoozed });
    });

    const runAlarmCheck = () => {
      const todayStr = toDateString(new Date());
      const studiedIds = new Set(
        scheduleOccurrences
          .filter((o) => o.date === todayStr && o.status === 'studied')
          .map((o) => o.scheduleId)
      );
      alarmService.checkAlarms(schedules, disciplines, studiedIds);
    };

    const interval = setInterval(runAlarmCheck, 5000);
    runAlarmCheck();

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [schedules, disciplines, scheduleOccurrences]);

  // Sync schedules with native Android AlarmManager whenever schedules or disciplines update
  useEffect(() => {
    if (schedules.length > 0 && disciplines.length > 0) {
      nativeAlarmBridge.syncAllSchedules(schedules, disciplines);
    }
  }, [schedules, disciplines]);

  // Request notifications
  const requestNotificationAccess = async () => {
    const perm = await alarmService.requestNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      showToast('Notificações de estudo ativadas!', 'success');
    } else {
      showToast('Permissão de notificações não concedida.', 'warning');
    }
  };

  const isAlarmRinging = activeAlarm !== null;

  const dismissActiveAlarm = () => {
    nativeAlarmBridge.stopActiveAlarm();
    alarmService.stopContinuousAlarm();
    setActiveAlarm(null);
  };

  const handleAlarmStudy = async () => {
    if (!activeAlarm) return;
    const { schedule, discipline } = activeAlarm;
    nativeAlarmBridge.stopActiveAlarm();
    alarmService.stopContinuousAlarm();
    setActiveAlarm(null);
    await startTimer(discipline.id, schedule.id);
    setIsTimerModalOpen(true);
    showToast(`Sessão de ${discipline.name} iniciada! Bons estudos.`);
  };

  const handleAlarmSnooze = (minutes: number) => {
    if (!activeAlarm) return;
    const { schedule, discipline } = activeAlarm;
    nativeAlarmBridge.stopActiveAlarm();
    alarmService.snoozeCurrentAlarm(schedule, discipline, minutes);
    setActiveAlarm(null);
    showToast(`Alarme de ${discipline.name} adiado por ${minutes} minutos.`, 'info');
  };

  const handleAlarmSkip = async (reason?: string) => {
    if (!activeAlarm) return;
    const { schedule, discipline } = activeAlarm;
    nativeAlarmBridge.stopActiveAlarm();
    alarmService.stopContinuousAlarm();
    const todayStr = toDateString(new Date());
    await markOccurrenceAsNotStudied(schedule.id, todayStr, reason);
    setActiveAlarm(null);
    showToast(`Sessão de ${discipline.name} registada como não realizada.`, 'warning');
  };

  // Timer live ticker
  useEffect(() => {
    if (!timerState || timerState.status === 'stopped') {
      setCurrentElapsedMs(0);
      return;
    }

    if (timerState.status === 'paused') {
      setCurrentElapsedMs(timerState.accumulatedMilliseconds);
      return;
    }

    // Status is 'running'
    const updateElapsed = () => {
      if (timerState.startTimestamp) {
        const now = Date.now();
        const delta = Math.max(0, now - timerState.startTimestamp);
        setCurrentElapsedMs(timerState.accumulatedMilliseconds + delta);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 500);
    return () => clearInterval(interval);
  }, [timerState]);

  // --- Discipline Actions ---
  const addDiscipline = async (data: { name: string; color: string; weeklyGoalMinutes: number }) => {
    const newDiscipline: Discipline = {
      id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: data.name.trim(),
      color: data.color,
      weeklyGoalMinutes: Math.max(0, data.weeklyGoalMinutes),
      createdAt: new Date().toISOString(),
      archived: false,
    };
    await dbService.saveDiscipline(newDiscipline);
    setDisciplines(prev => [...prev, newDiscipline]);
    showToast('Disciplina criada com sucesso.');
    return newDiscipline.id;
  };

  const updateDiscipline = async (id: string, data: Partial<Discipline>) => {
    const target = disciplines.find(d => d.id === id);
    if (!target) return;
    const updated: Discipline = {
      ...target,
      ...data,
      name: data.name !== undefined ? data.name.trim() : target.name,
      weeklyGoalMinutes: data.weeklyGoalMinutes !== undefined ? Math.max(0, data.weeklyGoalMinutes) : target.weeklyGoalMinutes,
    };
    await dbService.saveDiscipline(updated);
    setDisciplines(prev => prev.map(d => (d.id === id ? updated : d)));
    showToast('Disciplina actualizada com sucesso.');
  };

  const archiveDiscipline = async (id: string, archived: boolean) => {
    const target = disciplines.find(d => d.id === id);
    if (!target) return;
    const updated: Discipline = { ...target, archived };
    await dbService.saveDiscipline(updated);
    setDisciplines(prev => prev.map(d => (d.id === id ? updated : d)));
    showToast(archived ? 'Disciplina arquivada. O histórico foi preservado.' : 'Disciplina reativada.');
  };

  const deleteDiscipline = async (id: string) => {
    await dbService.deleteDiscipline(id);
    setDisciplines(prev => prev.filter(d => d.id !== id));
    showToast('Disciplina eliminada. O histórico de sessões foi preservado.');
  };

  // --- Schedule Actions ---
  const addSchedule = async (data: Omit<Schedule, 'id' | 'createdAt'>) => {
    const newSchedule: Schedule = {
      ...data,
      id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    await dbService.saveSchedule(newSchedule);
    setSchedules(prev => [...prev, newSchedule]);
    showToast('Programação criada com sucesso.');
    return newSchedule.id;
  };

  const updateSchedule = async (id: string, data: Partial<Schedule>) => {
    const target = schedules.find(s => s.id === id);
    if (!target) return;
    const updated: Schedule = { ...target, ...data };
    await dbService.saveSchedule(updated);
    setSchedules(prev => prev.map(s => (s.id === id ? updated : s)));
    showToast('Programação actualizada.');
  };

  const deleteSchedule = async (id: string) => {
    await dbService.deleteSchedule(id);
    setSchedules(prev => prev.filter(s => s.id !== id));
    showToast('Programação eliminada. O histórico de estudo foi preservado.');
  };

  // --- Occurrences & Study Actions ---
  const markOccurrenceAsStudied = async (
    scheduleId: string,
    date: string,
    hours: number,
    minutes: number,
    notes = ''
  ) => {
    if (isSavingSessionRef.current) return;
    isSavingSessionRef.current = true;

    try {
      const schedule = schedules.find(s => s.id === scheduleId);
      const disciplineId = schedule?.disciplineId || '';
      const totalMinutes = Math.max(1, hours * 60 + minutes);

      // Save Occurrence
      const occId = `${scheduleId}_${date}`;
      const occurrence: ScheduleOccurrence = {
        id: occId,
        scheduleId,
        date,
        status: 'studied',
        completedAt: new Date().toISOString(),
      };
      await dbService.saveScheduleOccurrence(occurrence);
      setScheduleOccurrences(prev => [...prev.filter(o => o.id !== occId), occurrence]);

      // Save StudySession
      const session: StudySession = {
        id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        disciplineId,
        scheduleId,
        date,
        startTimestamp: null,
        endTimestamp: null,
        durationMinutes: totalMinutes,
        sessionType: 'scheduled',
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      };
      await dbService.saveStudySession(session);
      setStudySessions(prev => [session, ...prev]);

      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore confetti errors
      }

      showToast('Sessão de estudo guardada.');
    } finally {
      isSavingSessionRef.current = false;
    }
  };

  const markOccurrenceAsNotStudied = async (scheduleId: string, date: string, reason?: string) => {
    const occId = `${scheduleId}_${date}`;
    const occurrence: ScheduleOccurrence = {
      id: occId,
      scheduleId,
      date,
      status: 'not_studied',
      completedAt: null,
      reason: reason?.trim() || undefined,
    };
    await dbService.saveScheduleOccurrence(occurrence);
    setScheduleOccurrences(prev => [...prev.filter(o => o.id !== occId), occurrence]);
    showToast('Programação marcada como não realizada.');
  };

  const markOccurrenceAsPending = async (scheduleId: string, date: string) => {
    const occId = `${scheduleId}_${date}`;
    const occurrence: ScheduleOccurrence = {
      id: occId,
      scheduleId,
      date,
      status: 'pending',
      completedAt: null,
    };
    await dbService.saveScheduleOccurrence(occurrence);
    setScheduleOccurrences(prev => [...prev.filter(o => o.id !== occId), occurrence]);
    showToast('Estado da programação reposto para pendente.');
  };

  // --- Manual Session ---
  const addManualSession = async (
    disciplineId: string,
    date: string,
    hours: number,
    minutes: number,
    notes = ''
  ) => {
    if (isSavingSessionRef.current) return;
    isSavingSessionRef.current = true;

    try {
      const totalMinutes = hours * 60 + minutes;
      if (totalMinutes <= 0) {
        showToast('A duração deve ser superior a 0 minutos.', 'warning');
        return;
      }

      const session: StudySession = {
        id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        disciplineId,
        scheduleId: null,
        date,
        startTimestamp: null,
        endTimestamp: null,
        durationMinutes: totalMinutes,
        sessionType: 'manual',
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      };

      await dbService.saveStudySession(session);
      setStudySessions(prev => [session, ...prev]);
      showToast('Sessão de estudo guardada.');
    } finally {
      isSavingSessionRef.current = false;
    }
  };

  const deleteStudySession = async (id: string) => {
    await dbService.deleteStudySession(id);
    setStudySessions(prev => prev.filter(s => s.id !== id));
    showToast('Sessão eliminada com sucesso.');
  };

  // --- Stopwatch / Timer Actions ---
  const startTimer = async (disciplineId: string, scheduleId: string | null = null) => {
    const newState: TimerState = {
      disciplineId,
      scheduleId,
      startTimestamp: Date.now(),
      accumulatedMilliseconds: 0,
      status: 'running',
    };
    await dbService.saveTimerState(newState);
    setTimerState(newState);
    setIsTimerModalOpen(true);
    showToast('Cronómetro iniciado.');
  };

  const pauseTimer = async () => {
    if (!timerState || timerState.status !== 'running') return;
    const now = Date.now();
    const elapsedSinceStart = timerState.startTimestamp ? now - timerState.startTimestamp : 0;
    const newState: TimerState = {
      ...timerState,
      startTimestamp: null,
      accumulatedMilliseconds: timerState.accumulatedMilliseconds + elapsedSinceStart,
      status: 'paused',
    };
    await dbService.saveTimerState(newState);
    setTimerState(newState);
    showToast('Cronómetro pausado.', 'info');
  };

  const resumeTimer = async () => {
    if (!timerState || timerState.status !== 'paused') return;
    const newState: TimerState = {
      ...timerState,
      startTimestamp: Date.now(),
      status: 'running',
    };
    await dbService.saveTimerState(newState);
    setTimerState(newState);
    showToast('Cronómetro retomado.', 'info');
  };

  const stopTimer = async (save: boolean, notes = ''): Promise<StudySession | null> => {
    if (!timerState) return null;
    if (isSavingSessionRef.current) return null;
    isSavingSessionRef.current = true;

    try {
      let totalMs = timerState.accumulatedMilliseconds;
      if (timerState.status === 'running' && timerState.startTimestamp) {
        totalMs += Math.max(0, Date.now() - timerState.startTimestamp);
      }

      let createdSession: StudySession | null = null;

      if (save && totalMs >= 30000) { // at least 30 seconds to count as 1 min
        const durationMinutes = Math.max(1, Math.round(totalMs / 60000));
        const todayStr = toDateString(new Date());

        createdSession = {
          id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          disciplineId: timerState.disciplineId,
          scheduleId: timerState.scheduleId,
          date: todayStr,
          startTimestamp: Date.now() - totalMs,
          endTimestamp: Date.now(),
          durationMinutes,
          sessionType: timerState.scheduleId ? 'scheduled' : 'free',
          notes: notes.trim(),
          createdAt: new Date().toISOString(),
        };

        await dbService.saveStudySession(createdSession);
        setStudySessions(prev => [createdSession!, ...prev]);

        // If from schedule, update today's occurrence
        if (timerState.scheduleId) {
          const occId = `${timerState.scheduleId}_${todayStr}`;
          const occurrence: ScheduleOccurrence = {
            id: occId,
            scheduleId: timerState.scheduleId,
            date: todayStr,
            status: 'studied',
            completedAt: new Date().toISOString(),
          };
          await dbService.saveScheduleOccurrence(occurrence);
          setScheduleOccurrences(prev => [...prev.filter(o => o.id !== occId), occurrence]);
        }

        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }

        showToast('Sessão de estudo guardada.');
      } else if (save && totalMs < 30000) {
        showToast('Sessão inferior a 30 segundos não foi guardada.', 'warning');
      }

      await dbService.saveTimerState(null);
      setTimerState(null);
      setIsTimerModalOpen(false);

      return createdSession;
    } finally {
      isSavingSessionRef.current = false;
    }
  };

  // Handle deep-link event triggered from native AlarmActivity when user taps 'Estudar'
  useEffect(() => {
    const handleNativeStudyAction = async (e: Event) => {
      const customEvent = e as CustomEvent<{
        scheduleId?: string;
        disciplineId?: string;
        disciplineName?: string;
      }>;
      const detail = customEvent.detail;
      if (!detail) return;

      nativeAlarmBridge.stopActiveAlarm();
      alarmService.stopContinuousAlarm();
      setActiveAlarm(null);

      if (detail.disciplineId) {
        await startTimer(detail.disciplineId, detail.scheduleId || null);
        setIsTimerModalOpen(true);
        showToast(`Sessão de ${detail.disciplineName || 'estudo'} iniciada!`);
      }
    };

    window.addEventListener('studytrack_open_study', handleNativeStudyAction);
    return () => {
      window.removeEventListener('studytrack_open_study', handleNativeStudyAction);
    };
  }, []);

  return (
    <StudyContext.Provider
      value={{
        disciplines,
        schedules,
        studySessions,
        scheduleOccurrences,
        timerState,
        activeTab,
        setActiveTab,
        currentWeekMonday,
        setCurrentWeekMonday,
        selectedDate,
        setSelectedDate,
        isLoading,

        addDiscipline,
        updateDiscipline,
        archiveDiscipline,
        deleteDiscipline,

        addSchedule,
        updateSchedule,
        deleteSchedule,

        markOccurrenceAsStudied,
        markOccurrenceAsNotStudied,
        markOccurrenceAsPending,

        addManualSession,
        deleteStudySession,

        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        currentElapsedMs,

        isTimerModalOpen,
        setIsTimerModalOpen,
        isManualModalOpen,
        setIsManualModalOpen,
        isAndroidNoticeOpen,
        setIsAndroidNoticeOpen,
        isAndroidSetupOpen,
        setIsAndroidSetupOpen,

        activeAlarm,
        isAlarmRinging,
        handleAlarmStudy,
        handleAlarmSnooze,
        handleAlarmSkip,
        dismissActiveAlarm,
        notificationPermission,
        requestNotificationAccess,

        toast,
        showToast,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export function useStudy(): StudyContextType {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
}
