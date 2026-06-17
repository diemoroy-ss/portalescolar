import { useEffect, useReducer, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Mensaje, Aviso } from '@/types';
import { emailTemplates, type TemplateId } from './emailTemplates';

// Extender tipos para incluir campos extras para enviados
export interface MensajeExt extends Mensaje {
  deUid?: string;
  templateId?: string;
  estado?: 'enviado' | 'pendiente';
  cursosDestino?: string[];
}

export interface AvisoExt extends Aviso {
  publicadoPorUid?: string;
  templateId?: string;
  estado?: 'enviado' | 'pendiente';
  cursosDestino?: string[];
}

interface MensajesState {
  mensajes: MensajeExt[];
  mensajesEnviados: MensajeExt[];
  avisos: AvisoExt[];
  avisosEnviados: AvisoExt[];
  isLoading: boolean;
  error: string | null;
}

type MensajesAction =
  | { type: 'SET_MENSAJES'; payload: MensajeExt[] }
  | { type: 'SET_MENSAJES_ENVIADOS'; payload: MensajeExt[] }
  | { type: 'SET_AVISOS'; payload: AvisoExt[] }
  | { type: 'SET_AVISOS_ENVIADOS'; payload: AvisoExt[] }
  | { type: 'SET_ERROR'; payload: string };

const mensajesReducer = (state: MensajesState, action: MensajesAction): MensajesState => {
  switch (action.type) {
    case 'SET_MENSAJES':          return { ...state, mensajes: action.payload, isLoading: false };
    case 'SET_MENSAJES_ENVIADOS': return { ...state, mensajesEnviados: action.payload, isLoading: false };
    case 'SET_AVISOS':            return { ...state, avisos: action.payload, isLoading: false };
    case 'SET_AVISOS_ENVIADOS':   return { ...state, avisosEnviados: action.payload, isLoading: false };
    case 'SET_ERROR':             return { ...state, error: action.payload, isLoading: false };
    default: return state;
  }
};

export const useMensajes = (uid: string) => {
  const [state, dispatch] = useReducer(mensajesReducer, {
    mensajes: [],
    mensajesEnviados: [],
    avisos: [],
    avisosEnviados: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!uid) {
      return;
    }

    // --- RECIBIDOS ---
    const mensajesQ = query(
      collection(db, 'mensajes'),
      where('para', '==', uid)
    );

    const avisosQ = query(
      collection(db, 'avisos'),
      where('destinatarios', 'array-contains', uid)
    );

    // --- ENVIADOS ---
    const mensajesEnviadosQ = query(
      collection(db, 'mensajes'),
      where('deUid', '==', uid)
    );

    const avisosEnviadosQ = query(
      collection(db, 'avisos'),
      where('publicadoPorUid', '==', uid)
    );

    const sortDocs = (docs: any[]) => {
      return [...docs].sort((a, b) => {
        const tA = a.fecha?.seconds || 0;
        const tB = b.fecha?.seconds || 0;
        return tB - tA;
      });
    };

    const unsub1 = onSnapshot(
      mensajesQ,
      snap => {
        const mapped = snap.docs.map(d => ({ id: d.id, ...d.data() })) as MensajeExt[];
        dispatch({ type: 'SET_MENSAJES', payload: sortDocs(mapped) });
      },
      err => dispatch({ type: 'SET_ERROR', payload: err.message }),
    );

    const unsub2 = onSnapshot(
      avisosQ,
      snap => {
        const mapped = snap.docs.map(d => ({ id: d.id, ...d.data() })) as AvisoExt[];
        dispatch({ type: 'SET_AVISOS', payload: sortDocs(mapped) });
      },
      err => dispatch({ type: 'SET_ERROR', payload: err.message }),
    );

    const unsub3 = onSnapshot(
      mensajesEnviadosQ,
      snap => {
        const mapped = snap.docs.map(d => ({ id: d.id, ...d.data() })) as MensajeExt[];
        dispatch({ type: 'SET_MENSAJES_ENVIADOS', payload: sortDocs(mapped) });
      },
      err => dispatch({ type: 'SET_ERROR', payload: err.message }),
    );

    const unsub4 = onSnapshot(
      avisosEnviadosQ,
      snap => {
        const mapped = snap.docs.map(d => ({ id: d.id, ...d.data() })) as AvisoExt[];
        dispatch({ type: 'SET_AVISOS_ENVIADOS', payload: sortDocs(mapped) });
      },
      err => dispatch({ type: 'SET_ERROR', payload: err.message }),
    );

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [uid]);

  const enviarComunicacion = useCallback(async ({
    tipo,
    asunto,
    cuerpo,
    deUid,
    deName,
    deRol,
    destino, // string[] conteniendo 'todos', niveles (e.g. 'nivel-media') o IDs de cursos individuales
    userCursos,
    isCritico = false,
    sendEmail = false,
    templateId = 'clasico',
    estado = 'enviado',
  }: {
    tipo: 'mensajes' | 'avisos';
    asunto: string;
    cuerpo: string;
    deUid: string;
    deName: string;
    deRol: string;
    destino: string[];
    userCursos: string[];
    isCritico?: boolean;
    sendEmail?: boolean;
    templateId?: TemplateId;
    estado?: 'enviado' | 'pendiente';
  }) => {
    const apoderadoUids = new Set<string>();
    const nombresCursosDestino: string[] = [];

    // 1. Resolver UIDs de apoderados
    if (destino.includes('todos')) {
      nombresCursosDestino.push('Todos los cursos');
      if (deRol === 'admin' || deRol === 'administrativo') {
        // Obtener todos los usuarios con rol 'apoderado'
        const usersQ = query(collection(db, 'usuarios'), where('rol', '==', 'apoderado'));
        const snap = await getDocs(usersQ);
        snap.forEach(d => apoderadoUids.add(d.id));
      } else {
        // Es docente, obtener apoderados de todos sus cursos asignados
        for (const cursoId of userCursos) {
          const alumnosQ = query(collection(db, 'alumnos'), where('cursoId', '==', cursoId));
          const snap = await getDocs(alumnosQ);
          snap.forEach(d => {
            const data = d.data();
            if (data.apoderados && Array.isArray(data.apoderados)) {
              data.apoderados.forEach((pUid: string) => apoderadoUids.add(pUid));
            }
          });
        }
      }
    } else {
      // Resolver por curso individual o nivel
      // Obtener todos los cursos para categorizar niveles
      const cursosQ = query(collection(db, 'cursos'));
      const cursosSnap = await getDocs(cursosQ);
      const todosCursosList = cursosSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      const cursosAQuery = new Set<string>();

      for (const dest of destino) {
        if (dest === 'nivel-pre-basica') {
          nombresCursosDestino.push('Pre-Básica');
          todosCursosList.forEach(c => {
            const level = (c.nivel || '').toLowerCase();
            if (level.includes('pre')) cursosAQuery.add(c.id);
          });
        } else if (dest === 'nivel-basica') {
          nombresCursosDestino.push('Básica');
          todosCursosList.forEach(c => {
            const level = (c.nivel || '').toLowerCase();
            if (level.includes('bas') && !level.includes('pre')) cursosAQuery.add(c.id);
          });
        } else if (dest === 'nivel-media') {
          nombresCursosDestino.push('Media');
          todosCursosList.forEach(c => {
            const level = (c.nivel || '').toLowerCase();
            if (level.includes('med')) cursosAQuery.add(c.id);
          });
        } else {
          // Curso individual
          cursosAQuery.add(dest);
          const cObj = todosCursosList.find(c => c.id === dest);
          if (cObj) nombresCursosDestino.push(cObj.nombre || dest);
        }
      }

      // Query apoderados para los cursos resueltos
      for (const cId of cursosAQuery) {
        // Si es docente, verificar que tenga asignado el curso
        if (deRol === 'docente' && !userCursos.includes(cId)) {
          continue;
        }

        const alumnosQ = query(collection(db, 'alumnos'), where('cursoId', '==', cId));
        const snap = await getDocs(alumnosQ);
        snap.forEach(d => {
          const data = d.data();
          if (data.apoderados && Array.isArray(data.apoderados)) {
            data.apoderados.forEach((pUid: string) => apoderadoUids.add(pUid));
          }
        });
      }
    }

    if (apoderadoUids.size === 0) {
      throw new Error('No se encontraron apoderados destinatarios para los destinos seleccionados.');
    }

    // 2. Guardar en Firestore
    if (tipo === 'mensajes') {
      const promises = Array.from(apoderadoUids).map(paraUid => {
        return addDoc(collection(db, 'mensajes'), {
          de: deName,
          deUid,
          para: paraUid,
          asunto,
          cuerpo,
          leido: false,
          fecha: serverTimestamp(),
          templateId,
          estado,
          cursosDestino: destino,
        });
      });
      await Promise.all(promises);
    } else {
      await addDoc(collection(db, 'avisos'), {
        titulo: asunto,
        cuerpo,
        destinatarios: Array.from(apoderadoUids),
        leidoPor: [],
        fecha: serverTimestamp(),
        critico: isCritico,
        publicadoPor: deName,
        publicadoPorUid: deUid,
        templateId,
        estado,
        cursosDestino: destino,
      });
    }

    // 3. Simular envío de correos si aplica (o si queremos imprimir el preview)
    if (sendEmail) {
      const template = emailTemplates[templateId];
      const htmlContent = template.render({
        asunto,
        cuerpo,
        remitente: deName,
        rolRemitente: deRol.toUpperCase(),
        nombreCurso: nombresCursosDestino.join(', '),
      });

      console.log(`[SIMULACIÓN DE CORREO] Enviado a ${apoderadoUids.size} apoderados. Template: ${template.name}`);
      console.log(`[HTML RENDEREADO]\n`, htmlContent);
    }

    return { totalDestinatarios: apoderadoUids.size };
  }, []);

  const marcarMensajeLeido = useCallback(async (mensajeId: string) => {
    await updateDoc(doc(db, 'mensajes', mensajeId), { leido: true });
  }, []);

  const marcarAvisoLeido = useCallback(async (avisoId: string, userUid: string) => {
    await updateDoc(doc(db, 'avisos', avisoId), {
      leidoPor: arrayUnion(userUid),
    });
  }, []);

  return { ...state, enviarComunicacion, marcarMensajeLeido, marcarAvisoLeido };
};
