export const DAYS_OF_WEEK = [
  { id: 1, name: 'Segunda-feira', short: 'Seg', letter: 'S' },
  { id: 2, name: 'Terça-feira', short: 'Ter', letter: 'T' },
  { id: 3, name: 'Quarta-feira', short: 'Qua', letter: 'Q' },
  { id: 4, name: 'Quinta-feira', short: 'Qui', letter: 'Q' },
  { id: 5, name: 'Sexta-feira', short: 'Sex', letter: 'S' },
  { id: 6, name: 'Sábado', short: 'Sáb', letter: 'S' },
  { id: 7, name: 'Domingo', short: 'Dom', letter: 'D' },
];

export function getDayName(dayOfWeek: number, short = false): string {
  const found = DAYS_OF_WEEK.find(d => d.id === dayOfWeek);
  if (!found) return '';
  return short ? found.short : found.name;
}

// Get ISO date string YYYY-MM-DD from a Date object
export function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Convert YYYY-MM-DD string to local Date object
export function parseDateString(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // midday avoids DST shift
}

// Returns Monday of the week containing the given date
export function getMondayOfWeek(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0 is Sunday, 1 is Monday
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Returns array of 7 dates for the week starting at given monday
export function getDaysInWeek(monday: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    days.push(next);
  }
  return days;
}

// Format duration minutes into "2h 30m" or "45 min"
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 min';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hrs > 0 && mins > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (hrs > 0) {
    return `${hrs}h`;
  }
  return `${mins} min`;
}

// Format milliseconds into HH:MM or HH:MM:SS
export function formatMilliseconds(ms: number, includeSeconds = true): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (includeSeconds) {
    return `${hh}:${mm}:${ss}`;
  }
  return `${hh}:${mm}`;
}

// Time string "HH:MM" to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Format friendly date in PT
export function formatFriendlyDate(dateStr: string): string {
  const d = parseDateString(dateStr);
  return d.toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Check time overlap between two intervals on the same day
export function hasTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);

  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}
