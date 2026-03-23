import { useMemo } from 'react';
import type { Game, CalendarMonth, CalendarCell } from '../types';

function getMonthData(month: number, year: number): CalendarMonth {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return {
    month,
    year,
    label: `${monthNames[month]} ${year}`,
    startDayOfWeek: firstDay.getDay(),
    daysInMonth,
  };
}

interface MonthRange {
  month: number;
  year: number;
}

export function useCalendar(games: Game[], calendarStartIndex: number) {
  // Build a list of all months that have games
  const allMonths = useMemo(() => {
    const monthSet = new Map<string, MonthRange>();
    for (const game of games) {
      const d = new Date(game.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthSet.has(key)) {
        monthSet.set(key, { month: d.getMonth(), year: d.getFullYear() });
      }
    }
    // Also fill in gaps between min and max months
    const entries = [...monthSet.values()].sort(
      (a, b) => a.year * 12 + a.month - (b.year * 12 + b.month)
    );
    if (entries.length === 0) return [];

    const result: MonthRange[] = [];
    const start = entries[0];
    const end = entries[entries.length - 1];
    let current = { ...start };
    while (
      current.year * 12 + current.month <=
      end.year * 12 + end.month
    ) {
      result.push({ ...current });
      current.month++;
      if (current.month > 11) {
        current.month = 0;
        current.year++;
      }
    }
    return result;
  }, [games]);

  // Get the two months to display
  const displayMonths = useMemo(() => {
    const idx = Math.max(0, Math.min(calendarStartIndex, allMonths.length - 1));
    const months: CalendarMonth[] = [];
    if (allMonths[idx]) {
      months.push(getMonthData(allMonths[idx].month, allMonths[idx].year));
    }
    if (allMonths[idx + 1]) {
      months.push(getMonthData(allMonths[idx + 1].month, allMonths[idx + 1].year));
    }
    return months;
  }, [allMonths, calendarStartIndex]);

  // Build game lookup by date
  const gamesByDate = useMemo(() => {
    const map = new Map<string, Game>();
    for (const game of games) {
      const d = new Date(game.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(key, game);
    }
    return map;
  }, [games]);

  // Build cell grids
  const grids = useMemo(() => {
    return displayMonths.map((cm) => {
      const cells: CalendarCell[] = [];
      for (let day = 1; day <= cm.daysInMonth; day++) {
        const key = `${cm.year}-${cm.month}-${day}`;
        cells.push({ day, game: gamesByDate.get(key) || null });
      }
      return { month: cm, cells };
    });
  }, [displayMonths, gamesByDate]);

  const canGoBack = calendarStartIndex > 0;
  const canGoForward = calendarStartIndex < allMonths.length - 2;

  // Find index for a given month number (0-11)
  function findMonthIndex(targetMonth: number): number {
    const idx = allMonths.findIndex((m) => m.month === targetMonth);
    return idx >= 0 ? Math.min(idx, allMonths.length - 2) : 0;
  }

  return {
    grids,
    displayMonths,
    allMonths,
    canGoBack,
    canGoForward,
    findMonthIndex,
  };
}
