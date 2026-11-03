import React from 'react';
import { useStudy } from '../context/StudyContext';
import { CheckCircle2, Info, AlertCircle } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useStudy();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />,
  };

  return (
    <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300">
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#142B4A]/95 text-white text-xs sm:text-sm font-medium shadow-xl backdrop-blur-md border border-white/10 max-w-sm sm:max-w-md">
        {icons[toast.type]}
        <span>{toast.message}</span>
      </div>
    </div>
  );
};
