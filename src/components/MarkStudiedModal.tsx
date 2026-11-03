import React, { useState, useEffect } from 'react';
import { Schedule, Discipline } from '../types';
import { useStudy } from '../context/StudyContext';
import { X, CheckCircle2, XCircle, Clock, FileText, Calendar } from 'lucide-react';
import { timeToMinutes } from '../utils/dateUtils';

interface Props {
  schedule: Schedule | null;
  dateStr: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MarkStudiedModal: React.FC<Props> = ({
  schedule,
  dateStr,
  isOpen,
  onClose,
}) => {
  const {
    disciplines,
    markOccurrenceAsStudied,
    markOccurrenceAsNotStudied,
    scheduleOccurrences,
  } = useStudy();

  const [date, setDate] = useState(dateStr);
  const [hours, setHours] = useState<number>(1);
  const [minutes, setMinutes] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const discipline = schedule
    ? disciplines.find((d) => d.id === schedule.disciplineId)
    : null;

  // Pre-fill suggested duration from scheduled difference as a starting reference (editable)
  useEffect(() => {
    if (schedule) {
      setDate(dateStr);
      const scheduledMins = Math.max(
        0,
        timeToMinutes(schedule.endTime) - timeToMinutes(schedule.startTime)
      );
      if (scheduledMins > 0) {
        setHours(Math.floor(scheduledMins / 60));
        setMinutes(scheduledMins % 60);
      } else {
        setHours(1);
        setMinutes(0);
      }
      setNotes('');
    }
  }, [schedule, dateStr]);

  if (!isOpen || !schedule) return null;

  const currentOccurrence = scheduleOccurrences.find(
    (o) => o.scheduleId === schedule.id && o.date === dateStr
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalMins = Number(hours) * 60 + Number(minutes);
    if (totalMins <= 0) {
      alert('Por favor, introduza um tempo estudado superior a 0 minutos.');
      return;
    }

    setIsSubmitting(true);
    try {
      await markOccurrenceAsStudied(
        schedule.id,
        date,
        Number(hours),
        Number(minutes),
        notes
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsNotStudied = async () => {
    setIsSubmitting(true);
    try {
      await markOccurrenceAsNotStudied(schedule.id, dateStr);
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
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Marcar como Estudado
              </h3>
              <p className="text-xs text-gray-500">
                Registo de tempo efectivamente estudado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status tag */}
        {currentOccurrence && (
          <div className="mt-3 text-xs flex items-center gap-2">
            <span className="text-gray-500">Estado atual:</span>
            {currentOccurrence.status === 'studied' && (
              <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md">
                Estudado
              </span>
            )}
            {currentOccurrence.status === 'not_studied' && (
              <span className="bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-md">
                Não Estudado
              </span>
            )}
            {currentOccurrence.status === 'pending' && (
              <span className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-md">
                Pendente
              </span>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Disciplina */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Disciplina
            </label>
            <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span
                className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: discipline?.color || '#2563EB' }}
              />
              <span className="text-sm font-semibold text-gray-900">
                {discipline?.name || 'Disciplina'}
              </span>
              <span className="ml-auto text-xs text-gray-400 font-mono">
                Previsto: {schedule.startTime} - {schedule.endTime}
              </span>
            </div>
          </div>

          {/* Data da Sessão */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Data da Sessão
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          {/* Tempo Efectivamente Estudado */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              Tempo Efectivamente Estudado
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-gray-500 mb-1 block">Horas</span>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <span className="text-[11px] text-gray-500 mb-1 block">Minutos</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) =>
                    setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              * Introduza o tempo real dedicado, não necessariamente o tempo programado.
            </p>
          </div>

          {/* Observação opcional */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              Observação (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Resolução de exercícios do capítulo 3, resumo..."
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Sessão Estudada</span>
            </button>

            {/* Alternativa: Marcar como Não Estudado */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleMarkAsNotStudied}
              className="w-full py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-medium text-xs transition flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Marcar como Não Estudado (Sem tempo)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
