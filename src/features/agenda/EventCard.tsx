import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from './agenda.service';
import { formatDate } from '@/utils/formatters';
import type { Evento } from '@/types';

interface EventCardProps {
  evento: Evento;
}

export const EventCard: React.FC<EventCardProps> = ({ evento }) => {
  const fecha = evento.fecha.toDate();
  const now = new Date();
  const daysUntil = Math.ceil((fecha.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const urgencyLabel =
    daysUntil < 0
      ? 'Pasado'
      : daysUntil === 0
      ? 'Hoy'
      : daysUntil === 1
      ? 'Mañana'
      : daysUntil <= 3
      ? `En ${daysUntil} días`
      : null;

  return (
    <Card variant="elevated" hover padding="md">
      <div className="flex items-start gap-3">
        {/* Date block */}
        <div className="shrink-0 flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-surface-2 border border-surface-3">
          <span className="text-lg font-bold text-neutral-100 leading-none">
            {fecha.getDate()}
          </span>
          <span className="text-2xs text-neutral-500 uppercase">
            {new Intl.DateTimeFormat('es-CL', { month: 'short' }).format(fecha)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-neutral-100 truncate">
              {evento.titulo}
            </h4>
            <div className="flex gap-2 shrink-0">
              {urgencyLabel && daysUntil !== null && daysUntil <= 3 && (
                <Badge variant={daysUntil <= 1 ? 'danger' : 'warning'} dot>
                  {urgencyLabel}
                </Badge>
              )}
              <Badge
                variant="neutral"
                className={EVENT_TYPE_COLORS[evento.tipo]}
              >
                {EVENT_TYPE_LABELS[evento.tipo]}
              </Badge>
            </div>
          </div>

          <p className="text-xs text-neutral-500 mt-0.5">
            {evento.asignatura} · {formatDate(fecha)}
          </p>

          {evento.descripcion && (
            <p className="text-xs text-neutral-400 mt-1.5 line-clamp-2">
              {evento.descripcion}
            </p>
          )}

          {evento.adjuntos.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {evento.adjuntos.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xs text-primary-400 hover:text-primary-300 underline transition-colors"
                >
                  Adjunto {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
