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

  const [calendarView, setCalendarView] =
    useState<CalendarViewMode>('day');

  const [
    selectedScheduleForAction,
    setSelectedScheduleForAction,
  ] = useState<Schedule | null>(null);

  const [actionModalDate, setActionModalDate] =
    useState<string>(selectedDate);

  const [
    scheduleToMarkStudied,
    setScheduleToMarkStudied,
  ] = useState<Schedule | null>(null);

  const [scheduleToEdit, setScheduleToEdit] =
    useState<Schedule | null>(null);

  const [
    isCreateScheduleOpen,
    setIsCreateScheduleOpen,
  ] = useState(false);

  const [
    defaultDayForCreate,
    setDefaultDayForCreate,
  ] = useState<number>(1);

  const [
    isCreateDisciplineOpen,
    setIsCreateDisciplineOpen,
  ] = useState(false);

  const weekDays = getDaysInWeek(currentWeekMonday);
  const todayStr = toDateString(new Date());

  const handlePrevWeek = () => {
    const previousWeek = new Date(currentWeekMonday);
    previousWeek.setDate(previousWeek.getDate() - 7);

    setCurrentWeekMonday(previousWeek);
    setSelectedDate(toDateString(previousWeek));
  };

  const handleNextWeek = () => {
    const nextWeek = new Date(currentWeekMonday);
    nextWeek.setDate(nextWeek.getDate() + 7);

    setCurrentWeekMonday(nextWeek);
    setSelectedDate(toDateString(nextWeek));
  };

  const handleReturnToCurrentWeek = () => {
    const currentMonday = getMondayOfWeek(new Date());

    setCurrentWeekMonday(currentMonday);
    setSelectedDate(todayStr);
  };

  const selectedDateObj = new Date(
    `${selectedDate}T12:00:00`
  );

  const jsDay = selectedDateObj.getDay();
  const selectedDayOfWeek = jsDay === 0 ? 7 : jsDay;

  const daySchedules = schedules
    .filter(
      (schedule) =>
        schedule.dayOfWeek === selectedDayOfWeek
    )
    .sort(
      (first, second) =>
        timeToMinutes(first.startTime) -
        timeToMinutes(second.startTime)
    );

  const discMap = new Map<string, Discipline>(
    disciplines.map((discipline) => [
      discipline.id,
      discipline,
    ])
  );

  const weekEndSunday = weekDays[6];

  const weekLabel = `${weekDays[0].toLocaleDateString(
    'pt-PT',
    {
      day: 'numeric',
      month: 'short',
    }
  )} – ${weekEndSunday.toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;

  const isCurrentWeek =
    toDateString(currentWeekMonday) ===
    toDateString(getMondayOfWeek(new Date()));

  const totalWeeklyMinutes = schedules.reduce(
    (total, schedule) => {
      const duration =
        timeToMinutes(schedule.endTime) -
        timeToMinutes(schedule.startTime);

      return total + Math.max(0, duration);
    },
    0
  );

  return (
    <div className="mx-auto max-w-5xl px-3 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-4 sm:pt-6">
      {/* Barra superior */}
      <div className="mb-4 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-col items-center justify-between gap-3 border-b border-gray-100 pb-3 sm:flex-row">
          {/* Selector DIA / SEMANA */}
          <div className="flex w-full items-center rounded-xl bg-gray-100 p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setCalendarView('day')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition sm:flex-none ${
                calendarView === 'day'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>DIA</span>
            </button>

            <button
              type="button"
              onClick={() => setCalendarView('week')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition sm:flex-none ${
                calendarView === 'week'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>SEMANA</span>
            </button>
          </div>

          {/* Nova programação */}
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setDefaultDayForCreate(
                  selectedDayOfWeek
                );
                setIsCreateScheduleOpen(true);
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Programação</span>
            </button>
          </div>
        </div>

        {/* Navegação semanal */}
        <div className="flex flex-col items-center justify-between gap-3 pt-3 sm:flex-row">
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
            <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="rounded-lg p-1.5 text-gray-600 transition hover:bg-white hover:text-gray-900"
                title="Semana anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={handleReturnToCurrentWeek}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  isCurrentWeek
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-white'
                }`}
                title="Voltar à semana actual"
              >
                Semana Actual
              </button>

              <button
                type="button"
                onClick={handleNextWeek}
                className="rounded-lg p-1.5 text-gray-600 transition hover:bg-white hover:text-gray-900"
                title="Semana seguinte"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs font-semibold capitalize text-[#142B4A] sm:ml-2 sm:text-sm">
              {weekLabel}
            </div>
          </div>

          {calendarView === 'week' && (
            <div className="text-xs font-medium text-gray-500">
              Total programado:{' '}
              <span className="font-mono font-bold text-blue-600">
                {formatDuration(totalWeeklyMinutes)}
              </span>
            </div>
          )}
        </div>

        {/* Selector dos sete dias na vista diária */}
        {calendarView === 'day' && (
          <div className="mt-4 grid grid-cols-7 gap-1 border-t border-gray-100 pt-3 sm:gap-2">
            {weekDays.map((day, index) => {
              const dateStr = toDateString(day);
              const isSelected =
                selectedDate === dateStr;
              const isToday = todayStr === dateStr;
              const dayOfWeekNumber = index + 1;

              const countForDay = schedules.filter(
                (schedule) =>
                  schedule.dayOfWeek ===
                  dayOfWeekNumber
              ).length;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() =>
                    setSelectedDate(dateStr)
                  }
                  className={`relative flex min-w-0 flex-col items-center justify-center rounded-xl border px-0.5 py-2 transition sm:px-2 sm:py-2.5 ${
                    isSelected
                      ? 'scale-[1.02] border-[#142B4A] bg-[#142B4A] text-white shadow-md'
                      : isToday
                        ? 'border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100/70'
                        : 'border-gray-200/60 bg-gray-50/70 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="block w-full truncate text-center text-[8px] font-semibold uppercase tracking-tight opacity-80 sm:text-xs">
                    {DAYS_OF_WEEK[index].short}
                  </span>

                  <span
                    className={`mt-0.5 text-sm font-bold sm:text-lg ${
                      isSelected
                        ? 'text-white'
                        : isToday
                          ? 'text-blue-600'
                          : 'text-gray-900'
                    }`}
                  >
                    {day.getDate()}
                  </span>

                  <div className="mt-1 flex h-1.5 items-center gap-0.5">
                    {countForDay > 0 && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isSelected
                            ? 'bg-amber-400'
                            : 'bg-blue-600'
                        }`}
                      />
                    )}

                    {countForDay > 1 && (
                      <span
                        className={`h-1 w-1 rounded-full ${
                          isSelected
                            ? 'bg-blue-200'
                            : 'bg-blue-300'
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

      {/* Vista diária */}
      {calendarView === 'day' && (
        <>
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="min-w-0 pr-2">
              <h2 className="truncate text-base font-bold capitalize text-[#142B4A] sm:text-lg">
                {selectedDateObj.toLocaleDateString(
                  'pt-PT',
                  {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  }
                )}
              </h2>

              <p className="text-xs text-gray-500">
                {daySchedules.length}{' '}
                {daySchedules.length === 1
                  ? 'programação agendada'
                  : 'programações agendadas'}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setIsTimerModalOpen(true)
              }
              className="inline-flex flex-shrink-0 items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Estudo Livre</span>
            </button>
          </div>

          {daySchedules.length === 0 ? (
            <div className="mt-2 rounded-2xl border border-gray-200/80 bg-white p-8 text-center shadow-xs">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <CalendarIcon className="h-6 w-6" />
              </div>

              <h3 className="mb-1 text-base font-bold text-gray-900">
                Nenhuma programação para este dia
              </h3>

              <p className="mx-auto mb-5 max-w-sm text-xs leading-relaxed text-gray-500">
                Adicione horários semanais para manter
                o ritmo de estudo, activar alarmes
                automáticos e sincronizar com o
                cronómetro.
              </p>

              <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setDefaultDayForCreate(
                      selectedDayOfWeek
                    );
                    setIsCreateScheduleOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar Horário</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setIsTimerModalOpen(true)
                  }
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-200 sm:w-auto"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Estudar Agora</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {daySchedules.map((schedule) => {
                const discipline = discMap.get(
                  schedule.disciplineId
                );

                const occurrence =
                  scheduleOccurrences.find(
                    (item) =>
                      item.scheduleId ===
                        schedule.id &&
                      item.date === selectedDate
                  );

                const status =
                  occurrence?.status || 'pending';

                return (
                  <div
                    key={schedule.id}
                    onClick={() => {
                      setActionModalDate(selectedDate);
                      setSelectedScheduleForAction(
                        schedule
                      );
                    }}
                    className="group relative flex cursor-pointer flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs transition hover:border-blue-300 hover:shadow-md sm:flex-row sm:items-center"
                  >
                    <div
                      className="absolute inset-y-0 left-0 w-2"
                      style={{
                        backgroundColor:
                          discipline?.color ||
                          '#2563EB',
                      }}
                    />

                    <div className="flex items-start gap-3 pl-2 sm:items-center sm:pl-3">
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-xs"
                        style={{
                          backgroundColor:
                            discipline?.color ||
                            '#2563EB',
                        }}
                      >
                        {discipline?.name
                          ?.substring(0, 2)
                          .toUpperCase() || 'ST'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="truncate text-sm font-bold text-gray-900 transition group-hover:text-blue-600">
                            {discipline?.name ||
                              'Disciplina Desconhecida'}
                          </h4>

                          {discipline?.archived && (
                            <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                              Arquivada
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 sm:gap-3">
                          <span className="flex items-center gap-1 font-mono font-medium text-gray-700">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {schedule.startTime} –{' '}
                            {schedule.endTime}
                          </span>

                          {schedule.alarmEnabled ? (
                            <span
                              className="flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600"
                              title="Alarme activado"
                            >
                              <Bell className="h-3 w-3" />

                              {schedule.alarmMinutesBefore &&
                              schedule.alarmMinutesBefore >
                                0
                                ? `-${schedule.alarmMinutesBefore}m`
                                : 'Alarme'}
                            </span>
                          ) : (
                            <span
                              className="flex items-center gap-0.5 text-[10px] text-gray-400"
                              title="Sem alarme"
                            >
                              <BellOff className="h-3 w-3" />
                            </span>
                          )}

                          {schedule.repeatWeekly && (
                            <span
                              className="flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600"
                              title="Repetição semanal activada"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Semanal
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2 pl-2 sm:justify-end sm:border-t-0 sm:pt-0 sm:pl-0">
                      {status === 'studied' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Estudado
                        </span>
                      )}

                      {status === 'not_studied' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                          <XCircle className="h-3.5 w-3.5 text-red-600" />
                          Não Estudado
                        </span>
                      )}

                      {status === 'pending' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          Pendente
                        </span>
                      )}

                      {schedule.timerEnabled &&
                        discipline &&
                        !discipline.archived && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();

                              startTimer(
                                discipline.id,
                                schedule.id
                              );
                            }}
                            className="rounded-xl bg-blue-50 p-2 text-blue-600 shadow-xs transition hover:bg-blue-600 hover:text-white"
                            title="Iniciar cronómetro para este horário"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
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

      {/* Vista semanal compacta */}
      {calendarView === 'week' && (
        <div className="space-y-3">
          <div className="flex flex-col justify-between gap-2 px-1 sm:flex-row sm:items-center">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-[#142B4A] sm:text-lg">
                <span>Agenda Semanal</span>

                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 sm:text-xs">
                  {schedules.length}{' '}
                  {schedules.length === 1
                    ? 'bloco'
                    : 'blocos'}
                </span>
              </h2>

              <p className="text-xs text-gray-500">
                Todos os dias visíveis na mesma vista
              </p>
            </div>

            <div className="text-xs font-medium text-gray-500">
              Total programado:{' '}
              <span className="font-mono font-bold text-blue-600">
                {formatDuration(totalWeeklyMinutes)}
              </span>
            </div>
          </div>

          <div className="w-full overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs">
            <div className="grid w-full grid-cols-7">
              {weekDays.map((day, index) => {
                const dayNumber = index + 1;
                const dateStr = toDateString(day);
                const isToday =
                  dateStr === todayStr;

                const schedulesForDay = schedules
                  .filter(
                    (schedule) =>
                      schedule.dayOfWeek ===
                      dayNumber
                  )
                  .sort(
                    (first, second) =>
                      timeToMinutes(
                        first.startTime
                      ) -
                      timeToMinutes(
                        second.startTime
                      )
                  );

                return (
                  <div
                    key={dateStr}
                    className={`min-w-0 border-r border-gray-200 last:border-r-0 ${
                      isToday
                        ? 'bg-blue-50/40'
                        : 'bg-white'
                    }`}
                  >
                    {/* Cabeçalho do dia */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setCalendarView('day');
                      }}
                      className={`w-full min-w-0 border-b border-gray-200 px-0.5 py-2 text-center transition ${
                        isToday
                          ? 'bg-blue-100/70'
                          : 'bg-gray-50 hover:bg-blue-50'
                      }`}
                      title={`Abrir ${DAYS_OF_WEEK[index].name}`}
                    >
                      <span
                        className={`block w-full truncate text-[8px] font-extrabold uppercase leading-none tracking-tight sm:text-[11px] ${
                          isToday
                            ? 'text-blue-700'
                            : 'text-gray-600'
                        }`}
                      >
                        {DAYS_OF_WEEK[index].short}
                      </span>

                      <span
                        className={`mx-auto mt-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold sm:text-xs ${
                          isToday
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-900'
                        }`}
                      >
                        {day.getDate()}
                      </span>
                    </button>

                    {/* Programações do dia */}
                    <div className="min-h-[260px] space-y-1 p-0.5 sm:min-h-[320px] sm:p-1">
                      {schedulesForDay.length ===
                      0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setDefaultDayForCreate(
                              dayNumber
                            );
                            setSelectedDate(dateStr);
                            setIsCreateScheduleOpen(
                              true
                            );
                          }}
                          className="flex min-h-[44px] w-full items-center justify-center rounded-md border border-dashed border-gray-200 transition hover:border-blue-300 hover:bg-blue-50/40"
                          title={`Adicionar programação para ${DAYS_OF_WEEK[index].name}`}
                        >
                          <Plus className="h-3 w-3 text-gray-300" />
                        </button>
                      ) : (
                        schedulesForDay.map(
                          (schedule) => {
                            const discipline =
                              discMap.get(
                                schedule.disciplineId
                              );

                            const occurrence =
                              scheduleOccurrences.find(
                                (item) =>
                                  item.scheduleId ===
                                    schedule.id &&
                                  item.date === dateStr
                              );

                            const isStudied =
                              occurrence?.status ===
                              'studied';

                            const isNotStudied =
                              occurrence?.status ===
                              'not_studied';

                            return (
                              <button
                                key={schedule.id}
                                type="button"
                                onClick={() => {
                                  setActionModalDate(
                                    dateStr
                                  );

                                  setSelectedScheduleForAction(
                                    schedule
                                  );
                                }}
                                style={{
                                  backgroundColor:
                                    discipline?.color ||
                                    '#2563EB',
                                }}
                                className="w-full min-w-0 overflow-hidden rounded-md border border-black/10 px-1 py-1.5 text-left text-white shadow-xs transition hover:brightness-105 active:scale-[0.98]"
                                title={`${
                                  discipline?.name ||
                                  'Estudo'
                                }: ${
                                  schedule.startTime
                                } - ${
                                  schedule.endTime
                                }`}
                              >
                                <div className="flex items-start justify-between gap-0.5">
                                  <span className="line-clamp-2 min-w-0 break-words text-[8px] font-bold leading-tight sm:text-[10px]">
                                    {discipline?.name ||
                                      'Estudo'}
                                  </span>

                                  {schedule.alarmEnabled && (
                                    <Bell className="hidden h-2.5 w-2.5 flex-shrink-0 opacity-80 min-block" />
                                  )}
                                </div>

                                <span className="mt-1 block truncate font-mono text-[7px] leading-none opacity-90 min-text-[8px] sm:text-[9px]">
                                  {schedule.startTime}
                                </span>

                                {isStudied && (
                                  <span className="mt-1 flex items-center gap-0.5 text-[7px] font-bold sm:text-[8px]">
                                    <CheckCircle2 className="h-2 w-2 flex-shrink-0" />
                                    <span className="truncate">
                                      Feito
                                    </span>
                                  </span>
                                )}

                                {isNotStudied && (
                                  <span className="mt-1 flex items-center gap-0.5 text-[7px] font-bold sm:text-[8px]">
                                    <XCircle className="h-2 w-2 flex-shrink-0" />
                                    <span className="truncate">
                                      Não feito
                                    </span>
                                  </span>
                                )}
                              </button>
                            );
                          }
                        )
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setDefaultDayForCreate(
                            dayNumber
                          );
                          setSelectedDate(dateStr);
                          setIsCreateScheduleOpen(
                            true
                          );
                        }}
                        className="flex h-6 w-full items-center justify-center rounded-md text-gray-300 transition hover:bg-blue-50 hover:text-blue-600"
                        title={`Adicionar programação para ${DAYS_OF_WEEK[index].name}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="px-1 text-center text-[10px] text-gray-400 sm:text-[11px]">
            Toque numa programação para editar,
            marcar como estudada ou eliminar.
          </p>
        </div>
      )}

      {/* Modal de acções da programação */}
      {selectedScheduleForAction && (
        <ScheduleActionModal
          schedule={selectedScheduleForAction}
          discipline={discMap.get(
            selectedScheduleForAction.disciplineId
          )}
          dateStr={actionModalDate}
          isOpen={!!selectedScheduleForAction}
          onClose={() =>
            setSelectedScheduleForAction(null)
          }
          onEdit={(schedule) =>
            setScheduleToEdit(schedule)
          }
          onMarkStudied={(schedule, dateStr) => {
            setActionModalDate(dateStr);
            setScheduleToMarkStudied(schedule);
          }}
          onDelete={(schedule) =>
            deleteSchedule(schedule.id)
          }
        />
      )}

      {/* Modal para marcar como estudado */}
      <MarkStudiedModal
        schedule={scheduleToMarkStudied}
        dateStr={actionModalDate}
        isOpen={!!scheduleToMarkStudied}
        onClose={() =>
          setScheduleToMarkStudied(null)
        }
      />

      {/* Modal de criação e edição de programação */}
      <ScheduleFormModal
        schedule={scheduleToEdit}
        defaultDayOfWeek={defaultDayForCreate}
        isOpen={
          isCreateScheduleOpen ||
          !!scheduleToEdit
        }
        onClose={() => {
          setIsCreateScheduleOpen(false);
          setScheduleToEdit(null);
        }}
        onOpenCreateDiscipline={() =>
          setIsCreateDisciplineOpen(true)
        }
      />

      {/* Modal de criação de disciplina */}
      <DisciplineFormModal
        isOpen={isCreateDisciplineOpen}
        onClose={() =>
          setIsCreateDisciplineOpen(false)
        }
      />
    </div>
  );
};
