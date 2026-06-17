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
  Timestamp,
} from 'firebase/firestore';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import type { RegistroAsistencia, AttendanceStatus, EstadisticasAsistencia } from '@/types';
import { ATTENDANCE_LIMIT_PERCENTAGE } from '@/utils/formatters';

const AttendanceRecordSchema = z.object({
  alumnoId: z.string().min(1),
  cursoId: z.string().min(1),
  fecha: z.instanceof(Date),
  estado: z.enum(['presente', 'ausente', 'tardanza']),
});

const JustificacionSchema = z.object({
  justificacion: z.string().min(1).max(500),
  justificacionArchivo: z.string().url().optional(),
});

type CreateAttendanceInput = z.input<typeof AttendanceRecordSchema>;

export const subscribeToAsistenciaByAlumno = (
  alumnoId: string,
  onData: (records: RegistroAsistencia[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const q = query(
    collection(db, 'asistencia'),
    where('alumnoId', '==', alumnoId),
    orderBy('fecha', 'desc'),
  );

  return onSnapshot(
    q,
    snapshot => {
      const records = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as RegistroAsistencia[];
      onData(records);
    },
    onError,
  );
};

export const subscribeToAsistenciaByCurso = (
  cursoId: string,
  fecha: Date,
  onData: (records: RegistroAsistencia[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const startOfDay = new Date(fecha);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(fecha);
  endOfDay.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, 'asistencia'),
    where('cursoId', '==', cursoId),
    where('fecha', '>=', Timestamp.fromDate(startOfDay)),
    where('fecha', '<=', Timestamp.fromDate(endOfDay)),
  );

  return onSnapshot(q, snapshot => {
    const records = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as RegistroAsistencia[];
    onData(records);
  }, onError);
};

export const createAsistenciaRecord = async (
  input: CreateAttendanceInput,
): Promise<string> => {
  const validated = AttendanceRecordSchema.parse(input);
  const ref = await addDoc(collection(db, 'asistencia'), {
    ...validated,
    fecha: Timestamp.fromDate(validated.fecha),
    creadoEn: serverTimestamp(),
  });
  return ref.id;
};

export const justificarInasistencia = async (
  registroId: string,
  input: z.input<typeof JustificacionSchema>,
  justificadoPor: string,
): Promise<void> => {
  const validated = JustificacionSchema.parse(input);
  await updateDoc(doc(db, 'asistencia', registroId), {
    ...validated,
    justificadoPor,
    justificadoEn: serverTimestamp(),
    estado: 'ausente' as AttendanceStatus,
  });
};

export const calcularEstadisticasAsistencia = (
  records: RegistroAsistencia[],
): EstadisticasAsistencia => {
  const totalDias = records.length;
  const presentes = records.filter(r => r.estado === 'presente').length;
  const ausentes = records.filter(r => r.estado === 'ausente').length;
  const tardanzas = records.filter(r => r.estado === 'tardanza').length;
  const porcentajeAsistencia = totalDias > 0 ? Math.round((presentes / totalDias) * 100) : 100;
  const porcentajeAusencias = 100 - porcentajeAsistencia;

  return {
    totalDias,
    presentes,
    ausentes,
    tardanzas,
    porcentajeAsistencia,
    superaLimite: porcentajeAusencias >= ATTENDANCE_LIMIT_PERCENTAGE,
  };
};
