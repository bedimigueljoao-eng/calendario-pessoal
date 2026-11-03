import React, { useState, useEffect } from 'react';
import { useStudy } from '../context/StudyContext';
import { timeToMinutes, formatDuration } from '../utils/dateUtils';
import {
  Bell,
  Play,
  Clock,
  XCircle,
  Volume2,
  Calendar,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Check,
} from 'lucide-react';

const COMMON_SKIP_REASONS = [
  'Imprevisto pessoal ou familiar',
  'Cansaço / Falta de energia',
  'Trabalho / Tarefa urgente',
  'Adiantado noutra matéria',
  'Falta de material de estudo',
];

export const FullscreenAlarmModal: React.FC = () => {
  const {
    activeAlarm,
    handleAlarmStudy,
    handleAlarmSnooze,
    handleAlarmSkip,
  } = useStudy();

  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [viewState, setViewState] = useState<'main' | 'snooze' | 'skip'>('main');
  const [selectedSnoozeMinutes, setSelectedSnoozeMinutes] = useState<number>(10);
  const [skipReason, setSkipReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Live real-time clock inside fullscreen alarm
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('pt-PT', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset internal state whenever active alarm changes
  useEffect(() => {
    if (activeAlarm) {
      setViewState('main');
      setSkipReason('');
      setSelectedSnoozeMinutes(10);
      setIsSubmitting(false);
    }
  }, [activeAlarm]);

  if (!activeAlarm) return null;

  const { schedule, discipline, isAdvanceAlert, isSnoozed } = activeAlarm;

  // Duration in minutes
  const startMins = timeToMinutes(schedule.startTime);
  const endMins = timeToMinutes(schedule.endTime);
  const durationMins = Math.max(1, endMins - startMins);

  const onConfirmStudy = async () => {
    setIsSubmitting(true);
    try {
      await handleAlarmStudy();
    } finally {
      setIsSubmitting(false);
    }
  };

  const onConfirmSnooze = (minutes: number) => {
    setIsSubmitting(true);
    handleAlarmSnooze(minutes);
  };

  const onConfirmSkip = async () => {
    setIsSubmitting(true);
    try {
      await handleAlarmSkip(skipReason);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Despertador de Estudo"
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-gradient-to-b from-[#091322] via-[#0F1E36] to-[#080E1A] text-white p-4 sm:p-8 overflow-y-auto select-none"
    >
      {/* Background ambient pulse effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div
          className="w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ backgroundColor: discipline.color || '#3b82f6' }}
        />
      </div>

      {/* Top Header: Clock & Alarm Status */}
      <div className="relative z-10 w-full max-w-lg mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-semibold tracking-wider uppercase text-rose-300">
            {isSnoozed ? 'Lembrete Adiado' : isAdvanceAlert ? 'Lembrete Prévio' : 'Despertador Ativo'}
          </span>
        </div>

        <div className="font-mono text-sm tracking-wider font-semibold text-gray-300 bg-black/40 px-3 py-1 rounded-full border border-white/5">
          {currentTimeStr || '00:00:00'}
        </div>
      </div>

      {/* Center Body: State Dependent Views */}
      <div className="relative z-10 w-full max-w-md mx-auto my-auto py-6 flex flex-col items-center text-center">
        {viewState === 'main' && (
          <div className="w-full flex flex-col items-center">
            {/* Ringing Bell Icon with concentric shockwaves */}
            <div className="relative mb-6">
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-25"
                style={{ backgroundColor: discipline.color || '#3b82f6' }}
              />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center shadow-2xl">
                <Bell className="w-12 h-12 text-amber-400 animate-bounce" />
              </div>
            </div>

            {/* Discipline Tag */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border"
              style={{
                backgroundColor: `${discipline.color}25`,
                color: discipline.color,
                borderColor: `${discipline.color}50`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: discipline.color }}
              />
              {discipline.name}
            </div>

            {/* Title / Main Message */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 mb-2">
              {isSnoozed
                ? `Hora de estudar ${discipline.name}!`
                : isAdvanceAlert
                ? `Estudo de ${discipline.name} em breve`
                : `Hora da sessão de ${discipline.name}!`}
            </h1>

            {/* Schedule time and duration badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2 mb-6">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs sm:text-sm font-mono text-white">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {schedule.startTime} – {schedule.endTime}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs sm:text-sm text-gray-200">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Duração: <strong>{formatDuration(durationMins)}</strong></span>
              </div>
            </div>

            {/* Audio continuous ringing indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              <span>O alarme soa e vibra continuamente até responder</span>
            </div>
          </div>
        )}

        {/* View State: SNOOZE OPTIONS */}
        {viewState === 'snooze' && (
          <div className="w-full bg-white/5 backdrop-blur-md border border-white/15 rounded-3xl p-5 sm:p-6 text-left">
            <button
              onClick={() => setViewState('main')}
              className="inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-white mb-4 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao despertador</span>
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Adiar Alarme</h3>
            <p className="text-xs text-gray-300 mb-5">
              Escolha quantos minutos deseja adiar. O alarme voltará a tocar continuamente no fim do período:
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[5, 10, 15, 30].map((mins) => {
                const isSelected = selectedSnoozeMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedSnoozeMinutes(mins)}
                    className={`py-3.5 px-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500 text-[#0E1B2E] border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                        : 'bg-white/10 text-white border-white/10 hover:bg-white/15 font-semibold'
                    }`}
                  >
                    <span className="text-xl font-black">{mins}</span>
                    <span className="text-[11px] uppercase tracking-wider">minutos</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onConfirmSnooze(selectedSnoozeMinutes)}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-[#0E1B2E] font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar adiamento por {selectedSnoozeMinutes} min</span>
            </button>
          </div>
        )}

        {/* View State: SKIP OPTIONS */}
        {viewState === 'skip' && (
          <div className="w-full bg-white/5 backdrop-blur-md border border-white/15 rounded-3xl p-5 sm:p-6 text-left">
            <button
              onClick={() => setViewState('main')}
              className="inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-white mb-4 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao despertador</span>
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Não Estudar Hoje</h3>
            <p className="text-xs text-gray-300 mb-4">
              A sessão será registada no histórico como não realizada. Selecione ou indique o motivo (opcional):
            </p>

            {/* Quick reason chips */}
            <div className="space-y-2 mb-4">
              {COMMON_SKIP_REASONS.map((reason) => {
                const isSelected = skipReason === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSkipReason(isSelected ? '' : reason)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-rose-500/20 border-rose-400 text-rose-200 font-semibold'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{reason}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-rose-300" />}
                  </button>
                );
              })}
            </div>

            {/* Custom reason input */}
            <div className="mb-5">
              <input
                type="text"
                placeholder="Ou digite outro motivo..."
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-400 text-xs focus:outline-hidden focus:border-rose-400"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onConfirmSkip}
                className="flex-1 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition shadow-lg flex items-center justify-center gap-2 active:scale-98"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirmar (Não Estudar)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewState('main')}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Area: 3 Required Actions (Estudar, Adiar, Não estudar) */}
      {viewState === 'main' && (
        <div className="relative z-10 w-full max-w-md mx-auto space-y-3 pb-3">
          {/* Action 1: Estudar */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirmStudy}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-lg transition shadow-xl shadow-emerald-950/50 flex items-center justify-between active:scale-98 border border-emerald-400/30 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <div className="text-left">
                <div className="leading-tight">Estudar Agora</div>
                <div className="text-[11px] font-normal text-emerald-100">
                  Abre cronómetro e começa a contar
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition" />
          </button>

          {/* Action 2 & 3: Adiar e Não estudar */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setViewState('snooze')}
              className="py-3.5 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 active:scale-98"
            >
              <Clock className="w-4 h-4" />
              <span>Adiar...</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setViewState('skip')}
              className="py-3.5 px-4 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 active:scale-98"
            >
              <XCircle className="w-4 h-4" />
              <span>Não estudar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
