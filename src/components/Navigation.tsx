import React from 'react';
import { useStudy } from '../context/StudyContext';
import { ActiveTab } from '../types';
import {
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Timer,
} from 'lucide-react';
import { formatMilliseconds } from '../utils/dateUtils';

export const Navigation: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    timerState,
    currentElapsedMs,
    setIsTimerModalOpen,
  } = useStudy();

  const tabs: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'calendar',
      label: 'Calendário',
      icon: <CalendarDays className="h-5 w-5" />,
    },
    {
      id: 'disciplines',
      label: 'Disciplinas',
      icon: <GraduationCap className="h-5 w-5" />,
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
  ];

  const handleTabChange = (tabId: ActiveTab) => {
    setActiveTab(tabId);
  };

  return (
    <>
      {/* Indicador móvel do cronómetro activo */}
      {timerState &&
        timerState.status !== 'stopped' && (
          <div className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-4 right-4 z-40 sm:hidden">
            <button
              type="button"
              onClick={() =>
                setIsTimerModalOpen(true)
              }
              className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-lg transition ${
                timerState.status === 'running'
                  ? 'animate-pulse bg-emerald-600'
                  : 'bg-amber-600'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Timer className="h-4 w-4 flex-shrink-0" />

                <span className="truncate">
                  Cronómetro Activo (
                  {timerState.status === 'running'
                    ? 'A contar'
                    : 'Pausado'}
                  )
                </span>
              </div>

              <span className="ml-2 flex-shrink-0 font-mono text-sm tracking-wider">
                {formatMilliseconds(
                  currentElapsedMs
                )}
              </span>
            </button>
          </div>
        )}

      {/* Barra principal de navegação inferior */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border
