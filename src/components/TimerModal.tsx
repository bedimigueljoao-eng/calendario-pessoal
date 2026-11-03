import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { formatMilliseconds } from '../utils/dateUtils';
import {
  X,
  Play,
  Pause,
  Square,
  CheckCircle2,
  Trash2,
  Timer,
  FileText,
  Sparkles,
} from 'lucide-react';

export const TimerModal: React.FC = () => {
  const {
    timerState,
    currentElapsedMs,
    disciplines,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    isTimerModalOpen,
    setIsTimerModalOpen,
  } = useStudy();

  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isTimerModalOpen) return null;

  const activeDisciplines = disciplines.filter((d) => !d.archived);
  const activeDiscipline = timerState
    ? disciplines.find((d) => d.id === timerState.disciplineId)
    : activeDisciplines.find((d) => d.id === selectedDisciplineId) || activeDisciplines[0];

  const handleStartFreeStudy = () => {
    const discId = selectedDisciplineId || activeDisciplines[0]?.id;
    if (!discId) return;
    startTimer(discId, null);
  };

  const handleFinishClick = () => {
    if (timerState?.status === 'running') {
      pauseTimer();
    }
    setShowSummary(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      await stopTimer(true, sessionNotes);
      setShowSummary(false);
      setSessionNotes('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = async () => {
    await stopTimer(false);
    setShowSummary(false);
    setSessionNotes('');
  };

  const formattedTime = formatMilliseconds(currentElapsedMs, true);
  const totalMinutes = Math.max(0, Math.round(currentElapsedMs / 60000));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Cronómetro de Estudo
              </h3>
              <p className="text-xs text-gray-500">
                {timerState ? (timerState.scheduleId ? 'Sessão Programada' : 'Estudo Livre') : 'Iniciar Nova Sessão'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowSummary(false);
              setIsTimerModalOpen(false);
            }}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If in summary confirmation mode */}
        {showSummary ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-center">
              <Sparkles className="w-7 h-7 text-blue-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-gray-900">
                Resumo da Sessão de Estudo
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {activeDiscipline?.name}
              </p>
              <div className="text-3xl font-mono font-bold text-[#142B4A] my-2">
                {formattedTime}
              </div>
              <p className="text-xs font-semibold text-blue-700">
                {totalMinutes > 0 ? `${totalMinutes} minuto(s) contabilizados no dashboard` : 'Sessão com menos de 30s'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                Anotações sobre a sessão (opcional)
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Ex.: Resumo dos artigos, tópicos estudados..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleDiscard}
                className="py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Descartar</span>
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmSave}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Sessão</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active / Idle Timer Display */
          <div className="mt-5 space-y-6">
            {/* Discipline Selector if not running */}
            {!timerState ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Selecione a Disciplina para Estudo Livre
                </label>
                {activeDisciplines.length === 0 ? (
                  <p className="text-xs text-amber-600">
                    Cadastre uma disciplina primeiro para iniciar o cronómetro.
                  </p>
                ) : (
                  <select
                    value={selectedDisciplineId || activeDisciplines[0]?.id}
                    onChange={(e) => setSelectedDisciplineId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {activeDisciplines.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <span
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: activeDiscipline?.color || '#2563EB' }}
                />
                <span className="text-sm font-bold text-gray-900">
                  {activeDiscipline?.name || 'Disciplina'}
                </span>
                <span className="text-xs text-gray-500 ml-1">
                  ({timerState.scheduleId ? 'Programado' : 'Estudo Livre'})
                </span>
              </div>
            )}

            {/* Stopwatch Display Dial */}
            <div className="relative flex flex-col items-center justify-center py-6 bg-gradient-to-b from-[#142B4A] to-[#1E3A8A] rounded-3xl shadow-inner text-white">
              <div className="text-xs uppercase tracking-widest text-blue-200 font-semibold mb-2">
                {timerState?.status === 'running'
                  ? '• A Gravar Tempo •'
                  : timerState?.status === 'paused'
                  ? 'Pausado'
                  : 'Pronto para Estudar'}
              </div>

              <div className="text-4xl sm:text-5xl font-mono font-bold tracking-tight py-2">
                {formattedTime}
              </div>

              <div className="text-xs text-blue-200/80 mt-1 font-medium">
                {formatMilliseconds(currentElapsedMs, false)} (HH:MM)
              </div>
            </div>

            {/* Control Buttons */}
            <div>
              {!timerState ? (
                <button
                  type="button"
                  disabled={activeDisciplines.length === 0}
                  onClick={handleStartFreeStudy}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-base transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Iniciar Estudo</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  {timerState.status === 'running' ? (
                    <button
                      type="button"
                      onClick={pauseTimer}
                      className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pausar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resumeTimer}
                      className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Continuar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleFinishClick}
                    className="flex-1 py-3.5 rounded-2xl bg-[#142B4A] hover:bg-[#1a385f] active:scale-95 text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Finalizar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
