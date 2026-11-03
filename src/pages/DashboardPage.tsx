import React, { useState, useMemo } from 'react';
import { useStudy } from '../context/StudyContext';
import { DashboardFilter, StudySession, Discipline } from '../types';
import {
  formatDuration,
  toDateString,
  parseDateString,
  getMondayOfWeek,
  getDaysInWeek,
  DAYS_OF_WEEK,
} from '../utils/dateUtils';
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingUp,
  GraduationCap,
  Filter,
  BarChart3,
  CalendarDays,
  Target,
  Trash2,
  FileText,
  ChevronDown,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    studySessions,
    disciplines,
    schedules,
    scheduleOccurrences,
    deleteStudySession,
  } = useStudy();

  // Filters
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>('this_week');
  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toDateString(d);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => toDateString(new Date()));

  const [sessionToDelete, setSessionToDelete] = useState<StudySession | null>(null);

  const discMap = useMemo(() => {
    return new Map<string, Discipline>(disciplines.map((d) => [d.id, d]));
  }, [disciplines]);

  // Determine date boundary based on activeFilter
  const filterDateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date();

    if (activeFilter === 'this_week') {
      start = getMondayOfWeek(now);
      const days = getDaysInWeek(start);
      end = new Date(days[6]);
      end.setHours(23, 59, 59, 999);
    } else if (activeFilter === 'last_week') {
      const thisMonday = getMondayOfWeek(now);
      start = new Date(thisMonday);
      start.setDate(start.getDate() - 7);
      const days = getDaysInWeek(start);
      end = new Date(days[6]);
      end.setHours(23, 59, 59, 999);
    } else if (activeFilter === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (activeFilter === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (activeFilter === 'last_30_days') {
      start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    } else if (activeFilter === 'last_90_days') {
      start = new Date();
      start.setDate(start.getDate() - 90);
      start.setHours(0, 0, 0, 0);
    } else {
      // Custom
      start = parseDateString(customStartDate);
      start.setHours(0, 0, 0, 0);
      end = parseDateString(customEndDate);
      end.setHours(23, 59, 59, 999);
    }

    return {
      startStr: toDateString(start),
      endStr: toDateString(end),
      startDate: start,
      endDate: end,
    };
  }, [activeFilter, customStartDate, customEndDate]);

  // Filter study sessions
  const filteredSessions = useMemo(() => {
    return studySessions.filter((s) => {
      if (s.date < filterDateRange.startStr || s.date > filterDateRange.endStr) {
        return false;
      }
      if (selectedDisciplineFilter !== 'all' && s.disciplineId !== selectedDisciplineFilter) {
        return false;
      }
      return true;
    });
  }, [studySessions, filterDateRange, selectedDisciplineFilter]);

  // Compute lifetime / general indicators
  const totalLifetimeMinutes = useMemo(() => {
    return studySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  }, [studySessions]);

  // This week minutes
  const thisWeekMondayStr = toDateString(getMondayOfWeek(new Date()));
  const thisWeekSundayStr = toDateString(getDaysInWeek(getMondayOfWeek(new Date()))[6]);
  const thisWeekMinutes = useMemo(() => {
    return studySessions
      .filter((s) => s.date >= thisWeekMondayStr && s.date <= thisWeekSundayStr)
      .reduce((acc, s) => acc + s.durationMinutes, 0);
  }, [studySessions, thisWeekMondayStr, thisWeekSundayStr]);

  // This month minutes
  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthMinutes = useMemo(() => {
    return studySessions
      .filter((s) => s.date.startsWith(thisMonthPrefix))
      .reduce((acc, s) => acc + s.durationMinutes, 0);
  }, [studySessions, thisMonthPrefix]);

  // Filtered period metrics
  const filteredTotalMinutes = filteredSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const filteredSessionsCount = filteredSessions.length;

  const uniqueDisciplinesStudiedCount = useMemo(() => {
    const set = new Set(filteredSessions.map((s) => s.disciplineId));
    return set.size;
  }, [filteredSessions]);

  // Filtered schedule occurrences
  const filteredOccurrences = useMemo(() => {
    return scheduleOccurrences.filter((o) => {
      if (o.date < filterDateRange.startStr || o.date > filterDateRange.endStr) {
        return false;
      }
      if (selectedDisciplineFilter !== 'all') {
        const sched = schedules.find((s) => s.id === o.scheduleId);
        if (sched?.disciplineId !== selectedDisciplineFilter) return false;
      }
      return true;
    });
  }, [scheduleOccurrences, filterDateRange, selectedDisciplineFilter, schedules]);

  const completedOccurrencesCount = filteredOccurrences.filter((o) => o.status === 'studied').length;
  const notStudiedOccurrencesCount = filteredOccurrences.filter((o) => o.status === 'not_studied').length;
  const totalTrackedOccurrences = completedOccurrencesCount + notStudiedOccurrencesCount;

  const scheduleCompletionRate =
    totalTrackedOccurrences > 0
      ? Math.round((completedOccurrencesCount / totalTrackedOccurrences) * 100)
      : completedOccurrencesCount > 0
      ? 100
      : 0;

  // --- Gráfico 1: Tempo por Disciplina ---
  const timeByDiscipline = useMemo(() => {
    const map = new Map<string, number>();
    disciplines.forEach((d) => map.set(d.id, 0));
    filteredSessions.forEach((s) => {
      const prev = map.get(s.disciplineId) || 0;
      map.set(s.disciplineId, prev + s.durationMinutes);
    });

    const list = Array.from(map.entries())
      .map(([id, minutes]) => {
        const disc = discMap.get(id);
        return {
          id,
          name: disc?.name || 'Desconhecida',
          color: disc?.color || '#2563EB',
          minutes,
        };
      })
      .filter((item) => item.minutes > 0 || disciplines.length <= 4)
      .sort((a, b) => b.minutes - a.minutes);

    const maxMinutes = Math.max(1, ...list.map((i) => i.minutes));
    return { list, maxMinutes };
  }, [filteredSessions, disciplines, discMap]);

  // --- Gráfico 2: Tempo por Dia da Semana (Segunda a Domingo) ---
  const timeByDayOfWeek = useMemo(() => {
    const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Index 0 = Segunda (1), ... Index 6 = Domingo (7)

    filteredSessions.forEach((s) => {
      const d = parseDateString(s.date);
      const jsDay = d.getDay(); // 0 is Sun, 1 is Mon
      const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
      dayTotals[dayIdx] += s.durationMinutes;
    });

    const maxMinutes = Math.max(1, ...dayTotals);
    return {
      days: DAYS_OF_WEEK.map((d, idx) => ({
        ...d,
        minutes: dayTotals[idx],
        percentage: Math.round((dayTotals[idx] / maxMinutes) * 100),
      })),
      maxMinutes,
    };
  }, [filteredSessions]);

  // --- Gráfico 3: Progresso Semanal (Meta vs Real) ---
  const weeklyGoalVsActual = useMemo(() => {
    // Current week progress for active disciplines
    return disciplines
      .filter((d) => !d.archived)
      .map((d) => {
        const studiedThisWeek = studySessions
          .filter(
            (s) =>
              s.disciplineId === d.id &&
              s.date >= thisWeekMondayStr &&
              s.date <= thisWeekSundayStr
          )
          .reduce((acc, s) => acc + s.durationMinutes, 0);

        const goal = d.weeklyGoalMinutes;
        const percent = goal > 0 ? Math.min(100, Math.round((studiedThisWeek / goal) * 100)) : 0;

        return {
          id: d.id,
          name: d.name,
          color: d.color,
          goal,
          actual: studiedThisWeek,
          percent,
        };
      });
  }, [disciplines, studySessions, thisWeekMondayStr, thisWeekSundayStr]);

  // --- Gráfico 4: Evolução Mensal (Últimos 6 meses) ---
  const monthlyEvolution = useMemo(() => {
    const monthsData: { monthKey: string; label: string; minutes: number }[] = [];
    const current = new Date();

    for (let i = 5; i >= 0; i--) {
      const target = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const monthKey = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`;
      const label = target.toLocaleDateString('pt-PT', { month: 'short' });

      const monthMinutes = studySessions
        .filter((s) => {
          if (!s.date.startsWith(monthKey)) return false;
          if (selectedDisciplineFilter !== 'all' && s.disciplineId !== selectedDisciplineFilter) {
            return false;
          }
          return true;
        })
        .reduce((acc, s) => acc + s.durationMinutes, 0);

      monthsData.push({ monthKey, label, minutes: monthMinutes });
    }

    const maxMonthlyMinutes = Math.max(1, ...monthsData.map((m) => m.minutes));
    return { monthsData, maxMonthlyMinutes };
  }, [studySessions, selectedDisciplineFilter]);

  return (
    <div className="pb-28 max-w-5xl mx-auto px-4 pt-4 sm:pt-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A]">Painel de Desempenho</h2>
          <p className="text-xs text-gray-500">
            Estatísticas calculadas a partir das suas sessões de estudo reais
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as DashboardFilter)}
              className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="this_week">Esta Semana</option>
              <option value="last_week">Semana Anterior</option>
              <option value="this_month">Este Mês</option>
              <option value="last_month">Mês Anterior</option>
              <option value="last_30_days">Últimos 30 Dias</option>
              <option value="last_90_days">Últimos 90 Dias</option>
              <option value="custom">Período Personalizado</option>
            </select>
          </div>

          {/* Discipline Filter */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
            <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedDisciplineFilter}
              onChange={(e) => setSelectedDisciplineFilter(e.target.value)}
              className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="all">Todas Disciplinas</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Custom Date Pickers if activeFilter === 'custom' */}
      {activeFilter === 'custom' && (
        <div className="bg-white p-3 rounded-2xl border border-gray-200 mb-5 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-gray-700">De:</span>
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-300"
          />
          <span className="font-semibold text-gray-700">Até:</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-300"
          />
        </div>
      )}

      {/* Indicadores Principais (8 Cartões - Secção 23) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* Cartão 1: Tempo Total */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Tempo Total
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#142B4A]">
              {formatDuration(totalLifetimeMinutes)}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Histórico acumulado</p>
          </div>
        </div>

        {/* Cartão 2: Tempo Esta Semana */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Esta Semana
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#142B4A]">
              {formatDuration(thisWeekMinutes)}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Segunda a Domingo</p>
          </div>
        </div>

        {/* Cartão 3: Tempo Este Mês */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Este Mês
            </span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#142B4A]">
              {formatDuration(thisMonthMinutes)}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Mês corrente</p>
          </div>
        </div>

        {/* Cartão 4: Sessões Realizadas */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Sessões Feitas
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#142B4A]">
              {filteredSessionsCount}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">No período filtrado</p>
          </div>
        </div>

        {/* Cartão 5: Disciplinas Estudadas */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Disciplinas Ativas
            </span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#142B4A]">
              {uniqueDisciplinesStudiedCount} / {disciplines.length}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Estudadas no filtro</p>
          </div>
        </div>

        {/* Cartão 6: Programações Concluídas */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Concluídas
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-600">
              {completedOccurrencesCount}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Marcadas estudadas</p>
          </div>
        </div>

        {/* Cartão 7: Programações Não Estudadas */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Não Estudadas
            </span>
            <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-red-600">
              {notStudiedOccurrencesCount}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Horários perdidos</p>
          </div>
        </div>

        {/* Cartão 8: % Cumprimento */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Cumprimento
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-600">
              {scheduleCompletionRate}%
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Aderência aos horários</p>
          </div>
        </div>
      </div>

      {/* Gráficos (4 Gráficos - Secção 24) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Gráfico 1 — Tempo por disciplina */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Gráfico 1 — Tempo por Disciplina
              </h3>
              <p className="text-[11px] text-gray-500">
                Distribuição de horas dedicadas por matéria
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600 font-mono">
              {formatDuration(filteredTotalMinutes)}
            </span>
          </div>

          {timeByDiscipline.list.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-400">
              Sem dados de estudo no período selecionado
            </div>
          ) : (
            <div className="space-y-3">
              {timeByDiscipline.list.map((item) => {
                const percent = Math.round(
                  (item.minutes / timeByDiscipline.maxMinutes) * 100
                );
                return (
                  <div key={item.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-semibold text-gray-800">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-mono text-gray-600 font-medium">
                        {formatDuration(item.minutes)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gráfico 2 — Tempo por dia da semana */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Gráfico 2 — Tempo por Dia da Semana
              </h3>
              <p className="text-[11px] text-gray-500">
                Intensidade de estudo de Segunda a Domingo
              </p>
            </div>
            <CalendarDays className="w-4 h-4 text-gray-400" />
          </div>

          <div className="flex items-end justify-between gap-2 h-44 pt-4 pb-2 px-1">
            {timeByDayOfWeek.days.map((d) => {
              const heightPercent = Math.max(8, d.percentage);
              const hasData = d.minutes > 0;

              return (
                <div
                  key={d.id}
                  className="flex-1 flex flex-col items-center justify-end h-full group"
                >
                  <span className="text-[10px] font-mono text-gray-500 mb-1 opacity-0 group-hover:opacity-100 transition">
                    {d.minutes > 0 ? `${Math.round(d.minutes)}m` : '0'}
                  </span>
                  <div className="w-full max-w-[28px] bg-gray-100 rounded-t-lg h-full flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        hasData
                          ? 'bg-blue-600 group-hover:bg-[#142B4A]'
                          : 'bg-gray-200'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-700 mt-2">
                    {d.short}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráfico 3 — Progresso semanal (Meta vs Real) */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Gráfico 3 — Progresso Semanal
              </h3>
              <p className="text-[11px] text-gray-500">
                Cumprimento da meta semanal por disciplina
              </p>
            </div>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>

          {weeklyGoalVsActual.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-400">
              Nenhuma disciplina com meta cadastrada
            </div>
          ) : (
            <div className="space-y-3.5">
              {weeklyGoalVsActual.map((item) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-gray-800">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-[11px]">
                      <span className="font-bold text-gray-900">
                        {formatDuration(item.actual)}
                      </span>
                      <span className="text-gray-400">
                        {' '}
                        / {formatDuration(item.goal)}
                      </span>
                      <span
                        className={`ml-1.5 font-bold ${
                          item.percent >= 100
                            ? 'text-emerald-600'
                            : 'text-blue-600'
                        }`}
                      >
                        ({item.percent}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percent}%`,
                        backgroundColor:
                          item.percent >= 100 ? '#16A34A' : item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gráfico 4 — Evolução mensal */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Gráfico 4 — Evolução Mensal
              </h3>
              <p className="text-[11px] text-gray-500">
                Tempo total estudado nos últimos 6 meses
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="flex items-end justify-between gap-3 h-44 pt-4 pb-2 px-2">
            {monthlyEvolution.monthsData.map((m) => {
              const heightPercent = Math.max(
                8,
                Math.round(
                  (m.minutes / monthlyEvolution.maxMonthlyMinutes) * 100
                )
              );
              return (
                <div
                  key={m.monthKey}
                  className="flex-1 flex flex-col items-center justify-end h-full group"
                >
                  <span className="text-[10px] font-mono text-gray-500 mb-1 opacity-0 group-hover:opacity-100 transition">
                    {formatDuration(m.minutes)}
                  </span>
                  <div className="w-full max-w-[32px] bg-gray-100 rounded-t-lg h-full flex items-end overflow-hidden">
                    <div
                      className="w-full rounded-t-lg bg-[#142B4A] group-hover:bg-blue-600 transition-all duration-500"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-700 mt-2 capitalize">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Histórico de Estudo (Secção 26) */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Histórico Detalhado de Sessões
            </h3>
            <p className="text-xs text-gray-500">
              {filteredSessions.length} sessões registadas no período
            </p>
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-400">
            Nenhuma sessão de estudo registada neste intervalo.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {filteredSessions.map((session) => {
              const disc = discMap.get(session.disciplineId);

              const typeBadge = {
                scheduled: (
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                    Programada
                  </span>
                ),
                free: (
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                    Estudo Livre
                  </span>
                ),
                manual: (
                  <span className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                    Manual
                  </span>
                ),
              }[session.sessionType];

              return (
                <div
                  key={session.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/60 rounded-xl px-2 transition"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: disc?.color || '#2563EB' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          {disc?.name || 'Disciplina'}
                        </span>
                        {typeBadge}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                        <span>{session.date}</span>
                        {session.startTimestamp && session.endTimestamp && (
                          <span className="font-mono text-gray-400">
                            {new Date(session.startTimestamp).toLocaleTimeString('pt-PT', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            –{' '}
                            {new Date(session.endTimestamp).toLocaleTimeString('pt-PT', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      {session.notes && (
                        <p className="text-xs text-gray-600 mt-1 italic flex items-center gap-1">
                          <FileText className="w-3 h-3 text-gray-400" />
                          {session.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center">
                    <span className="text-sm font-mono font-bold text-blue-600">
                      {formatDuration(session.durationMinutes)}
                    </span>
                    <button
                      onClick={() => setSessionToDelete(session)}
                      className="text-gray-300 hover:text-red-600 p-1 rounded transition"
                      title="Eliminar sessão do histórico"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete session confirmation modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 text-center">
              Eliminar esta sessão de estudo?
            </h3>
            <p className="text-xs text-gray-500 text-center mt-1 leading-relaxed">
              O tempo correspondente ({formatDuration(sessionToDelete.durationMinutes)}) será removido do dashboard.
            </p>

            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                onClick={() => setSessionToDelete(null)}
                className="py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteStudySession(sessionToDelete.id);
                  setSessionToDelete(null);
                }}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
