import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { useAgenda } from './useAgenda';
import { CalendarGrid, MONTH_NAMES } from './CalendarGrid';
import { EventCard } from './EventCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';

const ChevronLeft = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRight = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

export const AgendaPage: React.FC = () => {
  const { userData } = useAuth();
  const cursoId = userData?.cursos?.[0] ?? '';

  const {
    eventos,
    isLoading,
    error,
    year,
    month,
    navigatePrevious,
    navigateNext,
    getEventosForDay,
  } = useAgenda(cursoId);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const selectedEventos = selectedDay ? getEventosForDay(selectedDay) : eventos;

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  if (!cursoId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-4xl mb-3" aria-hidden>📅</div>
        <p className="text-neutral-400 text-sm">No tienes cursos asignados.</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 max-w-4xl mx-auto"
    >
      {/* Calendar card */}
      <motion.div variants={itemVariants}>
        <Card variant="glass" padding="md">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={navigatePrevious}
              leftIcon={<ChevronLeft />}
              aria-label="Mes anterior"
            >
              <span className="hidden sm:inline">Anterior</span>
            </Button>

            <h2 className="font-heading text-lg font-semibold text-neutral-100 capitalize">
              {MONTH_NAMES[month]} {year}
            </h2>

            <Button
              variant="ghost"
              size="sm"
              onClick={navigateNext}
              rightIcon={<ChevronRight />}
              aria-label="Mes siguiente"
            >
              <span className="hidden sm:inline">Siguiente</span>
            </Button>
          </div>

          {/* Legend */}
          <div className="flex gap-4 flex-wrap mb-4">
            {[
              { label: 'Prueba', color: 'bg-danger-500' },
              { label: 'Tarea', color: 'bg-warning-500' },
              { label: 'Trabajo', color: 'bg-secondary-400' },
              { label: 'Actividad', color: 'bg-accent' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${item.color}`} aria-hidden />
                <span className="text-2xs text-neutral-500">{item.label}</span>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <CalendarGrid
              year={year}
              month={month}
              getEventosForDay={getEventosForDay}
              onDayClick={day => setSelectedDay(prev => prev === day ? null : day)}
              selectedDay={selectedDay}
            />
          )}

          {selectedDay && (
            <button
              onClick={() => setSelectedDay(null)}
              className="mt-3 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Mostrar todos los eventos del mes →
            </button>
          )}
        </Card>
      </motion.div>

      {/* Events list */}
      <motion.div variants={itemVariants}>
        <h3 className="text-sm font-semibold text-neutral-400 mb-3 uppercase tracking-wider">
          {selectedDay
            ? `Eventos del ${selectedDay} de ${MONTH_NAMES[month]}`
            : `Todos los eventos — ${MONTH_NAMES[month]} ${year}`}
          {' '}
          <span className="text-neutral-600 font-normal">({selectedEventos.length})</span>
        </h3>

        {error && (
          <p className="text-sm text-danger-500 text-center py-4">
            Error al cargar eventos. Intenta nuevamente.
          </p>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : selectedEventos.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="text-5xl" aria-hidden>🗓️</div>
            <p className="text-neutral-400 text-sm font-medium">
              {selectedDay ? 'Sin eventos este día' : 'No hay eventos este mes'}
            </p>
            <p className="text-neutral-600 text-xs">
              Los eventos de agenda aparecerán aquí cuando los docentes los publiquen.
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {selectedEventos.map(evento => (
              <motion.div key={evento.id} variants={itemVariants}>
                <EventCard evento={evento} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};
