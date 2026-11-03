import React, { useState, useEffect } from 'react';
import { Schedule, Discipline } from '../types';
import { useStudy } from '../context/StudyContext';
import { DAYS_OF_WEEK, timeToMinutes, hasTimeOverlap } from '../utils/dateUtils';
import {
  X,
  Calendar,
  Clock,
  Bell,
  Timer,
  Repeat,
  AlertTriangle,
  Plus,
} from 'lucide-react';

interface Props {
  schedule?: Schedule | null;
  defaultDayOfWeek?: number;
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateDiscipline: () => void;
}

export const ScheduleFormModal: React.FC<Props> = ({
  schedule,
  defaultDayOfWeek = 1,
  isOpen,
  onClose,
  onOpenCreateDiscipline,
}) => {
  const { disciplines, schedules, addSchedule, updateSchedule } = useStudy();

  const [disciplineId, setDisciplineId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(defaultDayOfWeek);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [repeatWeekly, setRepeatWeekly] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeDisciplines = disciplines.filter((d) => !d.archived);

  useEffect(() => {
    if (schedule) {
      setDisciplineId(schedule.disciplineId);
      setDayOfWeek(schedule.dayOfWeek);
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
      setAlarmEnabled(schedule.alarmEnabled);
      setTimerEnabled(schedule.timerEnabled);
      setRepeatWeekly(schedule.repeatWeekly);
    } else {
      setDisciplineId(activeDisciplines[0]?.id || '');
      setDayOfWeek(defaultDayOfWeek);
      setStartTime('09:00');
      setEndTime('10:30');
      setAlarmEnabled(true);
      setTimerEnabled(true);
      setRepeatWeekly(true);
    }
    setErrorMsg(null);
    setOverlapWarning(null);
  }, [schedule, defaultDayOfWeek, isOpen]);

  // Check overlap whenever day or times change
  useEffect(() => {
    if (!isOpen) return;

    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);

    if (endMins <= startMins) {
      setOverlapWarning(null);
      return;
    }

    const conflicting = schedules.find((s) => {
      if (schedule && s.id === schedule.id) return false;
      if (s.dayOfWeek !== dayOfWeek) return false;
      return hasTimeOverlap(startTime, endTime, s.startTime, s.endTime);
    });

    if (conflicting) {
      const conflictDiscipline = disciplines.find(
        (d) => d.id === conflicting.disciplineId
      );
      setOverlapWarning(
        `Aviso: Sobreposição detectada com "${conflictDiscipline?.name || 'outra programação'}" (${conflicting.startTime} - ${conflicting.endTime}). Pode prosseguir se desejar.`
      );
    } else {
      setOverlapWarning(null);
    }
  }, [dayOfWeek, startTime, endTime, schedules, schedule, disciplines, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!disciplineId) {
      setErrorMsg('Por favor, selecione uma disciplina.');
      return;
    }

    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);

    if (endMins <= startMins) {
      setErrorMsg('A hora de término deve ser posterior à hora de início.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (schedule) {
        await updateSchedule(schedule.id, {
          disciplineId,
          dayOfWeek,
          startTime,
          endTime,
          alarmEnabled,
          timerEnabled,
          repeatWeekly,
        });
      } else {
        await addSchedule({
          disciplineId,
          dayOfWeek,
          startTime,
          endTime,
          alarmEnabled,
          timerEnabled,
          repeatWeekly,
        });
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {schedule ? 'Editar Programação' : 'Nova Programação de Estudo'}
            </h3>
            <p className="text-xs text-gray-500">
              {schedule
                ? 'Atualizar horários da programação semanal'
                : 'Defina os horários e alarmes para a semana'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeDisciplines.length === 0 ? (
          <div className="mt-4 p-4 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Não tem nenhuma disciplina ativa cadastrada. Crie uma disciplina antes de agendar horários.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateDiscipline();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
            >
              Criar Disciplina Agora
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
                {errorMsg}
              </div>
            )}

            {/* Overlap Warning */}
            {overlapWarning && (
              <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs border border-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{overlapWarning}</span>
              </div>
            )}

            {/* Disciplina */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Disciplina
              </label>
              <select
                value={disciplineId}
                onChange={(e) => setDisciplineId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                {activeDisciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dia da semana */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Dia da Semana
              </label>
              <div className="grid grid-cols-7 gap-1">
                {DAYS_OF_WEEK.map((d) => {
                  const isSelected = dayOfWeek === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDayOfWeek(d.id)}
                      className={`py-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition ${
                        isSelected
                          ? 'bg-[#142B4A] text-white shadow-sm'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <span>{d.letter}</span>
                      <span className="text-[9px] font-normal opacity-80">{d.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horas de início e término */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  Hora de Início
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  Hora de Término
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Configurações (Alarme, Cronómetro, Repetição) */}
            <div className="space-y-2.5 pt-1 border-t border-gray-100">
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="text-xs font-semibold text-gray-900 block">
                      Activar Alarme
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Tocar som e emitir notificação no início
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={alarmEnabled}
                  onChange={(e) => setAlarmEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Timer className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-semibold text-gray-900 block">
                      Activar Cronómetro
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Permitir iniciar contagem a partir deste horário
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={timerEnabled}
                  onChange={(e) => setTimerEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Repeat className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="text-xs font-semibold text-gray-900 block">
                      Repetição Semanal
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Repetir todas as semanas neste dia
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={repeatWeekly}
                  onChange={(e) => setRepeatWeekly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
              >
                {schedule ? 'Guardar Alterações' : 'Criar Programação'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
