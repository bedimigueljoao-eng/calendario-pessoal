import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { Schedule, Discipline } from '../types';
import {
  DAYS_OF_WEEK,
  getDaysInWeek,
  getMondayOfWeek,
  toDateString,
  timeToMinutes,
  formatDuration,
} from '../utils/dateUtils';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Bell,
  BellOff,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  CalendarDays,
  Columns,
} from 'lucide-react';
import { ScheduleActionModal } from '../components/ScheduleActionModal';
import { MarkStudiedModal } from '../components/MarkStudiedModal';
import { ScheduleFormModal } from '../components/ScheduleFormModal';
import { DisciplineFormModal } from '../components/DisciplineFormModal';

type CalendarViewMode = 'day' | 'week';

export const CalendarPage: React.FC = () => {
  const {
    disciplines,
    schedules,
    scheduleOccurrences,
    currentWeekMonday,
    setCurrentWeekMonday,
    selectedDate,
    setSelectedDate,
    deleteSchedule,
    startTimer,
    setIsTimerModalOpen,
  } = useStudy();

  // View Mode: 'day' (Dia) or 'week' (Semana)
  const [calendarView, setCalendarView] = useState<CalendarViewMode>('day');

  // Modals state
  const [selectedScheduleForAction, setSelectedScheduleForAction] = useState<Schedule | null>(null);
  const [actionModalDate, setActionModalDate] = useState<string>(selectedDate);
  const [scheduleToMarkStudied, setScheduleToMarkStudied] = useState<Schedule | null>(null);
  const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | null>(null);
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);
  const [defaultDayForCreate, setDefaultDayForCreate] = useState<number>(1);
  const [isCreateDisciplineOpen, setIsCreateDisciplineOpen] = useState(false);

  // 7 days of the currently selected week
  const weekDays = getDaysInWeek(currentWeekMonday);
  const todayStr = toDateString(new Date());

  // Week navigation
  const handlePrevWeek = () => {
    const prev = new Date(currentWeekMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekMonday(prev);
    setSelectedDate(toDateString(prev));
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekMonday);
    next.setDate(next.getDate() + 7);
    setCurrentWeekMonday(next);
    setSelectedDate(toDateString(next));
  };

  const handleReturnToCurrentWeek = () => {
    const currentMonday = getMondayOfWeek(new Date());
    setCurrentWeekMonday(currentMonday);
    setSelectedDate(todayStr);
  };

  // Find dayOfWeek (1-7) for currently selected date in Day view
  const selectedDateObj = new Date(selectedDate + 'T12:00:00');
  const jsDay = selectedDateObj.getDay();
  const selectedDayOfWeek = jsDay === 0 ? 7 : jsDay;

  // Schedules matching selected day of week, sorted by start time
  const daySchedules = schedules
    .filter((s) => s.dayOfWeek === selectedDayOfWeek)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const discMap = new Map<string, Discipline>(disciplines.map((d) => [d.id, d]));

  // Week range label
  const weekEndSunday = weekDays[6];
  const weekLabel = `${weekDays[0].toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
  })} – ${weekEndSunday.toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;

  const isCurrentWeek =
    toDateString(currentWeekMonday) === toDateString(getMondayOfWeek(new Date()));

  // Total weekly scheduled study time
  const totalWeeklyMinutes = schedules.reduce((acc, s) => {
    const duration = timeToMinutes(s.endTime) - timeToMinutes(s.startTime);
    return acc + Math.max(0, duration);
  }, 0);

  return (
    <div className="pb-28 max-w-5xl mx-auto px-4 pt-4 sm:pt-6">
      {/* Top Bar with View Mode Switcher [ DIA ] [ SEMANA ] and Week Navigation */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/80 mb-4">
        {/* Row 1: View Switcher & Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-gray-100">
          {/* Segmented Control [ DIA ] [ SEMANA ] */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setCalendarView('day')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                calendarView === 'day'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>DIA</span>
            </button>
            <button
              type="button"
              onClick={() => setCalendarView('week')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                calendarView === 'week'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>SEMANA</span>
            </button>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setDefaultDayForCreate(selectedDayOfWeek);
                setIsCreateScheduleOpen(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Programação</span>
            </button>
          </div>
        </div>

        {/* Row 2: Week Navigation Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={handlePrevWeek}
                className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white transition"
                title="Semana anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleReturnToCurrentWeek}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  isCurrentWeek
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-white'
                }`}
                title="Voltar à semana atual"
              >
                Semana Atual
              </button>

              <button
                onClick={handleNextWeek}
                className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white transition"
                title="Semana seguinte"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs sm:text-sm font-semibold text-[#142B4A] capitalize sm:ml-2">
              {weekLabel}
            </div>
          </div>

          {calendarView === 'week' && (
            <div className="text-xs text-gray-500 font-medium">
              Total programado: <span className="font-bold text-blue-600 font-mono">{formatDuration(totalWeeklyMinutes)}</span>
            </div>
          )}
        </div>

        {/* 7 Days of the Week Selector Cards (for Day View navigation) */}
        {calendarView === 'day' && (
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mt-4 pt-3 border-t border-gray-100">
            {weekDays.map((d, index) => {
              const dateStr = toDateString(d);
              const isSelected = selectedDate === dateStr;
              const isToday = todayStr === dateStr;
              const dayOfWeekNum = index + 1;

              // Count schedules for this day
              const countForDay = schedules.filter((s) => s.dayOfWeek === dayOfWeekNum).length;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative py-2.5 px-1 sm:px-2 rounded-xl flex flex-col items-center justify-center transition border ${
                    isSelected
                      ? 'bg-[#142B4A] text-white border-[#142B4A] shadow-md scale-[1.02]'
                      : isToday
                      ? 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100/70'
                      : 'bg-gray-50/70 hover:bg-gray-100 text-gray-700 border-gray-200/60'
                  }`}
                >
                  <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider opacity-80">
                    {DAYS_OF_WEEK[index].short}
                  </span>
                  <span
                    className={`text-sm sm:text-lg font-bold mt-0.5 ${
                      isSelected ? 'text-white' : isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}
                  >
                    {d.getDate()}
                  </span>

                  {/* Dots indicator for scheduled study */}
                  <div className="flex items-center gap-0.5 mt-1 h-1.5">
                    {countForDay > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-amber-400' : 'bg-blue-600'
                        }`}
                      />
                    )}
                    {countForDay > 1 && (
                      <span
                        className={`w-1 h-1 rounded-full ${
                          isSelected ? 'bg-blue-200' : 'bg-blue-300'
                        }`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: DIA (MANTÉM EXATAMENTE A VISUALIZAÇÃO ATUAL) */}
      {/* ========================================================================= */}
      {calendarView === 'day' && (
        <>
          {/* Selected Day View Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#142B4A] capitalize">
                {selectedDateObj.toLocaleDateString('pt-PT', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h2>
              <p className="text-xs text-gray-500">
                {daySchedules.length}{' '}
                {daySchedules.length === 1 ? 'programação agendada' : 'programações agendadas'}
              </p>
            </div>

            <button
              onClick={() => setIsTimerModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Estudo Livre</span>
            </button>
          </div>

          {/* Schedule Items List */}
          {daySchedules.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200/80 shadow-xs mt-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Nenhuma programação para este dia
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5 leading-relaxed">
                Adicione horários semanais para manter o ritmo de estudo, activar alarmes automáticos e sincronizar com o cronómetro.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setDefaultDayForCreate(selectedDayOfWeek);
                    setIsCreateScheduleOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Horário</span>
                </button>
                <button
                  onClick={() => setIsTimerModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Estudar Agora</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {daySchedules.map((schedule) => {
                const discipline = discMap.get(schedule.disciplineId);
                const occurrence = scheduleOccurrences.find(
                  (o) => o.scheduleId === schedule.id && o.date === selectedDate
                );
                const status = occurrence?.status || 'pending';

                return (
                  <div
                    key={schedule.id}
                    onClick={() => {
                      setActionModalDate(selectedDate);
                      setSelectedScheduleForAction(schedule);
                    }}
                    className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/80 hover:border-blue-300 hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden group"
                  >
                    {/* Left accent color strip */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-2"
                      style={{ backgroundColor: discipline?.color || '#2563EB' }}
                    />

                    <div className="pl-2 sm:pl-3 flex items-start sm:items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-xs font-bold text-sm"
                        style={{ backgroundColor: discipline?.color || '#2563EB' }}
                      >
                        {discipline?.name?.substring(0, 2).toUpperCase() || 'ST'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition">
                            {discipline?.name || 'Disciplina Desconhecida'}
                          </h4>
                          {discipline?.archived && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                              Arquivada
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1 font-mono font-medium text-gray-700">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {schedule.startTime} – {schedule.endTime}
                          </span>

                          {schedule.alarmEnabled ? (
                            <span
                              className="flex items-center gap-0.5 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                              title="Alarme ativado"
                            >
                              <Bell className="w-3 h-3" />
                              {schedule.alarmMinutesBefore && schedule.alarmMinutesBefore > 0
                                ? `-${schedule.alarmMinutesBefore}m`
                                : 'Alarme'}
                            </span>
                          ) : (
                            <span
                              className="flex items-center gap-0.5 text-gray-400 text-[10px]"
                              title="Sem alarme"
                            >
                              <BellOff className="w-3 h-3" />
                            </span>
                          )}

                          {schedule.repeatWeekly && (
                            <span
                              className="flex items-center gap-0.5 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                              title="Repetição semanal ativada"
                            >
                              <RotateCcw className="w-3 h-3" /> Semanal
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right occurrence status and quick action */}
                    <div className="pl-2 sm:pl-0 flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                      {status === 'studied' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Estudado
                        </span>
                      )}
                      {status === 'not_studied' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          Não Estudado
                        </span>
                      )}
                      {status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Pendente
                        </span>
                      )}

                      {/* Direct Launch Stopwatch button */}
                      {schedule.timerEnabled && discipline && !discipline.archived && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startTimer(discipline.id, schedule.id);
                          }}
                          className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition shadow-xs"
                          title="Iniciar cronómetro para este horário"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: SEMANA (AGENDA PROFISSIONAL ESTILO GOOGLE CALENDAR / OUTLOOK) */}
      {/* ========================================================================= */}
      {calendarView === 'week' && (() => {
        // Compute grid hour range based on actual schedules or standard 07:00 - 22:00
        const minScheduledHour = schedules.length > 0
          ? Math.min(...schedules.map((s) => Math.floor(timeToMinutes(s.startTime) / 60)))
          : 8;
        const maxScheduledHour = schedules.length > 0
          ? Math.max(...schedules.map((s) => Math.ceil(timeToMinutes(s.endTime) / 60)))
          : 21;

        const gridStartHour = Math.max(6, Math.min(7, minScheduledHour));
        const gridEndHour = Math.min(24, Math.max(22, maxScheduledHour));
        const hoursList: number[] = [];
        for (let h = gridStartHour; h <= gridEndHour; h++) {
          hoursList.push(h);
        }

        const HOUR_ROW_HEIGHT = 58; // px per hour
        const totalGridHeight = hoursList.length * HOUR_ROW_HEIGHT;

        // Current time line for today
        const now = new Date();
        const currentMinsFromStart = now.getHours() * 60 + now.getMinutes() - gridStartHour * 60;
        const currentTimeTop = (currentMinsFromStart / 60) * HOUR_ROW_HEIGHT;
        const isNowInGrid = currentTimeTop >= 0 && currentTimeTop <= totalGridHeight;

        return (
          <div className="space-y-3">
            {/* Week Header Info & Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#142B4A] flex items-center gap-2">
                  <span>Agenda Semanal</span>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {schedules.length} {schedules.length === 1 ? 'bloco' : 'blocos'}
                  </span>
                </h2>
                <p className="text-xs text-gray-500">
                  Visão estilo Outlook / Google Calendar com períodos livres e ocupados
                </p>
              </div>

              {/* Quick Discipline Color Legend */}
              <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
                {disciplines.filter(d => !d.archived).map((d) => (
                  <div key={d.id} className="flex items-center gap-1.5 flex-shrink-0 text-[11px] text-gray-600 bg-white px-2 py-1 rounded-md border border-gray-200">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="truncate max-w-[90px]">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scrollable Calendar Table Container */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
              <div className="overflow-x-auto select-none">
                <div className="min-w-[720px] md:min-w-full">
                  {/* Sticky 7-Day Header */}
                  <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-gray-200 bg-gray-50/90 sticky top-0 z-20 backdrop-blur-xs">
                    {/* Top Left Hour Header */}
                    <div className="py-2.5 px-1 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider border-r border-gray-200 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* 7 Columns Day Headers */}
                    {weekDays.map((d, index) => {
                      const dayNum = index + 1;
                      const dayInfo = DAYS_OF_WEEK[index];
                      const dateStr = toDateString(d);
                      const isToday = dateStr === todayStr;

                      return (
                        <div
                          key={dateStr}
                          onClick={() => {
                            setSelectedDate(dateStr);
                            setCalendarView('day');
                          }}
                          className={`py-2 px-1 text-center border-r last:border-r-0 border-gray-200 cursor-pointer hover:bg-blue-50/50 transition group ${
                            isToday ? 'bg-blue-50/80' : ''
                          }`}
                          title={`Ver detalhes de ${dayInfo.name}`}
                        >
                          <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 group-hover:text-blue-600">
                            {dayInfo.short}
                          </div>
                          <div className="mt-0.5 flex items-center justify-center">
                            <span
                              className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                                isToday
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-gray-900 group-hover:bg-gray-200'
                              }`}
                            >
                              {d.getDate()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Main Agenda Grid Body with Hours & Event Blocks */}
                  <div
                    className="grid grid-cols-[56px_repeat(7,1fr)] relative"
                    style={{ height: `${totalGridHeight}px` }}
                  >
                    {/* Column 0: Time Labels on Left */}
                    <div className="border-r border-gray-200 bg-gray-50/60 select-none">
                      {hoursList.map((hour) => (
                        <div
                          key={hour}
                          className="border-b border-gray-200/60 text-[11px] font-mono text-gray-400 text-right pr-2 pt-1 font-medium"
                          style={{ height: `${HOUR_ROW_HEIGHT}px` }}
                        >
                          {String(hour).padStart(2, '0')}:00
                        </div>
                      ))}
                    </div>

                    {/* 7 Day Columns with Blocks */}
                    {weekDays.map((d, index) => {
                      const dayNum = index + 1;
                      const dateStr = toDateString(d);
                      const isToday = dateStr === todayStr;

                      // Filter schedules for this day
                      const daySchedulesList = schedules.filter((s) => s.dayOfWeek === dayNum);

                      return (
                        <div
                          key={dateStr}
                          className={`relative border-r last:border-r-0 border-gray-200 ${
                            isToday ? 'bg-blue-50/20' : 'bg-white'
                          }`}
                        >
                          {/* Horizontal hour guide lines */}
                          {hoursList.map((hour) => (
                            <div
                              key={hour}
                              onClick={() => {
                                setDefaultDayForCreate(dayNum);
                                setIsCreateScheduleOpen(true);
                              }}
                              className="border-b border-gray-100 hover:bg-blue-50/30 transition cursor-pointer"
                              style={{ height: `${HOUR_ROW_HEIGHT}px` }}
                              title={`Clique para agendar às ${String(hour).padStart(2, '0')}:00`}
                            />
                          ))}

                          {/* Red Current Time Line if Today */}
                          {isToday && isNowInGrid && (
                            <div
                              className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
                              style={{ top: `${currentTimeTop}px` }}
                            >
                              <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shadow-xs" />
                              <div className="w-full border-t-2 border-red-500/80" />
                            </div>
                          )}

                          {/* Study Blocks positioned absolutely in the column */}
                          {daySchedulesList.map((schedule) => {
                            const discipline = discMap.get(schedule.disciplineId);
                            const startMins = timeToMinutes(schedule.startTime);
                            const endMins = timeToMinutes(schedule.endTime);
                            const durationMins = Math.max(20, endMins - startMins);

                            // Calculate top and height
                            const blockTop = ((startMins - gridStartHour * 60) / 60) * HOUR_ROW_HEIGHT;
                            const blockHeight = Math.max(26, (durationMins / 60) * HOUR_ROW_HEIGHT);

                            // Occurrence status for this date
                            const occurrence = scheduleOccurrences.find(
                              (o) => o.scheduleId === schedule.id && o.date === dateStr
                            );
                            const isStudied = occurrence?.status === 'studied';
                            const isNotStudied = occurrence?.status === 'not_studied';

                            const bgColor = discipline?.color || '#2563EB';

                            return (
                              <div
                                key={schedule.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionModalDate(dateStr);
                                  setSelectedScheduleForAction(schedule);
                                }}
                                style={{
                                  top: `${blockTop}px`,
                                  height: `${blockHeight - 3}px`,
                                  backgroundColor: bgColor,
                                }}
                                className="absolute left-1 right-1 rounded-lg px-2 py-1 text-white shadow-xs hover:shadow-md hover:brightness-105 active:scale-[0.98] transition cursor-pointer z-10 flex flex-col justify-between overflow-hidden border border-black/10 group"
                                title={`${discipline?.name || 'Estudo'}: ${schedule.startTime} - ${schedule.endTime}`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 leading-tight">
                                    <span className="text-[11px] font-bold truncate">
                                      {discipline?.name || 'Estudo'}
                                    </span>
                                    {schedule.alarmEnabled && (
                                      <Bell className="w-3 h-3 flex-shrink-0 opacity-80" />
                                    )}
                                  </div>

                                  <div className="text-[10px] font-mono opacity-90 leading-none mt-0.5 truncate">
                                    {schedule.startTime} – {schedule.endTime}
                                  </div>
                                </div>

                                {isStudied && (
                                  <div className="flex items-center gap-0.5 text-[9px] font-bold bg-black/20 px-1 py-0.5 rounded self-start mt-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Feito
                                  </div>
                                )}
                                {isNotStudied && (
                                  <div className="flex items-center gap-0.5 text-[9px] font-bold bg-black/20 px-1 py-0.5 rounded self-start mt-0.5">
                                    <XCircle className="w-2.5 h-2.5" /> Não feito
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 text-center sm:text-left px-1">
              * Dica: Toque num bloco para editar, marcar como estudado ou eliminar. Toque num horário livre para agendar.
            </p>
          </div>
        );
      })()}

      {/* Modal 1: Exactly Three Options on Schedule Click (Section 10) */}
      {selectedScheduleForAction && (
        <ScheduleActionModal
          schedule={selectedScheduleForAction}
          discipline={discMap.get(selectedScheduleForAction.disciplineId)}
          dateStr={actionModalDate}
          isOpen={!!selectedScheduleForAction}
          onClose={() => setSelectedScheduleForAction(null)}
          onEdit={(sched) => setScheduleToEdit(sched)}
          onMarkStudied={(sched, dStr) => {
            setActionModalDate(dStr);
            setScheduleToMarkStudied(sched);
          }}
          onDelete={(sched) => deleteSchedule(sched.id)}
        />
      )}

      {/* Modal 2: Mark as Studied (Section 12) */}
      <MarkStudiedModal
        schedule={scheduleToMarkStudied}
        dateStr={actionModalDate}
        isOpen={!!scheduleToMarkStudied}
        onClose={() => setScheduleToMarkStudied(null)}
      />

      {/* Modal 3: Create / Edit Schedule (Section 9 & 11) */}
      <ScheduleFormModal
        schedule={scheduleToEdit}
        defaultDayOfWeek={defaultDayForCreate}
        isOpen={isCreateScheduleOpen || !!scheduleToEdit}
        onClose={() => {
          setIsCreateScheduleOpen(false);
          setScheduleToEdit(null);
        }}
        onOpenCreateDiscipline={() => setIsCreateDisciplineOpen(true)}
      />

      {/* Modal 4: Create Discipline helper */}
      <DisciplineFormModal
        isOpen={isCreateDisciplineOpen}
        onClose={() => setIsCreateDisciplineOpen(false)}
      />
    </div>
  );
};
