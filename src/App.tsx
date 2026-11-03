import React from 'react';
import { StudyProvider, useStudy } from './context/StudyContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { CalendarPage } from './pages/CalendarPage';
import { DisciplinesPage } from './pages/DisciplinesPage';
import { DashboardPage } from './pages/DashboardPage';
import { TimerModal } from './components/TimerModal';
import { ManualSessionModal } from './components/ManualSessionModal';
import { AndroidAlarmNoticeModal } from './components/AndroidAlarmNoticeModal';
import { ActiveAlarmBanner } from './components/ActiveAlarmBanner';
import { Toast } from './components/Toast';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { WifiOff, Loader2 } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    activeTab,
    isLoading,
    isAndroidNoticeOpen,
    setIsAndroidNoticeOpen,
  } = useStudy();
  const isOnline = useOnlineStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F5F8]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-gray-600">A carregar o StudyTrack...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F5F8]">
      {/* Top Header */}
      <Header />

      {/* Alarm popup banner if any alarm triggered */}
      <ActiveAlarmBanner />

      {/* Main Pages */}
      <main className="flex-1 w-full max-w-6xl mx-auto">
        {activeTab === 'calendar' && <CalendarPage />}
        {activeTab === 'disciplines' && <DisciplinesPage />}
        {activeTab === 'dashboard' && <DashboardPage />}
      </main>

      {/* Global Modals */}
      <TimerModal />
      <ManualSessionModal />
      <AndroidAlarmNoticeModal
        isOpen={isAndroidNoticeOpen}
        onClose={() => setIsAndroidNoticeOpen(false)}
      />

      {/* Toast Notifications */}
      <Toast />

      {/* Bottom Navigation */}
      <Navigation />

      {/* Offline banner at the bottom left */}
      {!isOnline && (
        <div className="fixed bottom-16 sm:bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-amber-600 text-white px-3.5 py-1.5 text-xs font-semibold shadow-lg">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>Modo Offline — Todos os dados continuam guardados localmente.</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <StudyProvider>
      <MainContent />
    </StudyProvider>
  );
}
