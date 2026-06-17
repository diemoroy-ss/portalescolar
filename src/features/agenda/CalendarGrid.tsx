import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/utils/cn';
import { EVENT_DOT_COLORS } from './agenda.service';
import type { Evento } from '@/types';

interface CalendarGridProps {
  year: number;
  month: number;
  getEventosForDay: (day: number) => Evento[];
  onDayClick: (day: number) => void;
  selectedDay: number | null;
}

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  year,
  month,
  getEventosForDay,
  onDayClick,
  selectedDay,
}) => {
  const today = new Date();

  const { daysInMonth, startDayOfWeek } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = (firstDay.getDay() + 6) % 7;
    return {
      daysInMonth: lastDay.getDate(),
      startDayOfWeek: startDay,
    };
  }, [year, month]);

  const cells = useMemo(() => {
    const blanks = Array.from({ length: startDayOfWeek }, (_, i) => ({ type: 'blank' as const, key: `blank-${i}` }));
    const days = Array.from({ length: daysInMonth }, (_, i) => ({
      type: 'day' as const,
      day: i + 1,
      key: `day-${i + 1}`,
    }));
    return [...blanks, ...days];
  }, [startDayOfWeek, daysInMonth]);

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-2xs font-semibold text-neutral-600 py-1 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map(cell => {
          if (cell.type === 'blank') {
            return <div key={cell.key} />;
          }

          const eventos = getEventosForDay(cell.day);
          const isToday =
            today.getDate() === cell.day &&
            today.getMonth() === month &&
            today.getFullYear() === year;
          const isSelected = selectedDay === cell.day;
          const isWeekend = (() => {
            const d = new Date(year, month, cell.day).getDay();
            return d === 0 || d === 6;
          })();

          return (
            <motion.button
              key={cell.key}
              onClick={() => onDayClick(cell.day)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'relative flex flex-col items-center justify-start',
                'h-12 sm:h-14 rounded-xl transition-colors duration-150',
                'text-xs font-medium pt-1.5 touch-target',
                isSelected && 'bg-primary-700 text-white',
                isToday && !isSelected && 'bg-primary-900/40 text-primary-400 border border-primary-800',
                !isSelected && !isToday && 'hover:bg-surface-2 text-neutral-400',
                isWeekend && !isSelected && !isToday && 'text-neutral-600',
              )}
              aria-label={`${cell.day} de ${MONTH_NAMES[month]}, ${eventos.length} evento${eventos.length !== 1 ? 's' : ''}`}
              aria-pressed={isSelected}
            >
              <span>{cell.day}</span>
              {eventos.length > 0 && (
                <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-[80%]">
                  {eventos.slice(0, 3).map((ev, i) => (
                    <span
                      key={i}
                      className={cn('h-1.5 w-1.5 rounded-full', EVENT_DOT_COLORS[ev.tipo])}
                      aria-hidden
                    />
                  ))}
                  {eventos.length > 3 && (
                    <span className="text-2xs text-neutral-500">+{eventos.length - 3}</span>
                  )}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export { MONTH_NAMES };
