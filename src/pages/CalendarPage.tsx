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
  Eye,
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
      {/* Top Bar with View Mode Switcher and Navigation */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/80 mb-4">
        {/* Row 1: View Switcher [ DIA ] [ SEMANA ] & Action Button */}
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

        {/* 7 Days of the Week Selector Cards (Always useful for Day View navigation, and indicates schedules count) */}
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
                              <Bell className="w-3 h-3" /> Alarme
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
      {/* VISTA 2: SEMANA (NOVA - VISÃO GERAL DE TODOS OS ESTUDOS DA SEMANA) */}
      {/* ========================================================================= */}
      {calendarView === 'week' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#142B4A]">
                Visão Geral da Semana
              </h2>
              <p className="text-xs text-gray-500">
                Todos os estudos programados de Segunda a Domingo num único ecrã
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

          {/* 7 Days List / Grid */}
          <div className="space-y-3">
            {weekDays.map((d, index) => {
              const dayNum = index + 1; // 1 = Seg, 2 = Ter, etc.
              const dayInfo = DAYS_OF_WEEK[index];
              const dateStr = toDateString(d);
              const isToday = dateStr === todayStr;

              // Filter schedules for this specific day of week, sorted by start time
              const dayItems = schedules
                .filter((s) => s.dayOfWeek === dayNum)
                .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

              return (
                <div
                  key={dateStr}
                  className={`bg-white rounded-2xl p-4 shadow-xs border transition ${
                    isToday
                      ? 'border-blue-400 ring-2 ring-blue-500/10'
                      : 'border-gray-200/80 hover:border-gray-300'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#142B4A]">
                        {dayInfo.name}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        {d.getDate()}{' '}
                        {d.toLocaleDateString('pt-PT', { month: 'short' })}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          Hoje
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Button to jump to Day view for this day */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setCalendarView('day');
                        }}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-lg transition flex items-center gap-1"
                        title="Ver no detalhe do dia"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver Dia</span>
                      </button>

                      {/* Quick Add Schedule on this day */}
                      <button
                        type="button"
                        onClick={() => {
                          setDefaultDayForCreate(dayNum);
                          setIsCreateScheduleOpen(true);
                        }}
                        className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition"
                        title={`Adicionar programação para ${dayInfo.name}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Schedules on this day */}
                  {dayItems.length === 0 ? (
                    <div className="py-2.5 text-xs text-gray-400 flex items-center justify-between">
                      <span className="italic">Sem estudos programados</span>
                      <button
                        type="button"
                        onClick={() => {
                          setDefaultDayForCreate(dayNum);
                          setIsCreateScheduleOpen(true);
                        }}
                        className="text-[11px] text-gray-500 hover:text-blue-600 font-medium"
                      >
                        + Agendar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayItems.map((schedule) => {
                        const discipline = discMap.get(schedule.disciplineId);
                        const occurrence = scheduleOccurrences.find(
                          (o) => o.scheduleId === schedule.id && o.date === dateStr
                        );
                        const status = occurrence?.status || 'pending';

                        return (
                          <div
                            key={schedule.id}
                            onClick={() => {
                              setActionModalDate(dateStr);
                              setSelectedScheduleForAction(schedule);
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-blue-50/60 border border-gray-100 hover:border-blue-200 transition cursor-pointer group"
                          >
                            {/* Left: Time and Discipline Name (Example format: 08:00 - Excel) */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: discipline?.color || '#2563EB' }}
                              />
                              <span className="text-xs font-mono font-bold text-gray-800">
                                {schedule.startTime}
                              </span>
                              <span className="text-xs text-gray-400 font-mono">–</span>
                              <span className="text-xs font-bold text-gray-900 group-hover:text-blue-600 truncate">
                                {discipline?.name || 'Disciplina'}
                              </span>

                              {schedule.alarmEnabled && (
                                <span title="Alarme ativado" className="text-amber-500 flex-shrink-0">
                                  <Bell className="w-3 h-3" />
                                </span>
                              )}
                            </div>

                            {/* Right: Occurrence Status & Quick Start */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {status === 'studied' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Estudado
                                </span>
                              )}
                              {status === 'not_studied' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                                  <XCircle className="w-3 h-3" />
                                  Não Estudado
                                </span>
                              )}

                              {/* Quick Play Timer */}
                              {schedule.timerEnabled && discipline && !discipline.archived && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startTimer(discipline.id, schedule.id);
                                  }}
                                  className="p-1 rounded-lg text-blue-600 hover:bg-blue-100 transition"
                                  title="Iniciar cronómetro"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
