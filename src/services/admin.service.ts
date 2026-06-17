import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Usuario, Curso, Asignatura } from '@/types';

// --- USUARIOS ---

export const fetchAllUsers = async (): Promise<Usuario[]> => {
  const querySnapshot = await getDocs(collection(db, 'usuarios'));
  return querySnapshot.docs.map(docSnapshot => ({
    uid: docSnapshot.id,
    ...docSnapshot.data(),
  })) as Usuario[];
};

export const createAdminUserProfile = async (
  uid: string,
  data: {
    nombre: string;
    email: string;
    rol: 'apoderado' | 'docente' | 'admin' | 'administrativo';
    cursos?: string[];
    alumnos?: string[];
  }
): Promise<void> => {
  await setDoc(doc(db, 'usuarios', uid), {
    ...data,
    cursos: data.cursos || [],
    alumnos: data.alumnos || [],
    primerLogin: false, // se marca como falso para acceso fácil en desarrollo
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
};

// --- CURSOS ---

export const fetchCursos = async (): Promise<Curso[]> => {
  const querySnapshot = await getDocs(collection(db, 'cursos'));
  return querySnapshot.docs.map(docSnapshot => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  })) as Curso[];
};

export const createCurso = async (id: string, nombre: string, nivel: string): Promise<void> => {
  await setDoc(doc(db, 'cursos', id), {
    nombre,
    nivel,
    docentes: [],
    alumnos: [],
    asignaturas: [],
    docentesAsignaturas: {},
    creadoEn: serverTimestamp(),
  });
};

// --- ASIGNATURAS ---

export const fetchAsignaturas = async (): Promise<Asignatura[]> => {
  const querySnapshot = await getDocs(collection(db, 'asignaturas'));
  return querySnapshot.docs.map(docSnapshot => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  })) as Asignatura[];
};

export const createAsignatura = async (id: string, nombre: string, departamento?: string): Promise<void> => {
  await setDoc(doc(db, 'asignaturas', id), {
    nombre,
    departamento: departamento || 'General',
    creadoEn: serverTimestamp(),
  });
};

// --- ASIGNACIONES ---

export const updateCursoDocenteJefe = async (cursoId: string, docenteJefeId: string | null): Promise<void> => {
  await updateDoc(doc(db, 'cursos', cursoId), {
    docenteJefeId: docenteJefeId || null,
  });
};

export const addAsignaturaToCurso = async (cursoId: string, asignaturaId: string): Promise<void> => {
  const cursoRef = doc(db, 'cursos', cursoId);
  const cursoDoc = await getDoc(cursoRef);
  if (!cursoDoc.exists()) {
    throw new Error('Curso no encontrado.');
  }
  const data = cursoDoc.data();
  const currentAsig = data.asignaturas || [];
  if (!currentAsig.includes(asignaturaId)) {
    await updateDoc(cursoRef, {
      asignaturas: [...currentAsig, asignaturaId],
    });
  }
};

export const removeAsignaturaFromCurso = async (cursoId: string, asignaturaId: string): Promise<void> => {
  const cursoRef = doc(db, 'cursos', cursoId);
  const cursoDoc = await getDoc(cursoRef);
  if (!cursoDoc.exists()) {
    throw new Error('Curso no encontrado.');
  }
  const data = cursoDoc.data();
  const currentAsig = data.asignaturas || [];
  const nextAsig = currentAsig.filter((id: string) => id !== asignaturaId);
  
  const currentDocentesAsig = data.docentesAsignaturas || {};
  const nextDocentesAsig = { ...currentDocentesAsig };
  delete nextDocentesAsig[asignaturaId];

  // Re-evaluar docentes de la lista
  const nextDocentes = Array.from(new Set(Object.values(nextDocentesAsig))) as string[];

  await updateDoc(cursoRef, {
    asignaturas: nextAsig,
    docentesAsignaturas: nextDocentesAsig,
    docentes: nextDocentes,
  });
};

export const assignDocenteToAsignatura = async (
  cursoId: string,
  asignaturaId: string,
  docenteId: string
): Promise<void> => {
  const cursoRef = doc(db, 'cursos', cursoId);
  const cursoDoc = await getDoc(cursoRef);
  if (!cursoDoc.exists()) {
    throw new Error('Curso no encontrado.');
  }
  const data = cursoDoc.data();
  const currentDocentesAsig = data.docentesAsignaturas || {};
  const currentDocentes = data.docentes || [];

  const nextDocentesAsig = {
    ...currentDocentesAsig,
    [asignaturaId]: docenteId,
  };

  const nextDocentes = Array.from(new Set([...currentDocentes, docenteId])) as string[];

  await updateDoc(cursoRef, {
    docentesAsignaturas: nextDocentesAsig,
    docentes: nextDocentes,
  });
};

export const fetchAllAlumnos = async (): Promise<any[]> => {
  const querySnapshot = await getDocs(collection(db, 'alumnos'));
  return querySnapshot.docs.map(docSnapshot => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
};

export const createAlumnoDoc = async (
  id: string,
  data: any
): Promise<void> => {
  await setDoc(doc(db, 'alumnos', id), {
    ...data,
    creadoEn: serverTimestamp(),
  });
};

export const fetchDepartamentos = async (): Promise<any[]> => {
  const querySnapshot = await getDocs(collection(db, 'departamentos'));
  return querySnapshot.docs.map(docSnapshot => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
};

export const createDepartamento = async (id: string, nombre: string): Promise<void> => {
  await setDoc(doc(db, 'departamentos', id), {
    nombre,
    creadoEn: serverTimestamp(),
  });
};
