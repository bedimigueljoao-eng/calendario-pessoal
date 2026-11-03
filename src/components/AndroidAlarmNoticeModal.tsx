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
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Novo Sistema de Alarme Contínuo Implementado
            </h4>
            <p className="text-xs leading-relaxed text-emerald-900 mb-2">
              O alarme agora toca e vibra em loop contínuo sem parar sozinho. Apresenta um ecrã completo de despertador com 3 ações obrigatórias:
            </p>
            <ul className="text-xs space-y-1 list-disc list-inside text-emerald-800">
              <li><strong>Estudar Agora:</strong> Interrompe o som e inicia o cronómetro da disciplina.</li>
              <li><strong>Adiar:</strong> Pausa o som e permite escolher 5, 10, 15 ou 30 minutos de snooze.</li>
              <li><strong>Não estudar:</strong> Interrompe o som, permite indicar o motivo e arquiva no histórico.</li>
            </ul>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-amber-700 flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Comportamento com o telemóvel bloqueado (PWA vs APK Nativa)
            </h4>
            <p className="text-xs leading-relaxed text-amber-800 mb-2">
              Na versão PWA, a API <em>Screen Wake Lock</em> mantém o ecrã aceso enquanto o alarme toca. Se o telemóvel estiver aberto ou em segundo plano recente, as notificações e sons são acionados.
            </p>
            <p className="text-xs leading-relaxed text-amber-800">
              No entanto, o Android activa o <strong>Doze Mode</strong> quando o telemóvel fica bloqueado por muito tempo sem uso, suspendendo temporizadores web do Chrome.
            </p>
          </div>

          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-700 flex items-center gap-1.5 mb-1">
              <Cpu className="w-4 h-4 text-gray-600" />
              Garantia Absoluta a 100%: APK Nativo Android (Kotlin / TWA)
            </h4>
            <p className="text-xs leading-relaxed text-gray-600 mb-2">
              Para despertar o telemóvel mesmo com o ecrã desligado há horas e app totalmente encerrada pelo sistema, é necessária uma APK com:
            </p>
            <ul className="text-xs space-y-1 list-disc list-inside text-gray-600">
              <li><code>AlarmManager.setExactAndAllowWhileIdle()</code></li>
              <li>Permissões <code>SCHEDULE_EXACT_ALARM</code> e <code>USE_FULL_SCREEN_INTENT</code></li>
              <li>BroadcastReceiver para <code>BOOT_COMPLETED</code> para reagendar ao ligar o telemóvel</li>
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
