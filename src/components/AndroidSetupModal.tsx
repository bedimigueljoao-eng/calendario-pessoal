import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useStudy } from '../context/StudyContext';
import { alarmService } from '../services/alarmService';
import {
  Bell,
  Download,
  CheckCircle2,
  Volume2,
  Smartphone,
  X,
  Sparkles,
  ShieldCheck,
  AlarmClock,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidSetupModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { disciplines, schedules } = useStudy();
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(() =>
    alarmService.getPermissionStatus()
  );
  const [soundTested, setSoundTested] = useState(false);

  useEffect(() => {
    setNotificationStatus(alarmService.getPermissionStatus());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestNotifications = async () => {
    const perm = await alarmService.requestNotificationPermission();
    setNotificationStatus(perm);
    // Also unlock audio context by playing a short preview chime
    alarmService.playAlarmChime();
    setSoundTested(true);
  };

  const handleTestSound = () => {
    alarmService.playAlarmChime();
    setSoundTested(true);
  };

  const handleTestContinuousAlarm = () => {
    const disc = disciplines[0] || {
      id: 'test_disc',
      name: 'Excel e Análise de Dados',
      color: '#0284c7',
      weeklyGoalMinutes: 120,
      createdAt: new Date().toISOString(),
      archived: false,
    };
    const sched = schedules[0] || {
      id: 'test_sched',
      disciplineId: disc.id,
      dayOfWeek: 1,
      startTime: '19:00',
      endTime: '20:30',
      alarmEnabled: true,
      alarmMinutesBefore: 0,
      alarmRepeat: true,
      timerEnabled: true,
      repeatWeekly: true,
      createdAt: new Date().toISOString(),
    };
    alarmService.startContinuousAlarm(sched, disc, false);
    onClose();
  };

  const handleFinish = () => {
    try {
      localStorage.setItem('studytrack_setup_done', 'true');
    } catch {
      // ignore
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Configuração StudyTrack
              </h3>
              <p className="text-xs text-gray-500">
                Ative alarmes e instale no seu Android
              </p>
            </div>
          </div>
          <button
            onClick={handleFinish}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="mt-4 space-y-3.5">
          {/* Step 1: Notifications & Alarm */}
          <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    1. Permissão de Alarmes e Notificações
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Permite tocar alertas sonoros e emitir lembretes no horário
                  </p>
                </div>
              </div>

              {notificationStatus === 'granted' ? (
                <span className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                </span>
              ) : (
                <span className="flex-shrink-0 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Pendente
                </span>
              )}
            </div>

            {notificationStatus !== 'granted' ? (
              <button
                type="button"
                onClick={handleRequestNotifications}
                className="w-full mt-2 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Ativar Notificações e Sons</span>
              </button>
            ) : (
              <p className="text-[11px] text-emerald-800 font-medium mt-1">
                ✓ Notificações autorizadas. Os alarmes e vibração funcionarão normalmente.
              </p>
            )}
          </div>

          {/* Step 2: Test Sound */}
          <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    2. Testar Toque do Alarme
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Verifique se o volume está audível no seu telemóvel
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95"
                  title="Tocar som de teste curto"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Chime</span>
                </button>
                <button
                  type="button"
                  onClick={handleTestContinuousAlarm}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95"
                  title="Abrir ecrã de despertador em ecrã completo com alarme contínuo"
                >
                  <AlarmClock className="w-3.5 h-3.5" />
                  <span>Ecrã Alarme</span>
                </button>
              </div>
            </div>
            {soundTested && (
              <p className="text-[11px] text-blue-700 font-medium mt-2">
                Som reproduzido! Também pode carregar em "Ecrã Alarme" para simular o despertador de ecrã inteiro.
              </p>
            )}
          </div>

          {/* Step 3: Install App */}
          <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    3. Instalar Aplicação no Android
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Abra em ecrã completo com ícone próprio e 100% offline
                  </p>
                </div>
              </div>

              {isInstalled && (
                <span className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Instalada
                </span>
              )}
            </div>

            {!isInstalled && isInstallable && (
              <button
                type="button"
                onClick={async () => {
                  await install();
                }}
                className="w-full mt-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar Agora no Android</span>
              </button>
            )}

            {!isInstalled && !isInstallable && !isIOS && (
              <div className="mt-2 p-2.5 bg-blue-50/80 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                Para instalar no Chrome do Android: toque nos <strong>três pontos (⋮)</strong> no canto superior direito e selecione <strong>"Instalar aplicação"</strong> ou <strong>"Adicionar ao ecrã principal"</strong>.
              </div>
            )}

            {isIOS && !isInstalled && (
              <div className="mt-2 p-2.5 bg-gray-100 rounded-xl text-[11px] text-gray-700 leading-relaxed">
                No Safari do iPhone/iPad: toque em <strong>Partilhar</strong> e selecione <strong>"Ecrã principal"</strong>.
              </div>
            )}
          </div>
        </div>

        {/* Done Button */}
        <div className="mt-6 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Dados guardados localmente
          </span>
          <button
            type="button"
            onClick={handleFinish}
            className="px-5 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#1f3f6b] text-white text-xs font-bold transition shadow-sm"
          >
            Começar a Usar
          </button>
        </div>
      </div>
    </div>
  );
};
