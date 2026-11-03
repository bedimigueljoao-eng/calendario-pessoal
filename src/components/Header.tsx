import React from 'react';
import { useStudy } from '../context/StudyContext';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { formatMilliseconds } from '../utils/dateUtils';
import {
  Bell,
  BellOff,
  Info,
  Timer,
  PlusCircle,
  WifiOff,
  BookOpen,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    timerState,
    currentElapsedMs,
    setIsTimerModalOpen,
    setIsManualModalOpen,
    setIsAndroidNoticeOpen,
    isAndroidSetupOpen,
    setIsAndroidSetupOpen,
    notificationPermission,
    requestNotificationAccess,
    disciplines,
  } = useStudy();

  const isOnline = useOnlineStatus();

  // Current formatted date in Portuguese
  const todayFormatted = new Date().toLocaleDateString('pt-PT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const activeTimerDiscipline = timerState
    ? disciplines.find(d => d.id === timerState.disciplineId)
    : null;

  return (
    <header className="sticky top-0 z-40 bg-[#142B4A] text-white border-b border-blue-950/40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/50">
            <BookOpen className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                StudyTrack
              </h1>
              {!isOnline && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                  <WifiOff className="w-2.5 h-2.5" /> Offline
                </span>
              )}
            </div>
            <p className="text-[11px] text-blue-200 capitalize mt-0.5 font-medium">
              {todayFormatted}
            </p>
          </div>
        </div>

        {/* Live Timer Pill if active */}
        {timerState && timerState.status !== 'stopped' && (
          <button
            onClick={() => setIsTimerModalOpen(true)}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-inner transition ${
              timerState.status === 'running'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span className="truncate max-w-[100px]">
              {activeTimerDiscipline?.name || 'Estudo'}
            </span>
            <span className="font-mono font-bold">
              {formatMilliseconds(currentElapsedMs)}
            </span>
          </button>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Manual Log */}
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 text-white transition"
            title="Registar sessão manualmente sem cronómetro"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Registar Tempo</span>
          </button>

          {/* Android Alarm info modal */}
          <button
            onClick={() => setIsAndroidNoticeOpen(true)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-blue-200 hover:text-white transition"
            title="Informação sobre alarmes e funcionamento em segundo plano"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Notification / Alarm setup */}
          <button
            onClick={() => setIsAndroidSetupOpen(true)}
            className={`p-2 rounded-lg transition ${
              notificationPermission === 'granted'
                ? 'text-emerald-400 hover:bg-white/10'
                : 'text-amber-300 hover:bg-amber-400/20'
            }`}
            title={
              notificationPermission === 'granted'
                ? 'Notificações ativadas — Toque para configurar'
                : 'Ativar notificações de alarme e instalar'
            }
          >
            {notificationPermission === 'granted' ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
