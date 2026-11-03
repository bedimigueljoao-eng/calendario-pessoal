import React from 'react';
import { X, Bell, AlertTriangle, Cpu, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAlarmNoticeModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Alarmes e Notificações no Android</h3>
              <p className="text-xs text-gray-500">Comportamento da PWA vs Versão Nativa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-gray-600">
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-blue-700 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Como funciona nesta versão PWA
            </h4>
            <p className="text-xs leading-relaxed text-blue-800">
              O StudyTrack reproduz alarmes sonoros suaves (chime sintetizado via Web Audio) e emite notificações do sistema quando a aba está aberta ou ativa em segundo plano no navegador.
            </p>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-amber-700 flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Limitação técnica do ecossistema Android PWA
            </h4>
            <p className="text-xs leading-relaxed text-amber-800">
              O sistema operativo Android suspende temporizadores de navegadores quando o telemóvel está bloqueado ou a poupar bateria. Por isso, navegadores web não conseguem garantir toques com precisão de segundo se o ecrã estiver desligado há muito tempo.
            </p>
          </div>

          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-700 flex items-center gap-1.5 mb-1">
              <Cpu className="w-4 h-4 text-gray-600" />
              Arquitetura preparada para Android Nativo (Kotlin)
            </h4>
            <p className="text-xs leading-relaxed text-gray-600 mb-2">
              A arquitetura de dados (IndexedDB/Room) e modelos (Discipline, Schedule, StudySession) foi desenhada para espelhar uma app Android nativa.
            </p>
            <ul className="text-xs space-y-1 list-disc list-inside text-gray-600">
              <li>Uso do <strong>AlarmManager.setExactAndAllowWhileIdle()</strong></li>
              <li>Permissão <strong>SCHEDULE_EXACT_ALARM</strong></li>
              <li>BroadcastReceiver para <strong>BOOT_COMPLETED</strong> (reagendar após reiniciar)</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#1e3a61] text-white font-medium text-sm transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
