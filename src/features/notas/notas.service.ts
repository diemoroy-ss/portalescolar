import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import type { Nota } from '@/types';
import { calculateAverage } from '@/utils/formatters';

const NotaSchema = z.object({
  alumnoId: z.string().min(1),
  asignatura: z.string().min(1).max(100),
  evaluacion: z.string().min(1).max(200),
  nota: z.number().min(1.0).max(7.0),
  cursoId: z.string().min(1),
});

type CreateNotaInput = z.input<typeof NotaSchema>;

export const subscribeToNotasByAlumno = (
  alumnoId: string,
  onData: (notas: Nota[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const q = query(
    collection(db, 'notas'),
    where('alumnoId', '==', alumnoId),
    orderBy('fecha', 'desc'),
  );

  return onSnapshot(
    q,
    snapshot => {
      const notas = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Nota[];
      onData(notas);
    },
    onError,
  );
};

export const createNota = async (
  input: CreateNotaInput,
  docenteId: string,
): Promise<string> => {
  const validated = NotaSchema.parse(input);
  const ref = await addDoc(collection(db, 'notas'), {
    ...validated,
    docenteId,
    fecha: serverTimestamp(),
    creadoEn: serverTimestamp(),
  });
  return ref.id;
};

export const updateNota = async (
  notaId: string,
  nota: number,
): Promise<void> => {
  const parsed = z.number().min(1.0).max(7.0).parse(nota);
  await updateDoc(doc(db, 'notas', notaId), { nota: parsed });
};

export const groupNotasByAsignatura = (notas: Nota[]) => {
  const map = new Map<string, Nota[]>();

  notas.forEach(nota => {
    const existing = map.get(nota.asignatura) ?? [];
    map.set(nota.asignatura, [...existing, nota]);
  });

  return Array.from(map.entries()).map(([asignatura, asignaturNotas]) => ({
    asignatura,
    notas: asignaturNotas,
    promedio: calculateAverage(asignaturNotas.map(n => n.nota)),
  }));
};

export const getPromedioGeneral = (notas: Nota[]): number =>
  calculateAverage(notas.map(n => n.nota));
