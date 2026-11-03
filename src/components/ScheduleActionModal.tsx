import React, { useState } from 'react';
import { Schedule, Discipline } from '../types';
import { Edit3, CheckCircle2, Trash2, X, AlertTriangle } from 'lucide-react';
import { getDayName } from '../utils/dateUtils';

interface Props {
  schedule: Schedule;
  discipline?: Discipline;
  dateStr: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (schedule: Schedule) => void;
  onMarkStudied: (schedule: Schedule, dateStr: string) => void;
  onDelete: (schedule: Schedule) => void;
}

export const ScheduleActionModal: React.FC<Props> = ({
  schedule,
  discipline,
  dateStr,
  isOpen,
  onClose,
  onEdit,
  onMarkStudied,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: discipline?.color || '#2563EB' }}
              />
              <h3 className="text-base font-bold text-gray-900 truncate">
                {discipline?.name || 'Programação'}
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {getDayName(schedule.dayOfWeek)}, {schedule.startTime} - {schedule.endTime}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delete confirmation view */}
        {showDeleteConfirm ? (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">
                  Tem a certeza de que deseja eliminar esta programação?
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Apenas a programação será eliminada. O alarme será cancelado, mas a disciplina e todo o histórico de estudos serão preservados.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(schedule);
                  setShowDeleteConfirm(false);
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition shadow-sm"
              >
                Sim, Eliminar
              </button>
            </div>
          </div>
        ) : (
          /* EXACTLY THREE OPTIONS as required by Section 10 */
          <div className="mt-4 space-y-2">
            {/* Opção 1: Editar */}
            <button
              onClick={() => {
                onEdit(schedule);
                onClose();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">
                    1. Editar
                  </span>
                  <span className="text-xs text-gray-500">
                    Alterar horários, disciplina ou repetição
                  </span>
                </div>
              </div>
            </button>

            {/* Opção 2: Marcar como estudado */}
            <button
              onClick={() => {
                onMarkStudied(schedule, dateStr);
                onClose();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">
                    2. Marcar como estudado
                  </span>
                  <span className="text-xs text-gray-500">
                    Registar o tempo efectivamente estudado
                  </span>
                </div>
              </div>
            </button>

            {/* Opção 3: Eliminar programação */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50/50 text-left transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-red-600 block">
                    3. Eliminar programação
                  </span>
                  <span className="text-xs text-gray-500">
                    Remover esta programação semanal
                  </span>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
