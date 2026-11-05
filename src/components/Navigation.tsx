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

  return (
    <>
      {timerState &&
        timerState.status !== 'stopped' && (
          <div
            className="fixed left-4 right-4 z-40 sm:hidden"
            style={{
              bottom:
                'calc(5.75rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
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
                {formatMilliseconds(currentElapsedMs)}
              </span>
            </button>
          </div>
        )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-2 pt-1 shadow-lg"
        style={{
          paddingBottom:
            'max(18px, env(safe-area-inset-bottom, 0px))',
        }}
        aria-label="Navegação principal"
      >
        <div className="mx-auto flex max-w-md items-center justify-around">
          {tabs.map((tab) => {
            const isActive =
              activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={`flex min-h-[58px] flex-1 flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all ${
                  isActive
                    ? 'scale-[1.03] font-bold text-blue-600'
                    : 'font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
                aria-current={
                  isActive ? 'page' : undefined
                }
                aria-label={tab.label}
              >
                <div
                  className={`rounded-xl p-1.5 transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  {tab.icon}
                </div>

                <span className="mt-0.5 text-[11px] leading-tight tracking-tight">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
