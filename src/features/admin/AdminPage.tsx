import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import {
  fetchAllUsers,
  createAdminUserProfile,
  fetchCursos,
  createCurso,
  fetchAsignaturas,
  createAsignatura,
  updateCursoDocenteJefe,
  addAsignaturaToCurso,
  removeAsignaturaFromCurso,
  assignDocenteToAsignatura,
  fetchAllAlumnos,
  createAlumnoDoc,
  fetchDepartamentos,
  createDepartamento,
} from '@/services/admin.service';
import type { Usuario, Curso, Asignatura, Departamento } from '@/types';

import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { emailTemplates, type TemplateId } from '@/features/comunicacion/emailTemplates';

interface ComunicacionAdmin {
  id: string;
  tipo: 'mensaje' | 'aviso';
  asunto: string;
  cuerpo: string;
  remitente: string;
  remitenteUid: string;
  fecha: any;
  templateId: TemplateId;
  estado: 'enviado' | 'pendiente';
  cursosDestino?: string[];
  originalDoc: any;
}

type TabType = 'stats' | 'courses' | 'teachers' | 'students' | 'subjects' | 'departments' | 'comunicacion';

const fetchComunicaciones = async (): Promise<ComunicacionAdmin[]> => {
  const [mensajesSnap, avisosSnap] = await Promise.all([
    getDocs(collection(db, 'mensajes')),
    getDocs(collection(db, 'avisos')),
  ]);

  const msgs = mensajesSnap.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      tipo: 'mensaje',
      asunto: data.asunto || '',
      cuerpo: data.cuerpo || '',
      remitente: data.de || 'Sistema',
      remitenteUid: data.deUid || '',
      fecha: data.fecha,
      templateId: (data.templateId || 'clasico') as TemplateId,
      estado: data.estado || 'enviado',
      cursosDestino: data.cursosDestino || [],
      originalDoc: data,
    } as ComunicacionAdmin;
  });

  const avs = avisosSnap.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      tipo: 'aviso',
      asunto: data.titulo || '',
      cuerpo: data.cuerpo || '',
      remitente: data.publicadoPor || 'Sistema',
      remitenteUid: data.publicadoPorUid || '',
      fecha: data.fecha,
      templateId: (data.templateId || 'clasico') as TemplateId,
      estado: data.estado || 'enviado',
      cursosDestino: data.cursosDestino || [],
      originalDoc: data,
    } as ComunicacionAdmin;
  });

  return [...msgs, ...avs].sort((a, b) => {
    const tA = a.fecha?.seconds || 0;
    const tB = b.fecha?.seconds || 0;
    return tB - tA;
  });
};

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  
  // Data States
  const [users, setUsers] = useState<Usuario[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(false);

  // Communications State
  const [comunicaciones, setComunicaciones] = useState<ComunicacionAdmin[]>([]);
  const [comFiltering, setComFiltering] = useState({
    searchQuery: '',
    dateStart: '',
    dateEnd: '',
    tipoFilter: 'todos' as 'todos' | 'mensaje' | 'aviso',
  });
  const [selectedComDetail, setSelectedComDetail] = useState<ComunicacionAdmin | null>(null);
  const [editingCom, setEditingCom] = useState<ComunicacionAdmin | null>(null);
  const [editForm, setEditForm] = useState({
    asunto: '',
    cuerpo: '',
    templateId: 'clasico' as TemplateId,
    estado: 'enviado' as 'enviado' | 'pendiente',
  });
  const [isSavingCom, setIsSavingCom] = useState(false);

  // Modals
  const [isCursoModalOpen, setIsCursoModalOpen] = useState(false);
  const [isAsigModalOpen, setIsAsigModalOpen] = useState(false);
  const [isAlumnoModalOpen, setIsAlumnoModalOpen] = useState(false);
  const [isDeptoModalOpen, setIsDeptoModalOpen] = useState(false);
  const [isDocenteModalOpen, setIsDocenteModalOpen] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
  const [editingAlumno, setEditingAlumno] = useState<any>(null);

  // Form Fields
  const [cursoForm, setCursoForm] = useState({ id: '', nombre: '', nivel: 'Enseñanza Media' });
  const [asigForm, setAsigForm] = useState({ id: '', nombre: '', departamento: '' });
  const [alumnoForm, setAlumnoForm] = useState({
    id: '',
    nombre: '',
    rut: '',
    cursoId: '',
    apoderadoId: '',
    fechaNacimiento: '',
    nacionalidad: 'Chilena',
    nivelEnsenanza: 'Enseñanza Media',
    jornada: 'Completa',
    establecimientoEducativo: 'Colegio Montahue',
    direccionDomicilio: '',
    telefono: '',
    email: '',
    apoderadoNombre: '',
    apoderadoRut: '',
    apoderadoProfesion: '',
    apoderadoTelefonoEmergencia: '',
    apoderadoEmail: '',
    enfermedadesCronicas: '',
    alergias: '',
    condicionSaludRelevante: '',
    grupoSanguineo: 'O+',
    previsionSalud: 'Fonasa',
    convenioAccidentes: false,
    requierePie: false,
    conQuienVive: 'Ambos Padres',
    personasAutorizadasRetiro: '',
    redApoyoNombres: '',
    redApoyoContactos: '',
  });
  const [deptoForm, setDeptoForm] = useState({ id: '', nombre: '' });
  const [docenteForm, setDocenteForm] = useState({ nombre: '', email: '' });
  const [editAlumnoForm, setEditAlumnoForm] = useState({
    nombre: '',
    rut: '',
    cursoId: '',
    apoderadoId: '',
    nuevoApoderadoNombre: '',
    nuevoApoderadoEmail: '',
    fechaNacimiento: '',
    nacionalidad: 'Chilena',
    nivelEnsenanza: 'Enseñanza Media',
    jornada: 'Completa',
    establecimientoEducativo: 'Colegio Montahue',
    direccionDomicilio: '',
    telefono: '',
    email: '',
    apoderadoNombre: '',
    apoderadoRut: '',
    apoderadoProfesion: '',
    apoderadoTelefonoEmergencia: '',
    apoderadoEmail: '',
    enfermedadesCronicas: '',
    alergias: '',
    condicionSaludRelevante: '',
    grupoSanguineo: 'O+',
    previsionSalud: 'Fonasa',
    convenioAccidentes: false,
    requierePie: false,
    conQuienVive: 'Ambos Padres',
    personasAutorizadasRetiro: '',
    redApoyoNombres: '',
    redApoyoContactos: '',
  });
  const [newAsigToCursoId, setNewAsigToCursoId] = useState('');

  // Alumnos filters
  const [alumnoCursoFilter, setAlumnoCursoFilter] = useState('');
  const [alumnoNivelFilter, setAlumnoNivelFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, allCursos, allAsig, allAlumnos, allDeptos, allComms] = await Promise.all([
        fetchAllUsers(),
        fetchCursos(),
        fetchAsignaturas(),
        fetchAllAlumnos(),
        fetchDepartamentos(),
        fetchComunicaciones(),
      ]);
      setUsers(allUsers);
      setCursos(allCursos);
      setAsignaturas(allAsig);
      setAlumnos(allAlumnos);
      setDepartamentos(allDeptos);
      setComunicaciones(allComms);
    } catch (err: any) {
      toast.error('Error al cargar datos administrativos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCom = async (com: ComunicacionAdmin) => {
    if (!confirm('¿Seguro que deseas eliminar esta comunicación?')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, com.tipo === 'mensaje' ? 'mensajes' : 'avisos', com.id));
      toast.success('Comunicación eliminada correctamente.');
      const allComms = await fetchComunicaciones();
      setComunicaciones(allComms);
    } catch (err: any) {
      toast.error('Error al eliminar comunicación: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditComClick = (com: ComunicacionAdmin) => {
    setEditingCom(com);
    setEditForm({
      asunto: com.asunto,
      cuerpo: com.cuerpo,
      templateId: com.templateId,
      estado: com.estado,
    });
  };

  const handleUpdateCom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCom) return;
    if (!editForm.asunto.trim() || !editForm.cuerpo.trim()) {
      toast.error('Asunto y Cuerpo son requeridos.');
      return;
    }

    setIsSavingCom(true);
    try {
      const ref = doc(db, editingCom.tipo === 'mensaje' ? 'mensajes' : 'avisos', editingCom.id);
      if (editingCom.tipo === 'mensaje') {
        await updateDoc(ref, {
          asunto: editForm.asunto,
          cuerpo: editForm.cuerpo,
          templateId: editForm.templateId,
          estado: editForm.estado,
        });
      } else {
        await updateDoc(ref, {
          titulo: editForm.asunto,
          cuerpo: editForm.cuerpo,
          templateId: editForm.templateId,
          estado: editForm.estado,
        });
      }

      toast.success('Comunicación actualizada correctamente.');
      setEditingCom(null);
      const allComms = await fetchComunicaciones();
      setComunicaciones(allComms);
    } catch (err: any) {
      toast.error('Error al actualizar comunicación: ' + err.message);
    } finally {
      setIsSavingCom(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursoForm.nombre) {
      toast.error('Completa el nombre del curso.');
      return;
    }
    try {
      const generatedId = doc(collection(db, 'cursos')).id;
      await createCurso(generatedId, cursoForm.nombre, cursoForm.nivel);
      toast.success('Curso creado exitosamente.');
      setIsCursoModalOpen(false);
      setCursoForm({ id: '', nombre: '', nivel: 'Enseñanza Media' });
      loadData();
    } catch (err: any) {
      toast.error('Error al crear curso: ' + err.message);
    }
  };

  const handleCreateAsig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asigForm.nombre || !asigForm.departamento) {
      toast.error('Completa todos los campos obligatorios de la asignatura.');
      return;
    }
    try {
      const generatedId = doc(collection(db, 'asignaturas')).id;
      await createAsignatura(generatedId, asigForm.nombre, asigForm.departamento);
      toast.success('Asignatura creada exitosamente.');
      setIsAsigModalOpen(false);
      setAsigForm({ id: '', nombre: '', departamento: '' });
      loadData();
    } catch (err: any) {
      toast.error('Error al crear asignatura: ' + err.message);
    }
  };

  const handleCreateDepto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptoForm.nombre) {
      toast.error('Completa el nombre del departamento.');
      return;
    }
    try {
      const generatedId = doc(collection(db, 'departamentos')).id;
      await createDepartamento(generatedId, deptoForm.nombre);
      toast.success('Departamento académico creado.');
      setIsDeptoModalOpen(false);
      setDeptoForm({ id: '', nombre: '' });
      loadData();
    } catch (err: any) {
      toast.error('Error al crear departamento: ' + err.message);
    }
  };

  const calculateAge = (birthDateString: string): number => {
    if (!birthDateString) return 0;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : 0;
  };

  const handleCreateAlumno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumnoForm.nombre || !alumnoForm.rut || !alumnoForm.cursoId) {
      toast.error('Completa todos los campos obligatorios del alumno.');
      return;
    }
    try {
      const generatedId = doc(collection(db, 'alumnos')).id;
      const computedEdad = calculateAge(alumnoForm.fechaNacimiento);

      let finalApoderadoId = alumnoForm.apoderadoId;
      if (alumnoForm.apoderadoNombre.trim() && alumnoForm.apoderadoEmail.trim()) {
        const generatedUid = doc(collection(db, 'usuarios')).id;
        await createAdminUserProfile(generatedUid, {
          nombre: alumnoForm.apoderadoNombre.trim(),
          email: alumnoForm.apoderadoEmail.trim(),
          rol: 'apoderado',
        });
        finalApoderadoId = generatedUid;
      }

      await createAlumnoDoc(generatedId, {
        nombre: alumnoForm.nombre,
        rut: alumnoForm.rut,
        cursoId: alumnoForm.cursoId,
        apoderados: finalApoderadoId ? [finalApoderadoId] : [],
        fechaNacimiento: alumnoForm.fechaNacimiento,
        edad: computedEdad,
        nacionalidad: alumnoForm.nacionalidad,
        nivelEnsenanza: alumnoForm.nivelEnsenanza,
        jornada: alumnoForm.jornada,
        establecimientoEducativo: alumnoForm.establecimientoEducativo,
        direccionDomicilio: alumnoForm.direccionDomicilio,
        telefono: alumnoForm.telefono,
        email: alumnoForm.email,
        apoderadoNombre: alumnoForm.apoderadoNombre,
        apoderadoRut: alumnoForm.apoderadoRut,
        apoderadoProfesion: alumnoForm.apoderadoProfesion,
        apoderadoTelefonoEmergencia: alumnoForm.apoderadoTelefonoEmergencia,
        apoderadoEmail: alumnoForm.apoderadoEmail,
        enfermedadesCronicas: alumnoForm.enfermedadesCronicas,
        alergias: alumnoForm.alergias,
        condicionSaludRelevante: alumnoForm.condicionSaludRelevante,
        grupoSanguineo: alumnoForm.grupoSanguineo,
        previsionSalud: alumnoForm.previsionSalud,
        convenioAccidentes: alumnoForm.convenioAccidentes,
        requierePie: alumnoForm.requierePie,
        conQuienVive: alumnoForm.conQuienVive,
        personasAutorizadasRetiro: alumnoForm.personasAutorizadasRetiro,
        redApoyoNombres: alumnoForm.redApoyoNombres,
        redApoyoContactos: alumnoForm.redApoyoContactos,
      });

      toast.success('Alumno registrado correctamente.');
      setIsAlumnoModalOpen(false);
      setAlumnoForm({
        id: '',
        nombre: '',
        rut: '',
        cursoId: '',
        apoderadoId: '',
        fechaNacimiento: '',
        nacionalidad: 'Chilena',
        nivelEnsenanza: 'Enseñanza Media',
        jornada: 'Completa',
        establecimientoEducativo: 'Colegio Montahue',
        direccionDomicilio: '',
        telefono: '',
        email: '',
        apoderadoNombre: '',
        apoderadoRut: '',
        apoderadoProfesion: '',
        apoderadoTelefonoEmergencia: '',
        apoderadoEmail: '',
        enfermedadesCronicas: '',
        alergias: '',
        condicionSaludRelevante: '',
        grupoSanguineo: 'O+',
        previsionSalud: 'Fonasa',
        convenioAccidentes: false,
        requierePie: false,
        conQuienVive: 'Ambos Padres',
        personasAutorizadasRetiro: '',
        redApoyoNombres: '',
        redApoyoContactos: '',
      });
      loadData();
    } catch (err: any) {
      toast.error('Error al crear alumno: ' + err.message);
    }
  };

  const handleCreateDocente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docenteForm.nombre || !docenteForm.email) {
      toast.error('Nombre y Email son obligatorios.');
      return;
    }
    try {
      const generatedUid = doc(collection(db, 'usuarios')).id;
      await createAdminUserProfile(generatedUid, {
        nombre: docenteForm.nombre,
        email: docenteForm.email,
        rol: 'docente',
      });
      toast.success('Docente creado exitosamente.');
      setIsDocenteModalOpen(false);
      setDocenteForm({ nombre: '', email: '' });
      loadData();
    } catch (err: any) {
      toast.error('Error al crear docente: ' + err.message);
    }
  };

  const handleDeleteAlumno = async (al: any) => {
    if (!confirm(`¿Seguro que deseas eliminar al alumno ${al.nombre}?`)) return;
    try {
      setLoading(true);
      const [notasSnap, asistenciaSnap] = await Promise.all([
        getDocs(query(collection(db, 'notas'), where('alumnoId', '==', al.id))),
        getDocs(query(collection(db, 'asistencia'), where('alumnoId', '==', al.id))),
      ]);
      const hasData = !notasSnap.empty || !asistenciaSnap.empty;
      if (hasData) {
        await updateDoc(doc(db, 'alumnos', al.id), { desactivado: true });
        toast.success('El alumno tiene registros de notas/asistencia. Se desactivó su perfil.');
      } else {
        await deleteDoc(doc(db, 'alumnos', al.id));
        toast.success('Alumno eliminado completamente.');
      }
      loadData();
    } catch (err: any) {
      toast.error('Error al procesar eliminación: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAlumnoClick = (al: any) => {
    setEditingAlumno(al);
    setEditAlumnoForm({
      nombre: al.nombre,
      rut: al.rut || '',
      cursoId: al.cursoId || '',
      apoderadoId: al.apoderados?.[0] || '',
      nuevoApoderadoNombre: '',
      nuevoApoderadoEmail: '',
      fechaNacimiento: al.fechaNacimiento || '',
      nacionalidad: al.nacionalidad || 'Chilena',
      nivelEnsenanza: al.nivelEnsenanza || 'Enseñanza Media',
      jornada: al.jornada || 'Completa',
      establecimientoEducativo: al.establecimientoEducativo || 'Colegio Montahue',
      direccionDomicilio: al.direccionDomicilio || '',
      telefono: al.telefono || '',
      email: al.email || '',
      apoderadoNombre: al.apoderadoNombre || '',
      apoderadoRut: al.apoderadoRut || '',
      apoderadoProfesion: al.apoderadoProfesion || '',
      apoderadoTelefonoEmergencia: al.apoderadoTelefonoEmergencia || '',
      apoderadoEmail: al.apoderadoEmail || '',
      enfermedadesCronicas: al.enfermedadesCronicas || '',
      alergias: al.alergias || '',
      condicionSaludRelevante: al.condicionSaludRelevante || '',
      grupoSanguineo: al.grupoSanguineo || 'O+',
      previsionSalud: al.previsionSalud || 'Fonasa',
      convenioAccidentes: al.convenioAccidentes || false,
      requierePie: al.requierePie || false,
      conQuienVive: al.conQuienVive || 'Ambos Padres',
      personasAutorizadasRetiro: al.personasAutorizadasRetiro || '',
      redApoyoNombres: al.redApoyoNombres || '',
      redApoyoContactos: al.redApoyoContactos || '',
    });
  };

  const handleUpdateAlumno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlumno) return;
    if (!editAlumnoForm.nombre || !editAlumnoForm.cursoId) {
      toast.error('Nombre y Curso son requeridos.');
      return;
    }
    setLoading(true);
    try {
      let finalApoderadoId = editAlumnoForm.apoderadoId;
      if (editAlumnoForm.nuevoApoderadoNombre.trim() && editAlumnoForm.nuevoApoderadoEmail.trim()) {
        const generatedUid = doc(collection(db, 'usuarios')).id;
        await createAdminUserProfile(generatedUid, {
          nombre: editAlumnoForm.nuevoApoderadoNombre.trim(),
          email: editAlumnoForm.nuevoApoderadoEmail.trim(),
          rol: 'apoderado',
        });
        finalApoderadoId = generatedUid;
      }
      const computedEdad = calculateAge(editAlumnoForm.fechaNacimiento);
      await updateDoc(doc(db, 'alumnos', editingAlumno.id), {
        nombre: editAlumnoForm.nombre,
        rut: editAlumnoForm.rut,
        cursoId: editAlumnoForm.cursoId,
        apoderados: finalApoderadoId ? [finalApoderadoId] : [],
        fechaNacimiento: editAlumnoForm.fechaNacimiento,
        edad: computedEdad,
        nacionalidad: editAlumnoForm.nacionalidad,
        nivelEnsenanza: editAlumnoForm.nivelEnsenanza,
        jornada: editAlumnoForm.jornada,
        establecimientoEducativo: editAlumnoForm.establecimientoEducativo,
        direccionDomicilio: editAlumnoForm.direccionDomicilio,
        telefono: editAlumnoForm.telefono,
        email: editAlumnoForm.email,
        apoderadoNombre: editAlumnoForm.apoderadoNombre || (editAlumnoForm.nuevoApoderadoNombre.trim() || ''),
        apoderadoRut: editAlumnoForm.apoderadoRut,
        apoderadoProfesion: editAlumnoForm.apoderadoProfesion,
        apoderadoTelefonoEmergencia: editAlumnoForm.apoderadoTelefonoEmergencia,
        apoderadoEmail: editAlumnoForm.apoderadoEmail || (editAlumnoForm.nuevoApoderadoEmail.trim() || ''),
        enfermedadesCronicas: editAlumnoForm.enfermedadesCronicas,
        alergias: editAlumnoForm.alergias,
        condicionSaludRelevante: editAlumnoForm.condicionSaludRelevante,
        grupoSanguineo: editAlumnoForm.grupoSanguineo,
        previsionSalud: editAlumnoForm.previsionSalud,
        convenioAccidentes: editAlumnoForm.convenioAccidentes,
        requierePie: editAlumnoForm.requierePie,
        conQuienVive: editAlumnoForm.conQuienVive,
        personasAutorizadasRetiro: editAlumnoForm.personasAutorizadasRetiro,
        redApoyoNombres: editAlumnoForm.redApoyoNombres,
        redApoyoContactos: editAlumnoForm.redApoyoContactos,
      });
      toast.success('Alumno actualizado correctamente.');
      setEditingAlumno(null);
      loadData();
    } catch (err: any) {
      toast.error('Error al actualizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignJefe = async (cursoId: string, docenteId: string) => {
    try {
      await updateCursoDocenteJefe(cursoId, docenteId || null);
      toast.success('Profesor jefe asignado correctamente.');
      loadData();
      if (selectedCurso && selectedCurso.id === cursoId) {
        setSelectedCurso(prev => prev ? { ...prev, docenteJefeId: docenteId } : null);
      }
    } catch (err: any) {
      toast.error('Error al asignar profesor jefe: ' + err.message);
    }
  };

  const handleAddAsigToCurso = async (cursoId: string) => {
    if (!newAsigToCursoId) return;
    try {
      await addAsignaturaToCurso(cursoId, newAsigToCursoId);
      toast.success('Asignatura vinculada al curso.');
      loadData();
      
      if (selectedCurso && selectedCurso.id === cursoId) {
        setSelectedCurso(prev => {
          if (!prev) return null;
          const current = prev.asignaturas || [];
          return {
            ...prev,
            asignaturas: current.includes(newAsigToCursoId) ? current : [...current, newAsigToCursoId]
          };
        });
      }
      setNewAsigToCursoId('');
    } catch (err: any) {
      toast.error('Error al vincular asignatura: ' + err.message);
    }
  };

  const handleRemoveAsigFromCurso = async (cursoId: string, asigId: string) => {
    if (!confirm('¿Seguro que deseas desvincular esta asignatura?')) return;
    try {
      await removeAsignaturaFromCurso(cursoId, asigId);
      toast.success('Asignatura desvinculada del curso.');
      loadData();

      if (selectedCurso && selectedCurso.id === cursoId) {
        setSelectedCurso(prev => {
          if (!prev) return null;
          const current = prev.asignaturas || [];
          const currentDocentesAsig = prev.docentesAsignaturas || {};
          const nextDocentesAsig = { ...currentDocentesAsig };
          delete nextDocentesAsig[asigId];
          return {
            ...prev,
            asignaturas: current.filter(id => id !== asigId),
            docentesAsignaturas: nextDocentesAsig
          };
        });
      }
    } catch (err: any) {
      toast.error('Error al desvincular: ' + err.message);
    }
  };

  const handleAssignTeacherToSubject = async (cursoId: string, asigId: string, docenteId: string) => {
    try {
      await assignDocenteToAsignatura(cursoId, asigId, docenteId);
      toast.success('Profesor asignado a la asignatura.');
      loadData();

      if (selectedCurso && selectedCurso.id === cursoId) {
        setSelectedCurso(prev => {
          if (!prev) return null;
          const currentDocentesAsig = prev.docentesAsignaturas || {};
          return {
            ...prev,
            docentesAsignaturas: {
              ...currentDocentesAsig,
              [asigId]: docenteId
            }
          };
        });
      }
    } catch (err: any) {
      toast.error('Error al asignar docente: ' + err.message);
    }
  };

  const docentes = users.filter(u => u.rol === 'docente');
  // const administrativos = users.filter(u => u.rol === 'administrativo');

  // Horizontal Menu Tabs configuration
  const menuOptions = [
    { id: 'stats', label: 'Métricas', icon: '📊' },
    { id: 'courses', label: 'Cursos', icon: '🏫' },
    { id: 'teachers', label: 'Docentes', icon: '👩‍🏫' },
    { id: 'students', label: 'Alumnos', icon: '🎒' },
    { id: 'subjects', label: 'Asignaturas', icon: '📚' },
    { id: 'departments', label: 'Deptos', icon: '🏢' },
    { id: 'comunicacion', label: 'Comunicaciones', icon: '💬' },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto px-4 text-neutral-800 space-y-6">
      
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full" />
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          {/* Header Row: Title on the left, Horizontal Tabs on the right */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-neutral-200 gap-4">
            <div>
              <h1 className="text-xl font-bold font-heading text-neutral-900">Panel de Administración</h1>
              <p className="text-[11px] text-neutral-500">Colegio Montahue • Módulos de Gestión</p>
            </div>
            
            {/* Horizontal menu options */}
            <div className="flex bg-white p-1 rounded-xl border border-neutral-200 self-start md:self-auto gap-0.5 shadow-2xs">
              {menuOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setActiveTab(option.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-bold transition-all ${
                    activeTab === option.id
                      ? 'bg-primary-600 text-white shadow-glow-green'
                      : 'bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs">{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Tab Panel Content */}
          <div className="w-full">
            <AnimatePresence mode="wait">
              
              {/* METRICS */}
              {activeTab === 'stats' && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card variant="elevated" padding="sm" className="bg-white border border-neutral-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xs text-neutral-500 uppercase font-semibold">Total Cursos</p>
                          <p className="text-xl font-bold mt-1 text-primary-600">{cursos.length}</p>
                        </div>
                        <span className="text-lg">🏫</span>
                      </div>
                    </Card>
                    <Card variant="elevated" padding="sm" className="bg-white border border-neutral-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xs text-neutral-500 uppercase font-semibold">Total Docentes</p>
                          <p className="text-xl font-bold mt-1 text-accent">{docentes.length}</p>
                        </div>
                        <span className="text-lg">👩‍🏫</span>
                      </div>
                    </Card>
                    <Card variant="elevated" padding="sm" className="bg-white border border-neutral-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xs text-neutral-500 uppercase font-semibold">Total Alumnos</p>
                          <p className="text-xl font-bold mt-1 text-warning-500">{alumnos.length}</p>
                        </div>
                        <span className="text-lg">🎒</span>
                      </div>
                    </Card>
                    <Card variant="elevated" padding="sm" className="bg-white border border-neutral-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xs text-neutral-500 uppercase font-semibold">Departamentos</p>
                          <p className="text-xl font-bold mt-1 text-secondary-600">{departamentos.length}</p>
                        </div>
                        <span className="text-lg">🏢</span>
                      </div>
                    </Card>
                  </div>

                  <Card variant="default" className="bg-white border border-neutral-200">
                    <h3 className="text-sm font-bold text-neutral-800 mb-1">Bienvenido al Panel de Administración</h3>
                    <p className="text-xs text-neutral-500">
                      Utiliza las opciones horizontales en la parte superior derecha de esta sección para gestionar los cursos, docentes, alumnos, departamentos y asignaturas académicas. La administración de cuentas de usuario ha sido movida como una opción independiente en la barra lateral izquierda.
                    </p>
                  </Card>
                </motion.div>
              )}

              {/* COURSES */}
              {activeTab === 'courses' && (
                <motion.div
                  key="courses"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-neutral-600 uppercase tracking-wider">Gestión de Cursos</h2>
                    <Button size="sm" onClick={() => setIsCursoModalOpen(true)}>Crear Curso</Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {cursos.map(c => {
                      const jefe = users.find(u => u.uid === c.docenteJefeId);
                      return (
                        <Card key={c.id} variant="elevated" padding="md" className="space-y-4 bg-white border border-neutral-200">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-base font-bold text-neutral-800">{c.nombre}</h3>
                              <p className="text-2xs text-neutral-500">{c.nivel}</p>
                            </div>
                            <Badge variant="info">{c.id}</Badge>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center py-1.5 border-b border-neutral-100">
                              <span className="text-neutral-500">Profesor Jefe:</span>
                              <span className="font-semibold text-neutral-800">
                                {jefe ? jefe.nombre : 'Sin asignar'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-neutral-100">
                              <span className="text-neutral-500">Asignaturas:</span>
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-neutral-700 font-mono">
                                {c.asignaturas?.length || 0}
                              </span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedCurso(c)}
                            className="w-full text-primary-600 hover:bg-primary-50 text-center"
                          >
                            Configurar Asignaciones e Integrantes
                          </Button>
                        </Card>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* TEACHERS */}
              {activeTab === 'teachers' && (
                <motion.div
                  key="teachers"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-neutral-600 uppercase tracking-wider">Cuerpo Docente</h2>
                    <Button size="sm" onClick={() => setIsDocenteModalOpen(true)}>Agregar Docente</Button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {docentes.map(d => {
                      const cursosAsociados = cursos.filter(c => c.docentes?.includes(d.uid) || c.docenteJefeId === d.uid);
                      return (
                        <Card key={d.uid} variant="elevated" padding="md" className="space-y-3 bg-white border border-neutral-200">
                          <div>
                            <h3 className="text-sm font-bold text-neutral-800">{d.nombre}</h3>
                            <p className="text-xs text-neutral-500">{d.email}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-3xs font-semibold text-neutral-400 uppercase">Cursos asociados:</p>
                            {cursosAsociados.length === 0 ? (
                              <p className="text-2xs text-neutral-400">Sin cursos asociados.</p>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {cursosAsociados.map(c => (
                                  <Badge key={c.id} variant={c.docenteJefeId === d.uid ? 'danger' : 'success'}>
                                    {c.nombre} {c.docenteJefeId === d.uid ? '(Jefe)' : ''}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STUDENTS */}
              {activeTab === 'students' && (
                <motion.div
                  key="students"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200">
                    <h2 className="text-sm font-semibold text-neutral-600 uppercase tracking-wider">Gestión de Alumnos</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={alumnoNivelFilter}
                        onChange={e => setAlumnoNivelFilter(e.target.value)}
                        className="bg-white border border-neutral-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none text-neutral-800 font-semibold"
                      >
                        <option value="">Todos los Niveles</option>
                        <option value="Pre-Básica">Pre-Básica</option>
                        <option value="Enseñanza Básica">Enseñanza Básica</option>
                        <option value="Enseñanza Media">Enseñanza Media</option>
                      </select>
                      <select
                        value={alumnoCursoFilter}
                        onChange={e => setAlumnoCursoFilter(e.target.value)}
                        className="bg-white border border-neutral-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none text-neutral-800 font-semibold"
                      >
                        <option value="">Todos los Cursos</option>
                        {cursos.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                      <Button size="sm" onClick={() => setIsAlumnoModalOpen(true)}>Agregar Alumno</Button>
                    </div>
                  </div>

                  <Card variant="elevated" padding="none" className="overflow-x-auto bg-white border border-neutral-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-neutral-600 border-b border-neutral-200">
                          <th className="p-3 font-medium">Nombre</th>
                          <th className="p-3 font-medium">RUT</th>
                          <th className="p-3 font-medium">Curso</th>
                          <th className="p-3 font-medium">Apoderados</th>
                          <th className="p-3 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alumnos
                          .filter(al => al.desactivado !== true)
                          .filter(al => {
                            const curso = cursos.find(c => c.id === al.cursoId);
                            if (alumnoCursoFilter && al.cursoId !== alumnoCursoFilter) return false;
                            if (alumnoNivelFilter && curso?.nivel !== alumnoNivelFilter) return false;
                            return true;
                          })
                          .map(al => {
                            const curso = cursos.find(c => c.id === al.cursoId);
                            const apoderadoNames = al.apoderados?.map((uid: string) => {
                              const u = users.find(usr => usr.uid === uid);
                              return u ? `${u.nombre}` : uid;
                            }).join(', ') || 'Sin apoderado';

                            return (
                              <tr key={al.id} className="border-b border-neutral-100 hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-semibold text-neutral-850">{al.nombre}</td>
                                <td className="p-3 text-neutral-700 font-mono font-medium">{al.rut}</td>
                                <td className="p-3">
                                  <Badge variant="info" className="bg-purple-50 text-purple-700 border-purple-200 font-semibold shadow-2xs">
                                    {curso ? curso.nombre : al.cursoId}
                                  </Badge>
                                </td>
                                <td className="p-3 text-neutral-700 font-medium">
                                  {apoderadoNames}
                                </td>
                                <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                  <button
                                    onClick={() => handleEditAlumnoClick(al)}
                                    className="text-primary-600 hover:text-primary-800 font-semibold hover:underline text-xs"
                                  >
                                    Editar
                                  </button>
                                  <span className="text-neutral-300">|</span>
                                  <button
                                    onClick={() => handleDeleteAlumno(al)}
                                    className="text-danger-600 hover:text-danger-800 font-semibold hover:underline text-xs"
                                  >
                                    Eliminar
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </Card>
                </motion.div>
              )}

              {/* SUBJECTS */}
              {activeTab === 'subjects' && (
                <motion.div
                  key="subjects"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-neutral-600 uppercase tracking-wider">Asignaturas Globales</h2>
                    <Button size="sm" onClick={() => setIsAsigModalOpen(true)}>Crear Asignatura</Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {asignaturas.map(a => (
                      <Card key={a.id} variant="elevated" padding="sm" className="flex flex-col justify-between bg-white border border-neutral-200 space-y-2">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-neutral-800">{a.nombre}</h4>
                              <p className="text-[10px] text-neutral-500">{a.departamento}</p>
                            </div>
                            <Badge variant="neutral" className="font-mono text-[9px] shrink-0">{a.id}</Badge>
                          </div>

                          {/* Associated courses list */}
                          <div className="mt-2 border-t border-neutral-100 pt-2">
                            <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Cursos Vinculados:</span>
                            <div className="flex flex-wrap gap-1">
                              {cursos
                                .filter(c => (c.asignaturas || []).includes(a.id))
                                .map(c => (
                                  <Badge
                                    key={c.id}
                                    variant="info"
                                    className="text-[9px] px-1.5 py-0.5 flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200"
                                  >
                                    <span>{c.nombre}</span>
                                    <button
                                      onClick={async () => {
                                        if (!confirm(`¿Seguro que deseas desvincular esta asignatura del curso ${c.nombre}?`)) return;
                                        try {
                                          await removeAsignaturaFromCurso(c.id, a.id);
                                          toast.success('Asignatura desvinculada del curso.');
                                          // Refresh courses state
                                          const updatedCursos = cursos.map(cur => {
                                            if (cur.id === c.id) {
                                              return {
                                                ...cur,
                                                asignaturas: (cur.asignaturas || []).filter(id => id !== a.id)
                                              };
                                            }
                                            return cur;
                                          });
                                          setCursos(updatedCursos);
                                        } catch (err: any) {
                                          toast.error('Error al desvincular: ' + err.message);
                                        }
                                      }}
                                      className="text-danger-500 hover:text-danger-700 font-bold ml-0.5"
                                      title="Desvincular"
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                ))
                              }
                              {cursos.filter(c => (c.asignaturas || []).includes(a.id)).length === 0 && (
                                <span className="text-[10px] text-neutral-400 italic">Sin cursos vinculados</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Dropdown to link to a course */}
                        <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center">
                          <select
                            onChange={async (e) => {
                              const cursoId = e.target.value;
                              if (!cursoId) return;
                              try {
                                await addAsignaturaToCurso(cursoId, a.id);
                                toast.success('Asignatura vinculada al curso.');
                                // Refresh courses state
                                const updatedCursos = cursos.map(c => {
                                  if (c.id === cursoId) {
                                    return {
                                      ...c,
                                      asignaturas: [...(c.asignaturas || []), a.id]
                                    };
                                  }
                                  return c;
                                });
                                setCursos(updatedCursos);
                              } catch (err: any) {
                                toast.error('Error al vincular: ' + err.message);
                              }
                              e.target.value = '';
                            }}
                            className="w-full bg-neutral-50 border border-neutral-200 text-[10px] rounded-lg px-2 py-1 text-neutral-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                          >
                            <option value="">+ Vincular a Curso...</option>
                            {cursos
                              .filter(c => !(c.asignaturas || []).includes(a.id))
                              .map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                              ))
                            }
                          </select>
                        </div>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* DEPARTMENTS */}
              {activeTab === 'departments' && (
                <motion.div
                  key="departments"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-neutral-600 uppercase tracking-wider">Departamentos Académicos</h2>
                    <Button size="sm" onClick={() => setIsDeptoModalOpen(true)}>Crear Departamento</Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {departamentos.map(d => (
                      <Card key={d.id} variant="elevated" padding="sm" className="flex items-center justify-between bg-white border border-neutral-200">
                        <div>
                          <h4 className="text-xs font-bold text-neutral-800">{d.nombre}</h4>
                        </div>
                        <Badge variant="neutral" className="font-mono text-[9px]">{d.id}</Badge>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* COMMUNICATIONS (MENSAJES & AVISOS) */}
              {activeTab === 'comunicacion' && (
                <motion.div
                  key="comunicacion"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200">
                    <h2 className="text-sm font-semibold text-neutral-600 uppercase tracking-wider">Gestión de Comunicaciones</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
                      <input
                        type="text"
                        placeholder="Buscar por asunto/cuerpo..."
                        value={comFiltering.searchQuery}
                        onChange={e => setComFiltering({ ...comFiltering, searchQuery: e.target.value })}
                        className="bg-white border border-neutral-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none max-w-xs text-neutral-800 placeholder-neutral-400"
                      />
                      <select
                        value={comFiltering.tipoFilter}
                        onChange={e => setComFiltering({ ...comFiltering, tipoFilter: e.target.value as any })}
                        className="bg-white border border-neutral-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                      >
                        <option value="todos">Todos los Tipos</option>
                        <option value="mensaje">Mensajes Privados</option>
                        <option value="aviso">Avisos Públicos</option>
                      </select>
                      <div className="flex items-center gap-1">
                        <span className="text-3xs text-neutral-700 font-bold uppercase">Desde:</span>
                        <input
                          type="date"
                          value={comFiltering.dateStart}
                          onChange={e => setComFiltering({ ...comFiltering, dateStart: e.target.value })}
                          className="bg-white border border-neutral-350 text-xs rounded-lg px-2 py-1.5 focus:outline-none text-neutral-800 font-semibold"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-3xs text-neutral-700 font-bold uppercase">Hasta:</span>
                        <input
                          type="date"
                          value={comFiltering.dateEnd}
                          onChange={e => setComFiltering({ ...comFiltering, dateEnd: e.target.value })}
                          className="bg-white border border-neutral-350 text-xs rounded-lg px-2 py-1.5 focus:outline-none text-neutral-800 font-semibold"
                        />
                      </div>
                      {(comFiltering.searchQuery || comFiltering.dateStart || comFiltering.dateEnd || comFiltering.tipoFilter !== 'todos') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setComFiltering({ searchQuery: '', dateStart: '', dateEnd: '', tipoFilter: 'todos' })}
                          className="text-neutral-500 hover:text-neutral-900 text-2xs"
                        >
                          Limpiar
                        </Button>
                      )}
                    </div>
                  </div>

                  <Card variant="elevated" padding="none" className="overflow-x-auto bg-white border border-neutral-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-neutral-600 border-b border-neutral-200">
                          <th className="p-3 font-medium">Asunto / Título</th>
                          <th className="p-3 font-medium">Tipo</th>
                          <th className="p-3 font-medium">Remitente</th>
                          <th className="p-3 font-medium">Destinatarios</th>
                          <th className="p-3 font-medium">Fecha</th>
                          <th className="p-3 font-medium">Estado</th>
                          <th className="p-3 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comunicaciones.filter(com => {
                          if (comFiltering.searchQuery) {
                            const q = comFiltering.searchQuery.toLowerCase();
                            if (!com.asunto.toLowerCase().includes(q) && !com.cuerpo.toLowerCase().includes(q)) {
                              return false;
                            }
                          }
                          if (comFiltering.tipoFilter !== 'todos' && com.tipo !== comFiltering.tipoFilter) {
                            return false;
                          }
                          if (com.fecha) {
                            const comDate = com.fecha.toDate();
                            if (comFiltering.dateStart) {
                              const start = new Date(comFiltering.dateStart + 'T00:00:00');
                              if (comDate < start) return false;
                            }
                            if (comFiltering.dateEnd) {
                              const end = new Date(comFiltering.dateEnd + 'T23:59:59');
                              if (comDate > end) return false;
                            }
                          } else {
                            if (comFiltering.dateStart || comFiltering.dateEnd) return false;
                          }
                          return true;
                        }).length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-neutral-400">
                              No se encontraron comunicaciones.
                            </td>
                          </tr>
                        ) : (
                          comunicaciones.filter(com => {
                            if (comFiltering.searchQuery) {
                              const q = comFiltering.searchQuery.toLowerCase();
                              if (!com.asunto.toLowerCase().includes(q) && !com.cuerpo.toLowerCase().includes(q)) {
                                return false;
                              }
                            }
                            if (comFiltering.tipoFilter !== 'todos' && com.tipo !== comFiltering.tipoFilter) {
                              return false;
                            }
                            if (com.fecha) {
                              const comDate = com.fecha.toDate();
                              if (comFiltering.dateStart) {
                                const start = new Date(comFiltering.dateStart + 'T00:00:00');
                                if (comDate < start) return false;
                              }
                              if (comFiltering.dateEnd) {
                                const end = new Date(comFiltering.dateEnd + 'T23:59:59');
                                if (comDate > end) return false;
                              }
                            } else {
                              if (comFiltering.dateStart || comFiltering.dateEnd) return false;
                            }
                            return true;
                          }).map(com => {
                            const dateStr = com.fecha
                              ? new Date(com.fecha.seconds * 1000).toLocaleString('es-CL', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })
                              : 'Reciente';
                            
                            let destLabel = 'Varios';
                            if (com.tipo === 'mensaje') {
                              const destUser = users.find(u => u.uid === com.originalDoc.para);
                              destLabel = destUser ? `${destUser.nombre} (Apoderado)` : 'Apoderado';
                            } else {
                              destLabel = `Curso: ${renderCursosDestino(com.cursosDestino)}`;
                            }

                            return (
                              <tr key={com.id} className="border-b border-neutral-100 hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-medium text-neutral-800">
                                  <button
                                    onClick={() => setSelectedComDetail(com)}
                                    className="hover:underline text-left font-bold text-primary-700 hover:text-primary-800 focus:outline-none"
                                  >
                                    {com.asunto}
                                  </button>
                                </td>
                                <td className="p-3">
                                  <Badge variant={com.tipo === 'mensaje' ? 'info' : 'warning'} className={com.tipo === 'mensaje' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold shadow-2xs' : 'bg-amber-50 text-amber-700 border-amber-200 font-semibold shadow-2xs'}>
                                    {com.tipo === 'mensaje' ? 'Mensaje' : 'Aviso'}
                                  </Badge>
                                </td>
                                <td className="p-3 text-neutral-700 font-medium">{com.remitente}</td>
                                <td className="p-3 text-neutral-700 font-medium truncate max-w-[180px]" title={destLabel}>
                                  {destLabel}
                                </td>
                                <td className="p-3 text-slate-600 font-mono text-[11px] font-semibold">{dateStr}</td>
                                <td className="p-3">
                                  <Badge variant={com.estado === 'enviado' ? 'success' : 'neutral'} className={com.estado === 'enviado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold shadow-2xs' : 'bg-slate-100 text-slate-700 border-slate-200 font-semibold shadow-2xs'}>
                                    {com.estado === 'enviado' ? 'Enviado' : 'Pendiente'}
                                  </Badge>
                                </td>
                                <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                  <button
                                    onClick={() => handleEditComClick(com)}
                                    className="text-primary-600 hover:text-primary-800 font-medium hover:underline text-xs"
                                  >
                                    Editar
                                  </button>
                                  <span className="text-neutral-300">|</span>
                                  <button
                                    onClick={() => handleDeleteCom(com)}
                                    className="text-danger-600 hover:text-danger-800 font-medium hover:underline text-xs"
                                  >
                                    Eliminar
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </Card>
                </motion.div>
              )}
              
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* CURSO CREATION MODAL */}
      <Modal isOpen={isCursoModalOpen} onClose={() => setIsCursoModalOpen(false)} title="Crear Nuevo Curso">
        <form onSubmit={handleCreateCurso} className="space-y-4">
          <Input
            label="Nombre del Curso"
            placeholder="Ej: 2° Medio B"
            value={cursoForm.nombre}
            onChange={e => setCursoForm({ ...cursoForm, nombre: e.target.value })}
            required
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400">Nivel</label>
            <select
              value={cursoForm.nivel}
              onChange={e => setCursoForm({ ...cursoForm, nivel: e.target.value })}
              className="w-full bg-surface-2 border border-surface-3 text-sm rounded-xl px-3 py-2.5 text-neutral-200 focus:outline-none"
            >
              <option value="Pre-Básica">Pre-Básica</option>
              <option value="Enseñanza Básica">Enseñanza Básica</option>
              <option value="Enseñanza Media">Enseñanza Media</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-3 border-t border-neutral-800">
            <Button type="button" variant="ghost" onClick={() => setIsCursoModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Crear Curso</Button>
          </div>
        </form>
      </Modal>

      {/* ASIGNATURA CREATION MODAL */}
      <Modal isOpen={isAsigModalOpen} onClose={() => setIsAsigModalOpen(false)} title="Crear Asignatura Global">
        <form onSubmit={handleCreateAsig} className="space-y-4">
          <Input
            label="Nombre de Asignatura"
            placeholder="Ej: Física"
            value={asigForm.nombre}
            onChange={e => setAsigForm({ ...asigForm, nombre: e.target.value })}
            required
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 font-sans">Departamento Académico *</label>
            <select
              value={asigForm.departamento}
              onChange={e => setAsigForm({ ...asigForm, departamento: e.target.value })}
              className="w-full bg-surface-2 border border-surface-3 text-sm rounded-xl px-3 py-2.5 text-neutral-200 focus:outline-none"
              required
            >
              <option value="">Selecciona departamento...</option>
              {departamentos.map(dep => (
                <option key={dep.id} value={dep.nombre}>{dep.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-3 border-t border-neutral-800">
            <Button type="button" variant="ghost" onClick={() => setIsAsigModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Crear Asignatura</Button>
          </div>
        </form>
      </Modal>

      {/* DEPARTAMENTO CREATION MODAL */}
      <Modal isOpen={isDeptoModalOpen} onClose={() => setIsDeptoModalOpen(false)} title="Crear Departamento Académico">
        <form onSubmit={handleCreateDepto} className="space-y-4">
          <Input
            label="Nombre del Departamento"
            placeholder="Ej: Matemáticas"
            value={deptoForm.nombre}
            onChange={e => setDeptoForm({ ...deptoForm, nombre: e.target.value })}
            required
          />
          <div className="flex gap-2 justify-end pt-3 border-t border-neutral-800">
            <Button type="button" variant="ghost" onClick={() => setIsDeptoModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Crear Departamento</Button>
          </div>
        </form>
      </Modal>

      {/* ALUMNO CREATION MODAL */}
      <Modal isOpen={isAlumnoModalOpen} onClose={() => setIsAlumnoModalOpen(false)} title="Agregar Nuevo Alumno" size="xl">
        <form onSubmit={handleCreateAlumno} className="space-y-6 text-neutral-100">
          <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
            
            {/* SECCIÓN 1: Información Personal y Académica */}
            <fieldset className="border border-surface-3 rounded-xl p-4 space-y-4 bg-surface-2/30">
              <legend className="text-xs font-bold px-2 uppercase tracking-wider text-neutral-200">📋 1. Información Personal, Académica y Contacto</legend>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Nombre Completo del Alumno *"
                  placeholder="Ej: Benjamín Roy"
                  value={alumnoForm.nombre}
                  onChange={e => setAlumnoForm({ ...alumnoForm, nombre: e.target.value })}
                  required
                />
                <Input
                  label="RUT del Alumno *"
                  placeholder="Ej: 21.345.678-K"
                  value={alumnoForm.rut}
                  onChange={e => setAlumnoForm({ ...alumnoForm, rut: e.target.value })}
                  required
                />
                <Input
                  label="Fecha de Nacimiento"
                  type="date"
                  value={alumnoForm.fechaNacimiento}
                  onChange={e => setAlumnoForm({ ...alumnoForm, fechaNacimiento: e.target.value })}
                />
                <Input
                  label="Nacionalidad"
                  placeholder="Ej: Chilena"
                  value={alumnoForm.nacionalidad}
                  onChange={e => setAlumnoForm({ ...alumnoForm, nacionalidad: e.target.value })}
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400">Curso asignado *</label>
                  <select
                    value={alumnoForm.cursoId}
                    onChange={e => setAlumnoForm({ ...alumnoForm, cursoId: e.target.value })}
                    className="w-full bg-surface-1 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                    required
                  >
                    <option value="">Selecciona un curso...</option>
                    {cursos.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400">Nivel de Enseñanza</label>
                  <select
                    value={alumnoForm.nivelEnsenanza}
                    onChange={e => setAlumnoForm({ ...alumnoForm, nivelEnsenanza: e.target.value })}
                    className="w-full bg-surface-1 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                  >
                    <option value="Pre-Básica">Pre-Básica</option>
                    <option value="Enseñanza Básica">Enseñanza Básica</option>
                    <option value="Enseñanza Media">Enseñanza Media</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400">Jornada</label>
                  <select
                    value={alumnoForm.jornada}
                    onChange={e => setAlumnoForm({ ...alumnoForm, jornada: e.target.value })}
                    className="w-full bg-surface-1 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                  >
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Completa">Completa</option>
                  </select>
                </div>
                <Input
                  label="Establecimiento Educativo"
                  value={alumnoForm.establecimientoEducativo}
                  onChange={e => setAlumnoForm({ ...alumnoForm, establecimientoEducativo: e.target.value })}
                />
                <Input
                  label="Dirección de Domicilio"
                  placeholder="Ej: Av. Principal 123"
                  value={alumnoForm.direccionDomicilio}
                  onChange={e => setAlumnoForm({ ...alumnoForm, direccionDomicilio: e.target.value })}
                />
                <Input
                  label="Teléfono del Alumno"
                  placeholder="Ej: +56912345678"
                  value={alumnoForm.telefono}
                  onChange={e => setAlumnoForm({ ...alumnoForm, telefono: e.target.value })}
                />
                <Input
                  label="Correo del Alumno"
                  type="email"
                  placeholder="Ej: alumno@colegio.cl"
                  value={alumnoForm.email}
                  onChange={e => setAlumnoForm({ ...alumnoForm, email: e.target.value })}
                />
              </div>

              {/* Apoderados Sub-Group */}
              <div className="border-t border-neutral-200 pt-3 space-y-3">
                <h4 className="text-xs font-bold text-neutral-300 uppercase">Datos de los Padres o Apoderados</h4>
                
                <div className="space-y-1.5">
                  <label className="text-2xs font-semibold text-neutral-400">Vincular Cuenta de Apoderado Existente en el Sistema</label>
                  <select
                    value={alumnoForm.apoderadoId}
                    onChange={e => setAlumnoForm({ ...alumnoForm, apoderadoId: e.target.value })}
                    className="w-full bg-surface-1 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                  >
                    <option value="">Ninguna cuenta de usuario asociada</option>
                    {users.filter(u => u.rol === 'apoderado').map(ap => (
                      <option key={ap.uid} value={ap.uid}>{ap.nombre} ({ap.email})</option>
                    ))}
                  </select>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-surface-3"></div>
                  <span className="flex-shrink mx-4 text-primary-400 text-3xs font-bold uppercase">Datos del Apoderado Ficha</span>
                  <div className="flex-grow border-t border-surface-3"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    label="Nombre Completo Apoderado"
                    value={alumnoForm.apoderadoNombre}
                    onChange={e => setAlumnoForm({ ...alumnoForm, apoderadoNombre: e.target.value })}
                  />
                  <Input
                    label="RUT Apoderado"
                    value={alumnoForm.apoderadoRut}
                    onChange={e => setAlumnoForm({ ...alumnoForm, apoderadoRut: e.target.value })}
                  />
                  <Input
                    label="Profesión / Ocupación"
                    value={alumnoForm.apoderadoProfesion}
                    onChange={e => setAlumnoForm({ ...alumnoForm, apoderadoProfesion: e.target.value })}
                  />
                  <Input
                    label="Teléfono de Emergencia"
                    value={alumnoForm.apoderadoTelefonoEmergencia}
                    onChange={e => setAlumnoForm({ ...alumnoForm, apoderadoTelefonoEmergencia: e.target.value })}
                  />
                  <Input
                    label="Correo de Contacto Apoderado"
                    type="email"
                    value={alumnoForm.apoderadoEmail}
                    onChange={e => setAlumnoForm({ ...alumnoForm, apoderadoEmail: e.target.value })}
                  />
                </div>
              </div>
            </fieldset>

            {/* SECCIÓN 2: Antecedentes Médicos */}
            <fieldset className="border border-surface-3 rounded-xl p-4 space-y-4 bg-surface-2/30">
              <legend className="text-xs font-bold px-2 uppercase tracking-wider text-neutral-200">🏥 2. Antecedentes Médicos y Emergencias</legend>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Enfermedades Crónicas"
                  placeholder="Ej: Asma, Diabetes..."
                  value={alumnoForm.enfermedadesCronicas}
                  onChange={e => setAlumnoForm({ ...alumnoForm, enfermedadesCronicas: e.target.value })}
                />
                <Input
                  label="Alergias (Alimentos o Medicamentos)"
                  placeholder="Ej: Penicilina, Nueces..."
                  value={alumnoForm.alergias}
                  onChange={e => setAlumnoForm({ ...alumnoForm, alergias: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Condición Física o de Salud Relevante"
                  placeholder="Ej: Uso de lentes, plantilla..."
                  value={alumnoForm.condicionSaludRelevante}
                  onChange={e => setAlumnoForm({ ...alumnoForm, condicionSaludRelevante: e.target.value })}
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400">Grupo Sanguíneo</label>
                  <select
                    value={alumnoForm.grupoSanguineo}
                    onChange={e => setAlumnoForm({ ...alumnoForm, grupoSanguineo: e.target.value })}
                    className="w-full bg-surface-1 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                  >
                    <option value="O+">O Rh+</option>
                    <option value="O-">O Rh-</option>
                    <option value="A+">A Rh+</option>
                    <option value="A-">A Rh-</option>
                    <option value="B+">B Rh+</option>
                    <option value="B-">B Rh-</option>
                    <option value="AB+">AB Rh+</option>
                    <option value="AB-">AB Rh-</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400">Previsión de Salud</label>
                  <select
                    value={alumnoForm.previsionSalud}
                    onChange={e => setAlumnoForm({ ...alumnoForm, previsionSalud: e.target.value })}
                    className="w-full bg-surface-1 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                  >
                    <option value="Fonasa">Fonasa</option>
                    <option value="Isapre">Isapre</option>
                    <option value="Capredena">Capredena</option>
                    <option value="Particular">Particular</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-300">
                  <input
                    type="checkbox"
                    checked={alumnoForm.convenioAccidentes}
                    onChange={e => setAlumnoForm({ ...alumnoForm, convenioAccidentes: e.target.checked })}
                    className="rounded border-surface-3 text-primary-600 bg-surface-1"
                  />
                  <span>Tiene Convenio de Accidentes Escolares</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-300">
                  <input
                    type="checkbox"
                    checked={alumnoForm.requierePie}
                    onChange={e => setAlumnoForm({ ...alumnoForm, requierePie: e.target.checked })}
                    className="rounded border-surface-3 text-primary-600 bg-surface-1"
                  />
                  <span>Pertenece al Programa de Integración Escolar (PIE)</span>
                </label>
              </div>
            </fieldset>

            {/* SECCIÓN 3: Datos Familiares y Socioeducativos */}
            <fieldset className="border border-surface-3 rounded-xl p-4 space-y-4 bg-surface-2/30">
              <legend className="text-xs font-bold px-2 uppercase tracking-wider text-neutral-200">🏠 3. Datos Familiares y Socioeducativos</legend>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400">¿Con quién vive el estudiante?</label>
                  <select
                    value={alumnoForm.conQuienVive}
                    onChange={e => setAlumnoForm({ ...alumnoForm, conQuienVive: e.target.value })}
                    className="w-full bg-surface-1 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                  >
                    <option value="Ambos Padres">Ambos Padres</option>
                    <option value="Solo Madre">Solo Madre</option>
                    <option value="Solo Padre">Solo Padre</option>
                    <option value="Abuelos">Abuelos / Tíos</option>
                    <option value="Tutor Legal">Tutor Legal</option>
                  </select>
                </div>
                <Input
                  label="Personas autorizadas para retirar al estudiante"
                  placeholder="Nombres y RUT de personas autorizadas"
                  value={alumnoForm.personasAutorizadasRetiro}
                  onChange={e => setAlumnoForm({ ...alumnoForm, personasAutorizadasRetiro: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <Input
                  label="Red de Apoyo: Nombres de emergencia"
                  placeholder="Ej: Juan Pérez (Tío), Marta Rivas (Vecina)"
                  value={alumnoForm.redApoyoNombres}
                  onChange={e => setAlumnoForm({ ...alumnoForm, redApoyoNombres: e.target.value })}
                />
                <Input
                  label="Red de Apoyo: Contactos de emergencia"
                  placeholder="Ej: +56988888888, +56977777777"
                  value={alumnoForm.redApoyoContactos}
                  onChange={e => setAlumnoForm({ ...alumnoForm, redApoyoContactos: e.target.value })}
                />
              </div>
            </fieldset>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-surface-3">
            <Button type="button" variant="ghost" onClick={() => setIsAlumnoModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar Alumno</Button>
          </div>
        </form>
      </Modal>

      {/* COURSE DETAIL & ASSIGNMENT MODAL */}
      <Modal
        isOpen={selectedCurso !== null}
        onClose={() => setSelectedCurso(null)}
        title={`Asignaciones para: ${selectedCurso?.nombre || ''}`}
        size="lg"
      >
        {selectedCurso && (
          <div className="space-y-6 text-neutral-800">
            {/* Profesor Jefe Selection */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Profesor Jefe del Curso</h4>
              <select
                value={selectedCurso.docenteJefeId || ''}
                onChange={e => handleAssignJefe(selectedCurso.id, e.target.value)}
                className="w-full bg-surface-2 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-200 focus:outline-none"
              >
                <option value="">Sin Asignar</option>
                {docentes.map(d => (
                  <option key={d.uid} value={d.uid}>{d.nombre}</option>
                ))}
              </select>
            </div>

            <hr className="border-neutral-200" />

            {/* Link Subject to Course */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Vincular Asignatura al Curso</h4>
              <div className="flex gap-2">
                <select
                  value={newAsigToCursoId}
                  onChange={e => setNewAsigToCursoId(e.target.value)}
                  className="flex-1 bg-surface-2 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-200 focus:outline-none"
                >
                  <option value="">Selecciona asignatura global...</option>
                  {asignaturas
                    .filter(a => !(selectedCurso.asignaturas || []).includes(a.id))
                    .map(a => (
                      <option key={a.id} value={a.id}>{a.nombre} ({a.id})</option>
                    ))}
                </select>
                <Button size="sm" onClick={() => handleAddAsigToCurso(selectedCurso.id)} disabled={!newAsigToCursoId}>
                  Vincular
                </Button>
              </div>
            </div>

            {/* Associated Subjects and Teachers Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Asignaturas e Integrantes</h4>
              {(!selectedCurso.asignaturas || selectedCurso.asignaturas.length === 0) ? (
                <p className="text-xs text-neutral-400 py-4 text-center bg-slate-100 rounded-xl border border-dashed border-neutral-300">
                  Aún no se han vinculado asignaturas a este curso.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedCurso.asignaturas.map(asigId => {
                    const asig = asignaturas.find(a => a.id === asigId);
                    const activeDocenteId = (selectedCurso.docentesAsignaturas || {})[asigId] || '';
                    return (
                      <div key={asigId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-slate-50 border border-neutral-200 rounded-xl gap-2">
                        <div>
                          <p className="text-xs font-bold text-neutral-800">{asig ? asig.nombre : asigId}</p>
                          <span className="text-[10px] text-neutral-500 font-mono">{asigId}</span>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <select
                            value={activeDocenteId}
                            onChange={e => handleAssignTeacherToSubject(selectedCurso.id, asigId, e.target.value)}
                            className="bg-surface-2 border border-surface-3 text-2xs rounded-lg px-2 py-1 text-neutral-200 focus:outline-none flex-1 sm:flex-none"
                          >
                            <option value="">Sin Profesor</option>
                            {docentes.map(d => (
                              <option key={d.uid} value={d.uid}>{d.nombre}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleRemoveAsigFromCurso(selectedCurso.id, asigId)}
                            className="text-danger-500 hover:text-danger-400 p-1.5 hover:bg-danger-50 rounded-lg text-xs"
                            title="Quitar asignatura"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-200">
              <Button onClick={() => setSelectedCurso(null)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* COMMUNICATIONS DETAIL MODAL */}
      <Modal
        isOpen={selectedComDetail !== null}
        onClose={() => setSelectedComDetail(null)}
        title={`Detalle de Comunicación: ${selectedComDetail?.asunto || ''}`}
        size="xl"
      >
        {selectedComDetail && (
          <div className="space-y-4 text-neutral-800">
            <div className="flex justify-between items-center bg-slate-50 p-3 border border-neutral-200 rounded-xl text-xs text-neutral-600 gap-2 flex-wrap">
              <div>
                <strong>Tipo: </strong>
                <span className="capitalize">{selectedComDetail.tipo}</span>
              </div>
              <div>
                <strong>Remitente: </strong>
                <span>{selectedComDetail.remitente}</span>
              </div>
              <div>
                <strong>Estado: </strong>
                <Badge variant={selectedComDetail.estado === 'enviado' ? 'success' : 'neutral'}>
                  {selectedComDetail.estado}
                </Badge>
              </div>
              <div>
                <strong>Fecha: </strong>
                <span>
                  {selectedComDetail.fecha
                    ? new Date(selectedComDetail.fecha.seconds * 1000).toLocaleString()
                    : 'Reciente'}
                </span>
              </div>
            </div>

            <div className="border border-neutral-200 rounded-xl overflow-hidden h-[450px]">
              <iframe
                srcDoc={emailTemplates[selectedComDetail.templateId || 'clasico'].render({
                  asunto: selectedComDetail.asunto,
                  cuerpo: selectedComDetail.cuerpo,
                  remitente: selectedComDetail.remitente,
                  rolRemitente: 'REMITENTE',
                  nombreCurso: renderCursosDestino(selectedComDetail.cursosDestino),
                })}
                title="Vista Previa de Correo"
                className="w-full h-full bg-white"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-200">
              <Button onClick={() => setSelectedComDetail(null)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* COMMUNICATIONS EDIT MODAL */}
      <Modal
        isOpen={editingCom !== null}
        onClose={() => setEditingCom(null)}
        title="Editar Comunicación"
        size="xl"
      >
        {editingCom && (
          <form onSubmit={handleUpdateCom} className="space-y-5 text-neutral-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Asunto / Título
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.asunto}
                    onChange={e => setEditForm({ ...editForm, asunto: e.target.value })}
                    className="w-full text-sm bg-white border border-neutral-300 rounded-xl px-3 py-2 text-neutral-850 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Mensaje / Contenido
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={editForm.cuerpo}
                    onChange={e => setEditForm({ ...editForm, cuerpo: e.target.value })}
                    className="w-full text-sm bg-white border border-neutral-300 rounded-xl px-3 py-2 text-neutral-850 focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Estado
                  </label>
                  <select
                    value={editForm.estado}
                    onChange={e => setEditForm({ ...editForm, estado: e.target.value as any })}
                    className="w-full text-sm bg-white border border-neutral-300 rounded-xl px-3 py-2 text-neutral-850 focus:outline-none focus:border-primary-500"
                  >
                    <option value="enviado">Enviado (Activo/Visible)</option>
                    <option value="pendiente">Pendiente (Borrador)</option>
                  </select>
                </div>
              </div>

              {/* Template gallery & iframe preview */}
              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    Selecciona una Plantilla de Correo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(emailTemplates).map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, templateId: t.id })}
                        className={cn(
                          'p-2.5 text-left rounded-xl border transition-all text-xs flex flex-col justify-between h-20',
                          editForm.templateId === t.id
                            ? 'bg-primary-50 border-primary-500 text-primary-800 shadow-md font-semibold'
                            : 'border-neutral-200 text-neutral-500 hover:text-neutral-750 hover:bg-neutral-50'
                        )}
                      >
                        <span className="font-semibold block truncate">{t.name}</span>
                        <span className="text-[10px] text-neutral-400 line-clamp-2 leading-tight">
                          {t.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-[220px]">
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Vista Previa del Correo
                  </label>
                  <iframe
                    srcDoc={emailTemplates[editForm.templateId].render({
                      asunto: editForm.asunto || '[Ingresa un Asunto / Título]',
                      cuerpo: editForm.cuerpo || '[Escribe el cuerpo del correo aquí...]',
                      remitente: editingCom.remitente,
                      rolRemitente: 'DOCENTE',
                      nombreCurso: renderCursosDestino(editingCom.cursosDestino),
                    })}
                    title="Vista Previa de Correo"
                    className="w-full h-full rounded-xl border border-neutral-200 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingCom(null)}
                disabled={isSavingCom}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSavingCom}
                className="px-6"
              >
                {isSavingCom ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* DOCENTE CREATION MODAL */}
      <Modal isOpen={isDocenteModalOpen} onClose={() => setIsDocenteModalOpen(false)} title="Agregar Nuevo Docente">
        <form onSubmit={handleCreateDocente} className="space-y-4">
          <Input
            label="Nombre Completo"
            placeholder="Ej: María José"
            value={docenteForm.nombre}
            onChange={e => setDocenteForm({ ...docenteForm, nombre: e.target.value })}
            required
          />
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="Ej: maria.jose@colegio.cl"
            value={docenteForm.email}
            onChange={e => setDocenteForm({ ...docenteForm, email: e.target.value })}
            required
          />
          <div className="flex gap-2 justify-end pt-3 border-t border-surface-3">
            <Button type="button" variant="ghost" onClick={() => setIsDocenteModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar Docente</Button>
          </div>
        </form>
      </Modal>

      {/* ALUMNO EDIT MODAL */}
      <Modal isOpen={editingAlumno !== null} onClose={() => setEditingAlumno(null)} title="Editar Alumno" size="xl">
        {editingAlumno && (
          <form onSubmit={handleUpdateAlumno} className="space-y-6 text-neutral-100">
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
              
              {/* SECCIÓN 1: Información Personal y Contacto */}
              <fieldset className="border border-surface-3 rounded-xl p-4 space-y-4 bg-surface-2/30">
                <legend className="text-xs font-bold px-2 uppercase tracking-wider text-neutral-200">📋 1. Información Personal, Académica y Contacto</legend>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    label="Nombre Completo del Alumno *"
                    placeholder="Ej: Benjamín Roy"
                    value={editAlumnoForm.nombre}
                    onChange={e => setEditAlumnoForm({ ...editAlumnoForm, nombre: e.target.value })}
                    required
                  />
                  <Input
                    label="RUT del Alumno *"
                    placeholder="Ej: 21.345.678-K"
                    value={editAlumnoForm.rut}
                    onChange={e => setEditAlumnoForm({ ...editAlumnoForm, rut: e.target.value })}
                    required
                  />
                  <Input
                    label="Fecha de Nacimiento"
                    type="date"
                    value={editAlumnoForm.fechaNacimiento}
                    onChange={e => setEditAlumnoForm({ ...editAlumnoForm, fechaNacimiento: e.target.value })}
                  />
                  <Input
                    label="Nacionalidad"
                    value={editAlumnoForm.nacionalidad}
                    onChange={e => setEditAlumnoForm({ ...editAlumnoForm, nacionalidad: e.target.value })}
                  />
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-400">Curso asignado *</label>
                    <select
                      value={editAlumnoForm.cursoId}
                      onChange={e => setEditAlumnoForm({ ...editAlumnoForm, cursoId: e.target.value })}
                      className="w-full bg-surface-1 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                      required
                    >
                      <option value="">Selecciona un curso...</option>
                      {cursos.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-400">Nivel de Enseñanza</label>
                    <select
                      value={editAlumnoForm.nivelEnsenanza}
                      onChange={e => setEditAlumnoForm({ ...editAlumnoForm, nivelEnsenanza: e.target.value })}
                      className="w-full bg-surface-1 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                    >
                      <option value="Pre-Básica">Pre-Básica</option>
                      <option value="Enseñanza Básica">Enseñanza Básica</option>
                      <option value="Enseñanza Media">Enseñanza Media</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-400">Jornada</label>
                    <select
                      value={editAlumnoForm.jornada}
                      onChange={e => setEditAlumnoForm({ ...editAlumnoForm, jornada: e.target.value })}
                      className="w-full bg-surface-1 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                    >
                      <option value="Mañana">Mañana</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Completa">Completa</option>
                    </select>
                  </div>
                  <Input
                    label="Establecimiento Educativo"
                    value={editAlumnoForm.establecimientoEducativo}
                    onChange={e => setEditAlumnoForm({ ...editAlumnoForm, establecimientoEducativo: e.target.value })}
                  />
                  <Input
                    label="Dirección de Domicilio"
                    value={editAlumnoForm.direccionDomicilio}
                    onChange={e => setEditAlumnoForm({ ...editAlumnoForm, direccionDomicilio: e.target.value })}
                  />
                  <Input
                    label="Teléfono del Alumno"
                    value={editAlumnoForm.telefono}
                    onChange={e => setEditAlumnoForm({ ...editAlumnoForm, telefono: e.target.value })}
                  />
                  <Input
                    label="Correo del Alumno"
                    type="email"
                    value={editAlumnoForm.email}
                    onChange={e => setEditAlumnoForm({ ...editAlumnoForm, email: e.target.value })}
                  />
                </div>

                {/* Apoderados Sub-Group */}
                <div className="border-t border-neutral-200 pt-3 space-y-3">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase">Datos de los Padres o Apoderados</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-2xs font-semibold text-neutral-400">Vincular Cuenta de Apoderado Existente</label>
                    <select
                      value={editAlumnoForm.apoderadoId}
                      onChange={e => setEditAlumnoForm({ ...editAlumnoForm, apoderadoId: e.target.value })}
                      className="w-full bg-surface-1 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                    >
                      <option value="">Sin cuenta de usuario vinculada</option>
                      {users.filter(u => u.rol === 'apoderado').map(ap => (
                        <option key={ap.uid} value={ap.uid}>{ap.nombre} ({ap.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-surface-3"></div>
                    <span className="flex-shrink mx-4 text-primary-400 text-3xs font-bold uppercase">Datos del Apoderado Ficha</span>
                    <div className="flex-grow border-t border-surface-3"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      label="Nombre Completo Apoderado"
                      value={editAlumnoForm.apoderadoNombre}
                      onChange={e => setEditAlumnoForm({ ...editAlumnoForm, apoderadoNombre: e.target.value })}
                    />
                    <Input
                      label="RUT Apoderado"
                      value={editAlumnoForm.apoderadoRut}
                      onChange={e => setEditAlumnoForm({ ...editAlumnoForm, apoderadoRut: e.target.value })}
                    />
                    <Input
                      label="Profesión / Ocupación"
                      value={editAlumnoForm.apoderadoProfesion}
                      onChange={e => setEditAlumnoForm({ ...editAlumnoForm, apoderadoProfesion: e.target.value })}
                    />
                    <Input
                      label="Teléfono de Emergencia"
                      value={editAlumnoForm.apoderadoTelefonoEmergencia}
                      onChange={e => setEditAlumnoForm({ ...editAlumnoForm, apoderadoTelefonoEmergencia: e.target.value })}
                    />
                    <Input
                      label="Correo de Contacto Apoderado"
                      type="email"
                      value={editAlumnoForm.apoderadoEmail}
                      onChange={e => setEditAlumnoForm({ ...editAlumnoForm, apoderadoEmail: e.target.value })}
                    />
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-surface-3"></div>
                    <span className="flex-shrink mx-4 text-primary-400 text-3xs font-bold uppercase">O registrar apoderado nuevo en sistema</span>
                    <div className="flex-grow border-t border-surface-3"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Nuevo Nombre Apoderado (Usuario)"
                      placeholder="Ej: Juan Roy"
                      value={editAlumnoForm.nuevoApoderadoNombre}
                      onChange={e => setEditAlumnoForm({ ...editAlumnoForm, nuevoApoderadoNombre: e.target.value })}
                    />
                    <Input
                      label="Nuevo Email Apoderado (Usuario)"
                      placeholder="Ej: juan.roy@mail.com"
                      value={editAlumnoForm.nuevoApoderadoEmail}
                      onChange={e => setEditAlumnoForm({ ...editAlumnoForm, nuevoApoderadoEmail: e.target.value })}
                    />
                  </div>
                </div>
              </fieldset>

              {/* SECCIÓN 2: Antecedentes Médicos */}
              <fieldset className="border border-surface-3 rounded-xl p-4 space-y-4 bg-surface-2/30">
                <legend className="text-xs font-bold px-2 uppercase tracking-wider text-neutral-200">🏥 2. Antecedentes Médicos y Emergencias</legend>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Enfermedades Crónicas"
                    placeholder="Ej: Asma, Diabetes..."
                    value={editAlumnoForm.enfermedadesCronicas}
                    onChange={e => setEditAlumnoForm({ ...editAlumnoForm, enfermedadesCronicas: e.target.value })}
                  />
                  <Input
                    label="Alergias (Alimentos o Medicamentos)"
                    placeholder="Ej: Penicilina, Nueces..."
                    value={editAlumnoForm.alergias}
                    onChange={e => setEditAlumnoForm({ ...editAlumnoForm, alergias: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    label="Condición Física o de Salud Relevante"
                    value={editAlumnoForm.condicionSaludRelevante}
                    onChange={e => setEditAlumnoForm({ ...editAlumnoForm, condicionSaludRelevante: e.target.value })}
                  />
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-400">Grupo Sanguíneo</label>
                    <select
                      value={editAlumnoForm.grupoSanguineo}
                      onChange={e => setEditAlumnoForm({ ...editAlumnoForm, grupoSanguineo: e.target.value })}
                      className="w-full bg-surface-1 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                    >
                      <option value="O+">O Rh+</option>
                      <option value="O-">O Rh-</option>
                      <option value="A+">A Rh+</option>
                      <option value="A-">A Rh-</option>
                      <option value="B+">B Rh+</option>
                      <option value="B-">B Rh-</option>
                      <option value="AB+">AB Rh+</option>
                      <option value="AB-">AB Rh-</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-400">Previsión de Salud</label>
                    <select
                      value={editAlumnoForm.previsionSalud}
                      onChange={e => setEditAlumnoForm({ ...editAlumnoForm, previsionSalud: e.target.value })}
                      className="w-full bg-surface-1 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                    >
                      <option value="Fonasa">Fonasa</option>
                      <option value="Isapre">Isapre</option>
                      <option value="Capredena">Capredena</option>
                      <option value="Particular">Particular</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-300">
                    <input
                      type="checkbox"
                      checked={editAlumnoForm.convenioAccidentes}
                      onChange={e => setEditAlumnoForm({ ...editAlumnoForm, convenioAccidentes: e.target.checked })}
                      className="rounded border-surface-3 text-primary-600 bg-surface-1"
                    />
                    <span>Tiene Convenio de Accidentes Escolares</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-300">
                    <input
                      type="checkbox"
                      checked={editAlumnoForm.requierePie}
                      onChange={e => setEditAlumnoForm({ ...editAlumnoForm, requierePie: e.target.checked })}
                      className="rounded border-surface-3 text-primary-600 bg-surface-1"
                    />
                    <span>Pertenece al Programa de Integración Escolar (PIE)</span>
                  </label>
                </div>
              </fieldset>

              {/* SECCIÓN 3: Datos Familiares y Socioeducativos */}
              <fieldset className="border border-surface-3 rounded-xl p-4 space-y-4 bg-surface-2/30">
                <legend className="text-xs font-bold px-2 uppercase tracking-wider text-neutral-200">🏠 3. Datos Familiares y Socioeducativos</legend>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-400">¿Con quién vive el estudiante?</label>
                    <select
                      value={editAlumnoForm.conQuienVive}
                      onChange={e => setEditAlumnoForm({ ...editAlumnoForm, conQuienVive: e.target.value })}
                      className="w-full bg-surface-1 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                    >
                      <option value="Ambos Padres">Ambos Padres</option>
                      <option value="Solo Madre">Solo Madre</option>
                      <option value="Solo Padre">Solo Padre</option>
                      <option value="Abuelos">Abuelos / Tíos</option>
                      <option value="Tutor Legal">Tutor Legal</option>
                    </select>
                  </div>
                  <Input
                    label="Personas autorizadas para retirar al estudiante"
                    placeholder="Nombres y RUT de personas autorizadas"
                    value={editAlumnoForm.personasAutorizadasRetiro}
                    onChange={e => setEditAlumnoForm({ ...editAlumnoForm, personasAutorizadasRetiro: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <Input
                    label="Red de Apoyo: Nombres de emergencia"
                    placeholder="Ej: Juan Pérez (Tío), Marta Rivas (Vecina)"
                    value={editAlumnoForm.redApoyoNombres}
                    onChange={e => setEditAlumnoForm({ ...editAlumnoForm, redApoyoNombres: e.target.value })}
                  />
                  <Input
                    label="Red de Apoyo: Contactos de emergencia"
                    placeholder="Ej: +56988888888, +56977777777"
                    value={editAlumnoForm.redApoyoContactos}
                    onChange={e => setEditAlumnoForm({ ...editAlumnoForm, redApoyoContactos: e.target.value })}
                  />
                </div>
              </fieldset>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-surface-3">
              <Button type="button" variant="ghost" onClick={() => setEditingAlumno(null)}>Cancelar</Button>
              <Button type="submit">Guardar Cambios</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const renderCursosDestino = (cursosDestino?: string[]) => {
  if (!cursosDestino || cursosDestino.length === 0) return 'Sin especificar';
  return cursosDestino.map(cId => {
    if (cId === 'todos') return 'Todos los cursos';
    if (cId === 'nivel-pre-basica') return 'Pre-Básica';
    if (cId === 'nivel-basica') return 'Básica';
    if (cId === 'nivel-media') return 'Media';
    return cId;
  }).join(', ');
};
