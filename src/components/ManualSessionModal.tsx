import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { X, Clock, Calendar, BookOpen, FileText, CheckCircle2 } from 'lucide-react';
import { toDateString } from '../utils/dateUtils';

export const ManualSessionModal: React.FC = () => {
  const {
    disciplines,
    addManualSession,
    isManualModalOpen,
    setIsManualModalOpen,
  } = useStudy();

  const activeDisciplines = disciplines.filter((d) => !d.archived);

  const [disciplineId, setDisciplineId] = useState('');
  const [date, setDate] = useState(() => toDateString(new Date()));
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isManualModalOpen) return null;

  const currentDisciplineId = disciplineId || activeDisciplines[0]?.id || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentDisciplineId) {
      setErrorMsg('Por favor, selecione uma disciplina.');
      return;
    }

    const totalMinutes = Number(hours) * 60 + Number(minutes);
    if (totalMinutes <= 0) {
      setErrorMsg('A duração de estudo deve ser superior a 0 minutos.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addManualSession(
        currentDisciplineId,
        date,
        Number(hours),
        Number(minutes),
        notes
      );
      setIsManualModalOpen(false);
      setHours(1);
      setMinutes(0);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Registo Manual de Estudo
              </h3>
              <p className="text-xs text-gray-500">
                Adicione tempo de estudo realizado sem cronómetro
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsManualModalOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeDisciplines.length === 0 ? (
          <div className="mt-4 p-4 text-center">
            <p className="text-xs text-amber-700 mb-3">
              Não tem disciplinas ativas. Crie uma disciplina antes de registar sessões.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
                {errorMsg}
              </div>
            )}

            {/* Disciplina */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                Disciplina
              </label>
              <select
                value={currentDisciplineId}
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

            {/* Data */}
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Horas e Minutos */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                Duração Estudada
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
            </div>

            {/* Observações */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                Observação (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: Leitura e elaboração de apontamentos..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Sessão</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
