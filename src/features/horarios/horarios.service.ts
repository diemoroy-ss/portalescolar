import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BloqueHorario, CeldaHorario } from '@/types';

const CONFIGURACION_COLLECTION = 'configuracion';
const HORARIOS_DOC_ID = 'horarios';
const HORARIOS_COLLECTION = 'horarios';

export const getBloquesHorarios = async (): Promise<BloqueHorario[]> => {
  try {
    const docRef = doc(db, CONFIGURACION_COLLECTION, HORARIOS_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().bloques as BloqueHorario[] || [];
    }
    // Return default blocks if not found
    return [
      { id: 'b1', horaInicio: '08:15', horaFin: '09:00', tipo: 'clase' },
      { id: 'b2', horaInicio: '09:00', horaFin: '09:45', tipo: 'clase' },
      { id: 'b3', horaInicio: '09:45', horaFin: '10:00', tipo: 'recreo', nombre: 'Recreo' },
      { id: 'b4', horaInicio: '10:00', horaFin: '10:45', tipo: 'clase' },
      { id: 'b5', horaInicio: '10:45', horaFin: '11:30', tipo: 'clase' },
      { id: 'b6', horaInicio: '11:30', horaFin: '11:45', tipo: 'recreo', nombre: 'Recreo' },
      { id: 'b7', horaInicio: '11:45', horaFin: '12:30', tipo: 'clase' },
      { id: 'b8', horaInicio: '12:30', horaFin: '13:15', tipo: 'clase' },
    ];
  } catch (error) {
    console.error('Error fetching bloques horarios:', error);
    return [];
  }
};

export const saveBloquesHorarios = async (bloques: BloqueHorario[]): Promise<void> => {
  try {
    const docRef = doc(db, CONFIGURACION_COLLECTION, HORARIOS_DOC_ID);
    await setDoc(docRef, { bloques });
  } catch (error) {
    console.error('Error saving bloques horarios:', error);
    throw error;
  }
};

export interface HorarioData {
  celdas: CeldaHorario[];
  bloquesExtra?: BloqueHorario[];
}

export const getHorarioCurso = async (cursoId: string): Promise<HorarioData> => {
  try {
    const docRef = doc(db, HORARIOS_COLLECTION, cursoId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        celdas: data.celdas as CeldaHorario[] || [],
        bloquesExtra: data.bloquesExtra as BloqueHorario[] || []
      };
    }
    return { celdas: [], bloquesExtra: [] };
  } catch (error) {
    console.error('Error fetching horario curso:', error);
    return { celdas: [], bloquesExtra: [] };
  }
};

export const saveHorarioCurso = async (cursoId: string, data: HorarioData): Promise<void> => {
  try {
    const docRef = doc(db, HORARIOS_COLLECTION, cursoId);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error('Error saving horario curso:', error);
    throw error;
  }
};
