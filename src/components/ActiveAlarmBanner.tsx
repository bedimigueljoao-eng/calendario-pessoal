import React from 'react';
import { useStudy } from '../context/StudyContext';
import { Bell, Play, X } from 'lucide-react';

export const ActiveAlarmBanner: React.FC = () => {
  const { activeAlarm, dismissActiveAlarm, startTimer } = useStudy();

  if (!activeAlarm) return null;

  const { schedule, discipline, isAdvanceAlert } = activeAlarm;

  const handleStartStudy = () => {
    startTimer(discipline.id, schedule.id);
    dismissActiveAlarm();
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-lg mx-auto animate-bounce-once">
      <div className="bg-[#142B4A] text-white p-4 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-400 text-[#142B4A] rounded-xl animate-pulse">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                {isAdvanceAlert ? 'Lembrete Antecipado' : 'Alarme de Estudo'}
              </span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                {schedule.startTime} - {schedule.endTime}
              </span>
            </div>
            <h4 className="text-base font-bold text-white mt-0.5">
              {isAdvanceAlert
                ? `Estudo de ${discipline.name} começa em breve!`
                : `Está na hora de estudar ${discipline.name}!`}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleStartStudy}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Iniciar</span>
          </button>
          <button
            onClick={dismissActiveAlarm}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
            title="Fechar alarme"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
