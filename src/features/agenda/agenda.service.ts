import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import type { Evento, EventType } from '@/types';

const EventoSchema = z.object({
  titulo: z.string().min(1).max(200),
  tipo: z.enum(['prueba', 'tarea', 'trabajo', 'actividad', 'otro']),
  asignatura: z.string().min(1).max(100),
  fecha: z.instanceof(Date),
  cursoId: z.string().min(1),
  descripcion: z.string().max(1000).default(''),
  adjuntos: z.array(z.string().url()).default([]),
});

type CreateEventoInput = z.input<typeof EventoSchema>;

export const subscribeToEventosByCurso = (
  cursoId: string,
  year: number,
  month: number,
  onData: (eventos: Evento[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  const q = query(
    collection(db, 'eventos'),
    where('cursoId', '==', cursoId),
    where('fecha', '>=', Timestamp.fromDate(startOfMonth)),
    where('fecha', '<=', Timestamp.fromDate(endOfMonth)),
    orderBy('fecha', 'asc'),
  );

  return onSnapshot(
    q,
    snapshot => {
      const eventos = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Evento[];
      onData(eventos);
    },
    onError,
  );
};

export const createEvento = async (
  input: CreateEventoInput,
  creadoPor: string,
): Promise<string> => {
  const validated = EventoSchema.parse(input);

  const ref = await addDoc(collection(db, 'eventos'), {
    ...validated,
    fecha: Timestamp.fromDate(validated.fecha),
    creadoPor,
    creadoEn: serverTimestamp(),
  });

  return ref.id;
};

export const updateEvento = async (
  eventoId: string,
  input: Partial<CreateEventoInput>,
): Promise<void> => {
  const partial = EventoSchema.partial().parse(input);
  await updateDoc(doc(db, 'eventos', eventoId), {
    ...partial,
    ...(partial.fecha ? { fecha: Timestamp.fromDate(partial.fecha) } : {}),
  });
};

export const deleteEvento = async (eventoId: string): Promise<void> => {
  await deleteDoc(doc(db, 'eventos', eventoId));
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  prueba:    'Prueba',
  tarea:     'Tarea',
  trabajo:   'Trabajo',
  actividad: 'Actividad',
  otro:      'Otro',
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  prueba:    'text-danger-500 bg-danger-900/40 border-danger-900',
  tarea:     'text-warning-500 bg-warning-900/40 border-warning-900',
  trabajo:   'text-secondary-300 bg-secondary-900/40 border-secondary-900',
  actividad: 'text-accent bg-accent-dark/20 border-accent-dark',
  otro:      'text-neutral-400 bg-surface-2 border-surface-3',
};

export const EVENT_DOT_COLORS: Record<EventType, string> = {
  prueba:    'bg-danger-500',
  tarea:     'bg-warning-500',
  trabajo:   'bg-secondary-400',
  actividad: 'bg-accent',
  otro:      'bg-neutral-500',
};
