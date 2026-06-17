import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonStatCard, SkeletonList } from '@/components/ui/Skeleton';
import { formatShortDate } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { useAsistencia } from './useAsistencia';
import { JustificationModal } from './JustificationModal';
import type { RegistroAsistencia } from '@/types';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

const statusConfig = {
  presente:  { label: 'Presente',  variant: 'success'  as const, icon: '✓' },
  ausente:   { label: 'Ausente',   variant: 'danger'   as const, icon: '✗' },
  tardanza:  { label: 'Tardanza',  variant: 'warning'  as const, icon: '⚠' },
};

export const AsistenciaPage: React.FC = () => {
  const { userData } = useAuth();
  const alumnoId = userData?.alumnos?.[0] ?? '';
  const { records, estadisticas, isLoading, error } = useAsistencia(alumnoId);
  const [justifyRecord, setJustifyRecord] = useState<RegistroAsistencia | null>(null);

  if (!alumnoId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-4xl mb-3" aria-hidden>📋</div>
        <p className="text-neutral-400 text-sm">No tienes alumnos asignados.</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5 max-w-4xl mx-auto"
    >
      {/* Stats cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {isLoading ? (
          [1, 2, 3, 4].map(i => <SkeletonStatCard key={i} />)
        ) : (
          <>
            {[
              { label: 'Asistencia', value: `${estadisticas.porcentajeAsistencia}%`, variant: estadisticas.superaLimite ? 'danger' : 'success' },
              { label: 'Presentes',  value: estadisticas.presentes.toString(),  variant: 'success' },
              { label: 'Ausencias',  value: estadisticas.ausentes.toString(),   variant: 'danger'  },
              { label: 'Tardanzas',  value: estadisticas.tardanzas.toString(),  variant: 'warning' },
            ].map(stat => (
              <Card key={stat.label} variant="elevated" padding="md">
                <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className={cn(
                  'text-3xl font-heading font-bold tabular-nums mt-1',
                  stat.variant === 'success' ? 'text-success-500' :
                  stat.variant === 'danger'  ? 'text-danger-500'  : 'text-warning-500',
                )}>
                  {stat.value}
                </p>
              </Card>
            ))}
          </>
        )}
      </motion.div>

      {/* Critical alert */}
      {!isLoading && estadisticas.superaLimite && (
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-danger-900 bg-danger-900/20 p-4 flex items-start gap-3"
          role="alert"
        >
          <span className="text-danger-500 text-xl shrink-0" aria-hidden>⚠️</span>
          <div>
            <p className="text-sm font-semibold text-danger-400">
              Límite de inasistencias superado
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              El alumno ha superado el 15% de inasistencias permitidas. Comuníquese con la dirección del establecimiento.
            </p>
          </div>
        </motion.div>
      )}

      {/* Records list */}
      <motion.div variants={itemVariants}>
        <CardTitle className="mb-3">Historial de asistencia</CardTitle>

        {error && (
          <p className="text-sm text-danger-500 text-center py-4">
            Error al cargar historial. Intenta nuevamente.
          </p>
        )}

        {isLoading ? (
          <SkeletonList rows={6} />
        ) : records.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <div className="text-4xl" aria-hidden>📋</div>
            <p className="text-neutral-400 text-sm">Sin registros de asistencia aún.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map(record => {
              const config = statusConfig[record.estado];
              return (
                <div
                  key={record.id}
                  className="glass-card p-3 flex items-center gap-3"
                >
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
                    record.estado === 'presente'  ? 'bg-success-900/40 text-success-500' :
                    record.estado === 'ausente'   ? 'bg-danger-900/40 text-danger-500'   :
                    'bg-warning-900/40 text-warning-500',
                  )}>
                    {config.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-200 font-medium">
                      {formatShortDate(record.fecha.toDate())}
                    </p>
                    {record.justificacion && (
                      <p className="text-xs text-neutral-500 truncate mt-0.5">
                        Justificado: {record.justificacion}
                      </p>
                    )}
                  </div>

                  <Badge variant={config.variant}>
                    {config.label}
                  </Badge>

                  {record.estado === 'ausente' && !record.justificacion && (
                    <button
                      onClick={() => setJustifyRecord(record)}
                      className="text-xs text-primary-400 hover:text-primary-300 transition-colors whitespace-nowrap"
                      aria-label={`Justificar inasistencia del ${formatShortDate(record.fecha.toDate())}`}
                    >
                      Justificar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {justifyRecord && (
        <JustificationModal
          record={justifyRecord}
          onClose={() => setJustifyRecord(null)}
        />
      )}
    </motion.div>
  );
};
