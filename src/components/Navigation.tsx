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

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'calendar',
      label: 'Calendário',
      icon: <CalendarDays className="w-5 h-5" />,
    },
    {
      id: 'disciplines',
      label: 'Disciplinas',
      icon: <GraduationCap className="w-5 h-5" />,
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* Mobile Floating Timer indicator if active */}
      {timerState && timerState.status !== 'stopped' && (
        <div className="sm:hidden fixed bottom-18 left-4 right-4 z-40">
          <button
            onClick={() => setIsTimerModalOpen(true)}
            className={`w-full py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-between text-xs font-bold transition ${
              timerState.status === 'running'
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-amber-600 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              <span>Cronómetro Ativo ({timerState.status === 'running' ? 'A contar' : 'Pausado'})</span>
            </div>
            <span className="font-mono text-sm tracking-wider">
              {formatMilliseconds(currentElapsedMs)}
            </span>
          </button>
        </div>
      )}

      {/* Main Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200/80 shadow-lg px-2 py-1 safe-area-pb">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? 'text-blue-600 font-bold scale-105'
                    : 'text-gray-500 hover:text-gray-800 font-medium'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {tab.icon}
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight">
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
