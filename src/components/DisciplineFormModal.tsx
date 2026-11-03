import React, { useState, useEffect } from 'react';
import { Discipline } from '../types';
import { useStudy } from '../context/StudyContext';
import { X, Palette, Target, BookOpen } from 'lucide-react';

interface Props {
  discipline?: Discipline | null;
  isOpen: boolean;
  onClose: () => void;
}

const PALETTE = [
  '#2563EB', // Blue
  '#142B4A', // Navy
  '#16A34A', // Green
  '#F59E0B', // Amber
  '#DC2626', // Red
  '#4F46E5', // Indigo
  '#9333EA', // Purple
  '#0D9488', // Teal
];

export const DisciplineFormModal: React.FC<Props> = ({
  discipline,
  isOpen,
  onClose,
}) => {
  const { addDiscipline, updateDiscipline } = useStudy();

  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [goalHours, setGoalHours] = useState(5);
  const [goalMinutes, setGoalMinutes] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (discipline) {
      setName(discipline.name);
      setColor(discipline.color);
      setGoalHours(Math.floor(discipline.weeklyGoalMinutes / 60));
      setGoalMinutes(discipline.weeklyGoalMinutes % 60);
    } else {
      setName('');
      setColor(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
      setGoalHours(5);
      setGoalMinutes(0);
    }
    setErrorMsg(null);
  }, [discipline, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Por favor, introduza o nome da disciplina.');
      return;
    }

    const totalGoal = Math.max(0, goalHours * 60 + goalMinutes);

    setIsSubmitting(true);
    try {
      if (discipline) {
        await updateDiscipline(discipline.id, {
          name: trimmedName,
          color,
          weeklyGoalMinutes: totalGoal,
        });
      } else {
        await addDiscipline({
          name: trimmedName,
          color,
          weeklyGoalMinutes: totalGoal,
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
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {discipline ? 'Editar Disciplina' : 'Adicionar Nova Disciplina'}
            </h3>
            <p className="text-xs text-gray-500">
              Defina a cor e meta semanal de estudo
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-gray-400" />
              Nome da Disciplina
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Gestão Financeira, Estatística, Direito..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          {/* Cor de Identificação */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-gray-400" />
              Cor de Identificação
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {PALETTE.map((c) => {
                const isSelected = color.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform flex items-center justify-center ${
                      isSelected ? 'ring-2 ring-offset-2 ring-gray-900 scale-110 shadow-sm' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {isSelected && <span className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meta Semanal */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-gray-400" />
              Meta Semanal de Estudo
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-gray-500 mb-1 block">Horas</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={goalHours}
                  onChange={(e) => setGoalHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <span className="text-[11px] text-gray-500 mb-1 block">Minutos</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={goalMinutes}
                  onChange={(e) =>
                    setGoalMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              Total: {goalHours * 60 + goalMinutes} minutos por semana
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
            >
              {discipline ? 'Guardar Alterações' : 'Criar Disciplina'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
