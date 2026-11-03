import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useStudy } from '../context/StudyContext';
import { alarmService } from '../services/alarmService';
import { nativeAlarmBridge } from '../services/nativeAlarmBridge';
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
  BatteryCharging,
  Settings,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidSetupModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { disciplines, schedules } = useStudy();

  const [isNative, setIsNative] = useState(false);
  const [nativePerms, setNativePerms] = useState({
    exactAlarmGranted: true,
    notificationsGranted: false,
    batteryOptimizationIgnored: false,
  });

  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(() =>
    alarmService.getPermissionStatus()
  );
  const [soundTested, setSoundTested] = useState(false);

  const checkAllPermissions = async () => {
    const isNat = nativeAlarmBridge.isNative();
    setIsNative(isNat);
    if (isNat) {
      const perms = await nativeAlarmBridge.checkPermissions();
      setNativePerms({
        exactAlarmGranted: perms.exactAlarmGranted,
        notificationsGranted: perms.notificationsGranted,
        batteryOptimizationIgnored: perms.batteryOptimizationIgnored,
      });
    } else {
      setNotificationStatus(alarmService.getPermissionStatus());
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkAllPermissions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestNotifications = async () => {
    const perm = await alarmService.requestNotificationPermission();
    setNotificationStatus(perm);
    alarmService.playAlarmChime();
    setSoundTested(true);
    await checkAllPermissions();
  };

  const handleRequestExactAlarm = async () => {
    await nativeAlarmBridge.requestExactAlarmPermission();
    setTimeout(checkAllPermissions, 1500);
  };

  const handleRequestBatteryExemption = async () => {
    await nativeAlarmBridge.requestBatteryOptimizationExemption();
    setTimeout(checkAllPermissions, 1500);
  };

  const handleTestSound = () => {
    if (isNative) {
      nativeAlarmBridge.testTriggerAlarm('Excel e Análise de Dados');
    } else {
      alarmService.playAlarmChime();
    }
    setSoundTested(true);
  };

  const handleTestContinuousAlarm = () => {
    if (isNative) {
      nativeAlarmBridge.testTriggerAlarm('Excel e Análise de Dados');
      onClose();
      return;
    }

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
            <div className="w-9 h-9 rounded-2xl bg-[#142B4A] text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {isNative ? 'Configuração Android Nativa' : 'Configuração StudyTrack'}
              </h3>
              <p className="text-xs text-gray-500">
                {isNative
                  ? 'Alarmes exatos em Kotlin e modo despertador'
                  : 'Alarmes com ecrã desligado e instalação no telemóvel'}
              </p>
            </div>
          </div>
          <button
            onClick={handleFinish}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="mt-3 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-blue-900 font-medium">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>Modo atual: <strong>{isNative ? 'Aplicação Nativa Android' : 'Web / PWA'}</strong></span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
            {isNative ? 'Kotlin Native' : 'PWA + APK'}
          </span>
        </div>

        {/* Steps */}
        <div className="mt-4 space-y-3">
          {/* If running inside native Android App */}
          {isNative ? (
            <>
              {/* Native Permission 1: Exact Alarms */}
              <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                      <AlarmClock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">
                        1. Alarmes Exatos (AlarmManager)
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Permite tocar no segundo exato mesmo com telemóvel bloqueado
                      </p>
                    </div>
                  </div>

                  {nativePerms.exactAlarmGranted ? (
                    <span className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestExactAlarm}
                      className="flex-shrink-0 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 px-2.5 py-1 rounded-xl shadow-xs"
                    >
                      Autorizar
                    </button>
                  )}
                </div>
              </div>

              {/* Native Permission 2: Battery Optimization */}
              <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                      <BatteryCharging className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">
                        2. Desativar Otimização de Bateria
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Impede o Android (modo Doze) de silenciar o alarme
                      </p>
                    </div>
                  </div>

                  {nativePerms.batteryOptimizationIgnored ? (
                    <span className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Otimizado
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestBatteryExemption}
                      className="flex-shrink-0 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-xl shadow-xs"
                    >
                      Configurar
                    </button>
                  )}
                </div>
              </div>

              {/* Native Permission 3: Notifications & Fullscreen */}
              <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">
                        3. Notificações e Ecrã Bloqueado
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Permite acender o ecrã com botões Estudar/Adiar/Não Estudar
                      </p>
                    </div>
                  </div>

                  {nativePerms.notificationsGranted ? (
                    <span className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestNotifications}
                      className="flex-shrink-0 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-xl shadow-xs"
                    >
                      Autorizar
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Web / PWA Mode: Notifications */}
              <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">
                        1. Permissão de Sons e Notificações
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Ativa toques contínuos e vibração no navegador
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

                {notificationStatus !== 'granted' && (
                  <button
                    type="button"
                    onClick={handleRequestNotifications}
                    className="w-full mt-2 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Ativar Notificações e Toques</span>
                  </button>
                )}
              </div>

              {/* Install PWA or Download Native APK */}
              <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">
                        2. Instalar no Android
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Duas opções disponíveis para o seu telemóvel
                      </p>
                    </div>
                  </div>

                  {isInstalled && (
                    <span className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> PWA Ativa
                    </span>
                  )}
                </div>

                {/* Option A: Native Android APK */}
                <div className="mt-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                  <p className="font-bold flex items-center gap-1 text-emerald-950">
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    Aplicação Nativa Android (APK)
                  </p>
                  <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                    Para o despertador tocar com ecrã desligado e app fechada, utilize a versão APK nativa gerada pelo GitHub Actions (veja o separador <em>Actions &gt; Build Android APK</em>).
                  </p>
                </div>

                {/* Option B: PWA Instant Install */}
                {!isInstalled && isInstallable && (
                  <button
                    type="button"
                    onClick={async () => {
                      await install();
                    }}
                    className="w-full mt-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Instalar Versão Web (PWA)</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Test Sound / Alarm Trigger */}
          <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    Testar Disparo do Alarme
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Experimente o toque contínuo e a interface do alarme
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95"
                  title="Testar toque"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Toque</span>
                </button>
                <button
                  type="button"
                  onClick={handleTestContinuousAlarm}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95"
                  title="Abrir tela de alarme com opções"
                >
                  <AlarmClock className="w-3.5 h-3.5" />
                  <span>Ecrã Alarme</span>
                </button>
              </div>
            </div>
            {soundTested && (
              <p className="text-[11px] text-blue-700 font-medium mt-2">
                Disparo testado! O som continuará a tocar repetidamente até selecionar Estudar, Adiar ou Não Estudar.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            100% dos dados guardados localmente
          </span>
          <button
            type="button"
            onClick={handleFinish}
            className="px-5 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#1f3f6b] text-white text-xs font-bold transition shadow-sm"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
