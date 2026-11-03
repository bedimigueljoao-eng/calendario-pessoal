import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { Discipline } from '../types';
import {
  Plus,
  Target,
  Clock,
  BookOpen,
  Archive,
  ArchiveRestore,
  Edit3,
  Trash2,
  CalendarCheck,
  Play,
  AlertTriangle,
} from 'lucide-react';
import { formatDuration, getDaysInWeek, toDateString } from '../utils/dateUtils';
import { DisciplineFormModal } from '../components/DisciplineFormModal';

export const DisciplinesPage: React.FC = () => {
  const {
    disciplines,
    studySessions,
    schedules,
    currentWeekMonday,
    archiveDiscipline,
    deleteDiscipline,
    startTimer,
  } = useStudy();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);
  const [disciplineToDelete, setDisciplineToDelete] = useState<Discipline | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [detailDiscipline, setDetailDiscipline] = useState<Discipline | null>(null);

  // Compute dates in current week
  const weekDays = getDaysInWeek(currentWeekMonday);
  const weekDateStrings = new Set(weekDays.map(toDateString));

  // Compute metrics per discipline
  const activeDisciplines = disciplines.filter((d) => !d.archived);
  const archivedDisciplines = disciplines.filter((d) => d.archived);

  const displayedDisciplines = showArchived ? archivedDisciplines : activeDisciplines;

  const getDisciplineStats = (discId: string, weeklyGoalMinutes: number) => {
    const discSessions = studySessions.filter((s) => s.disciplineId === discId);
    const sessionsCount = discSessions.length;

    // Time studied this current week
    const thisWeekMinutes = discSessions
      .filter((s) => weekDateStrings.has(s.date))
      .reduce((acc, s) => acc + s.durationMinutes, 0);

    const percent =
      weeklyGoalMinutes > 0
        ? Math.min(100, Math.round((thisWeekMinutes / weeklyGoalMinutes) * 100))
        : 0;

    // Total lifetime minutes
    const totalMinutes = discSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

    // Active schedules count
    const schedCount = schedules.filter((s) => s.disciplineId === discId).length;

    return {
      sessionsCount,
      thisWeekMinutes,
      percent,
      totalMinutes,
      schedCount,
    };
  };

  return (
    <div className="pb-28 max-w-5xl mx-auto px-4 pt-4 sm:pt-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A]">Minhas Disciplinas</h2>
          <p className="text-xs text-gray-500">
            Organize disciplinas, defina metas semanais e acompanhe o progresso
          </p>
        </div>

        <div className="flex items-center gap-2">
          {archivedDisciplines.length > 0 && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                showArchived
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {showArchived
                ? 'Ver Disciplinas Ativas'
                : `Arquivadas (${archivedDisciplines.length})`}
            </button>
          )}

          <button
            onClick={() => {
              setEditingDiscipline(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Disciplina</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {displayedDisciplines.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {showArchived
              ? 'Nenhuma disciplina arquivada'
              : 'Nenhuma disciplina cadastrada'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5 leading-relaxed">
            {showArchived
              ? 'Disciplinas arquivadas preservam todo o histórico de estudo e podem ser restauradas a qualquer momento.'
              : 'Cadastre as disciplinas do seu curso ou plano de estudos para definir metas semanais e agendar horários.'}
          </p>
          {!showArchived && (
            <button
              onClick={() => {
                setEditingDiscipline(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition active:scale-95 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Primeira Disciplina</span>
            </button>
          )}
        </div>
      ) : (
        /* Discipline Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedDisciplines.map((discipline) => {
            const stats = getDisciplineStats(
              discipline.id,
              discipline.weeklyGoalMinutes
            );

            return (
              <div
                key={discipline.id}
                className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 hover:border-blue-300 hover:shadow-md transition relative overflow-hidden flex flex-col justify-between"
              >
                {/* Top strip with color */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: discipline.color }}
                />

                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs flex-shrink-0"
                        style={{ backgroundColor: discipline.color }}
                      >
                        {discipline.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 leading-snug">
                          {discipline.name}
                        </h3>
                        <span className="text-[11px] text-gray-400">
                          {stats.schedCount}{' '}
                          {stats.schedCount === 1 ? 'horário semanal' : 'horários semanais'}
                        </span>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingDiscipline(discipline);
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Editar disciplina"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          archiveDiscipline(discipline.id, !discipline.archived)
                        }
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition"
                        title={
                          discipline.archived
                            ? 'Restaurar disciplina'
                            : 'Arquivar disciplina'
                        }
                      >
                        {discipline.archived ? (
                          <ArchiveRestore className="w-4 h-4" />
                        ) : (
                          <Archive className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => setDisciplineToDelete(discipline)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Eliminar disciplina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar and Weekly Goal (Section 6 Example) */}
                  <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 my-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-gray-600 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-blue-600" />
                        Meta semanal:
                      </span>
                      <span className="font-mono font-bold text-gray-900">
                        {discipline.weeklyGoalMinutes > 0
                          ? formatDuration(discipline.weeklyGoalMinutes)
                          : 'Sem meta'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-gray-500">Tempo estudado esta semana:</span>
                      <span className="font-mono font-bold text-blue-600">
                        {formatDuration(stats.thisWeekMinutes)}
                      </span>
                    </div>

                    {/* Progress track */}
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${stats.percent}%`,
                          backgroundColor:
                            stats.percent >= 100
                              ? '#16A34A'
                              : discipline.color || '#2563EB',
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1.5 font-medium">
                      <span>Progresso da meta</span>
                      <span
                        className={
                          stats.percent >= 100
                            ? 'text-emerald-600 font-bold'
                            : 'text-gray-700'
                        }
                      >
                        {stats.percent}%
                      </span>
                    </div>
                  </div>

                  {/* Badges / Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="text-gray-500 text-[10px] block">
                          Sessões realizadas
                        </span>
                        <span className="font-bold text-gray-900">
                          {stats.sessionsCount} sessões
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div>
                        <span className="text-gray-500 text-[10px] block">
                          Total acumulado
                        </span>
                        <span className="font-bold text-gray-900">
                          {formatDuration(stats.totalMinutes)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => setDetailDiscipline(discipline)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    Ver Histórico Detalhado →
                  </button>

                  {!discipline.archived && (
                    <button
                      onClick={() => startTimer(discipline.id, null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-xs font-bold transition shadow-xs"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Iniciar Estudo</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Discipline History Modal */}
      {detailDiscipline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: detailDiscipline.color }}
                />
                <h3 className="text-base font-bold text-gray-900">
                  {detailDiscipline.name} — Histórico
                </h3>
              </div>
              <button
                onClick={() => setDetailDiscipline(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
              {studySessions.filter((s) => s.disciplineId === detailDiscipline.id).length === 0 ? (
                <p className="text-center py-6 text-xs text-gray-400">
                  Nenhuma sessão registada para esta disciplina ainda.
                </p>
              ) : (
                studySessions
                  .filter((s) => s.disciplineId === detailDiscipline.id)
                  .map((session) => (
                    <div
                      key={session.id}
                      className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-gray-900">
                          {formatDuration(session.durationMinutes)}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {session.date} • {session.sessionType === 'scheduled' ? 'Programado' : session.sessionType === 'free' ? 'Estudo Livre' : 'Manual'}
                        </div>
                        {session.notes && (
                          <div className="text-[11px] text-gray-600 italic mt-0.5">
                            "{session.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Rule 9) */}
      {disciplineToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center">
              Eliminar {disciplineToDelete.name}?
            </h3>
            <p className="text-xs text-gray-500 text-center mt-1 leading-relaxed">
              Tem a certeza de que deseja eliminar esta disciplina? O histórico de sessões será mantido para integridade do dashboard.
            </p>

            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                onClick={() => setDisciplineToDelete(null)}
                className="py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteDiscipline(disciplineToDelete.id);
                  setDisciplineToDelete(null);
                }}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm"
              >
                Sim, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <DisciplineFormModal
        discipline={editingDiscipline}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDiscipline(null);
        }}
      />
    </div>
  );
};
