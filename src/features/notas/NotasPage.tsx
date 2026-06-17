import React from 'react';
import { motion } from 'motion/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { useNotas } from './useNotas';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard, SkeletonStatCard } from '@/components/ui/Skeleton';
import { formatGrade, getGradeColor, getGradeLabel } from '@/utils/formatters';
import { cn } from '@/utils/cn';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface GradeCardProps {
  nota: number;
  asignatura: string;
  evaluacion: string;
  fecha: Date;
}

const GradeCard: React.FC<GradeCardProps> = ({ nota, asignatura, evaluacion, fecha }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-surface-3">
    <div className={cn('text-3xl font-heading font-bold w-14 text-center tabular-nums transition-colors', getGradeColor(nota))}>
      {formatGrade(nota)}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-neutral-200 truncate">{evaluacion}</p>
      <p className="text-xs text-neutral-500">{asignatura}</p>
      <p className="text-2xs text-neutral-600 mt-0.5">
        {new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short' }).format(fecha)}
      </p>
    </div>
    <Badge
      variant={nota >= 4.0 ? (nota >= 6.0 ? 'success' : 'primary') : 'danger'}
    >
      {getGradeLabel(nota)}
    </Badge>
  </div>
);

export const NotasPage: React.FC = () => {
  const { userData } = useAuth();
  const alumnoId = userData?.alumnos?.[0] ?? '';
  const { notas, notasPorAsignatura, promedioGeneral, isLoading, error } = useNotas(alumnoId);

  const chartData = notas
    .slice()
    .reverse()
    .map((n, i) => ({
      name: `E${i + 1}`,
      nota: n.nota,
      asignatura: n.asignatura,
    }));

  if (!alumnoId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-4xl mb-3" aria-hidden>📚</div>
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
      {/* Promedio general */}
      <motion.div variants={itemVariants}>
        {isLoading ? (
          <SkeletonStatCard />
        ) : (
          <Card variant="glass" padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 font-medium uppercase tracking-wider">
                  Promedio General
                </p>
                <p className={cn('text-6xl font-heading font-bold tabular-nums mt-1', getGradeColor(promedioGeneral))}>
                  {formatGrade(promedioGeneral)}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  {notas.length} evaluaciones registradas
                </p>
              </div>
              <div className="h-20 w-20 rounded-2xl bg-surface-2 border border-surface-3 flex items-center justify-center">
                <svg className="h-10 w-10 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                </svg>
              </div>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Evolución chart */}
      {!isLoading && chartData.length > 1 && (
        <motion.div variants={itemVariants}>
          <Card variant="elevated" padding="md">
            <CardTitle className="mb-4">Evolución de notas</CardTitle>
            <ResponsiveContainer width="100%" height={180} aria-label="Gráfico de evolución de notas">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c3324" />
                <XAxis dataKey="name" tick={{ fill: '#7a9582', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[1, 7]} tick={{ fill: '#7a9582', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111c16', border: '1px solid #1f3028', borderRadius: '12px', fontSize: 12 }}
                  labelStyle={{ color: '#bfcfc3' }}
                  itemStyle={{ color: '#22c55e' }}
                />
                <ReferenceLine y={4.0} stroke="#f59e0b" strokeDasharray="4 4" opacity={0.5} label={{ value: 'Mín aprobación', fill: '#f59e0b', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="nota"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', r: 3 }}
                  activeDot={{ r: 5, fill: '#4ade80' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* Notas por asignatura */}
      <motion.div variants={itemVariants} className="space-y-4">
        {error && (
          <p className="text-sm text-danger-500 text-center py-4">
            Error al cargar notas. Intenta nuevamente.
          </p>
        )}

        {isLoading ? (
          [1, 2, 3].map(i => <SkeletonCard key={i} />)
        ) : notasPorAsignatura.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-5xl" aria-hidden>📖</div>
            <p className="text-neutral-400 text-sm font-medium">Aún no hay notas registradas</p>
            <p className="text-neutral-600 text-xs">
              Las notas aparecerán aquí cuando los docentes las ingresen al sistema.
            </p>
          </div>
        ) : (
          notasPorAsignatura.map(({ asignatura, notas: asignaturNotas, promedio }) => (
            <Card key={asignatura} variant="elevated" padding="md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-neutral-200">{asignatura}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Promedio</span>
                  <span className={cn('text-xl font-heading font-bold tabular-nums', getGradeColor(promedio))}>
                    {formatGrade(promedio)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-surface-3 rounded-full mb-3 overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', promedio >= 6 ? 'bg-success-500' : promedio >= 4 ? 'bg-primary-600' : 'bg-danger-500')}
                  initial={{ width: 0 }}
                  animate={{ width: `${((promedio - 1) / 6) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>

              <div className="space-y-2">
                {asignaturNotas.map(nota => (
                  <GradeCard
                    key={nota.id}
                    nota={nota.nota}
                    asignatura={nota.asignatura}
                    evaluacion={nota.evaluacion}
                    fecha={nota.fecha.toDate()}
                  />
                ))}
              </div>
            </Card>
          ))
        )}
      </motion.div>
    </motion.div>
  );
};
