import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';

// Horarios por defecto del Colegio Montahue
const DEFAULT_HORARIOS: Record<string, Array<{ hora: string; lunes: string; martes: string; miercoles: string; jueves: string; viernes: string }>> = {
  '1-medio-a': [
    { hora: '08:30 - 09:15', lunes: 'Matemáticas', martes: 'Lenguaje', miercoles: 'Ciencias', jueves: 'Historia', viernes: 'Inglés' },
    { hora: '09:15 - 10:00', lunes: 'Matemáticas', martes: 'Lenguaje', miercoles: 'Ciencias', jueves: 'Historia', viernes: 'Inglés' },
    { hora: '10:15 - 11:00', lunes: 'Historia', martes: 'Artes Visuales', miercoles: 'Matemáticas', jueves: 'Educación Física', viernes: 'Tecnología' },
    { hora: '11:00 - 11:45', lunes: 'Historia', martes: 'Artes Visuales', miercoles: 'Matemáticas', jueves: 'Educación Física', viernes: 'Orientación' },
    { hora: '12:00 - 12:45', lunes: 'Lenguaje', martes: 'Inglés', miercoles: 'Ciencias', jueves: 'Música', viernes: 'Matemáticas' },
    { hora: '12:45 - 13:30', lunes: 'Lenguaje', martes: 'Inglés', miercoles: 'Ciencias', jueves: 'Música', viernes: 'Talleres' },
  ]
};

const getHorario = (cursoId: string) => {
  return DEFAULT_HORARIOS[cursoId] || [
    { hora: '08:30 - 09:15', lunes: 'Lenguaje', martes: 'Matemáticas', miercoles: 'Historia', jueves: 'Ciencias', viernes: 'Inglés' },
    { hora: '09:15 - 10:00', lunes: 'Lenguaje', martes: 'Matemáticas', miercoles: 'Historia', jueves: 'Ciencias', viernes: 'Inglés' },
    { hora: '10:15 - 11:00', lunes: 'Ciencias', martes: 'Artes Visuales', miercoles: 'Educación Física', jueves: 'Matemáticas', viernes: 'Lenguaje' },
    { hora: '11:00 - 11:45', lunes: 'Ciencias', martes: 'Tecnología', miercoles: 'Educación Física', jueves: 'Matemáticas', viernes: 'Lenguaje' },
    { hora: '12:00 - 12:45', lunes: 'Inglés', martes: 'Música', miercoles: 'Matemáticas', jueves: 'Lenguaje', viernes: 'Orientación' },
    { hora: '12:45 - 13:30', lunes: 'Inglés', martes: 'Talleres', miercoles: 'Matemáticas', jueves: 'Lenguaje', viernes: 'Consejo Curso' },
  ];
};

export const ApoderadosPage: React.FC = () => {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState<'ficha' | 'personales'>('ficha');
  
  // Data States
  const [cursos, setCursos] = useState<any[]>([]);
  const [pupilos, setPupilos] = useState<any[]>([]);
  const [selectedCursoId, setSelectedCursoId] = useState('');
  const [selectedAlumnoId, setSelectedAlumnoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Modal y Detalle de Curso States
  const [isCursoModalOpen, setIsCursoModalOpen] = useState(false);
  const [cursoTab, setCursoTab] = useState<'horario' | 'companeros' | 'avisos'>('horario');
  const [companeros, setCompaneros] = useState<any[]>([]);
  const [loadingCompaneros, setLoadingCompaneros] = useState(false);
  const [avisosCurso, setAvisosCurso] = useState<any[]>([]);
  const [loadingAvisos, setLoadingAvisos] = useState(false);

  // Profile Form State
  const [formData, setFormData] = useState<any>({
    // Student Personal / Contact Info
    nombre: '',
    rut: '',
    fechaNacimiento: '',
    edad: 0,
    nacionalidad: '',
    nivelEnsenanza: '',
    jornada: '',
    establecimientoEducativo: '',
    direccionDomicilio: '',
    telefono: '',
    email: '',
    foto: '',
    
    // Datos del Titular
    apoderadoNombre: '',
    apoderadoRut: '',
    apoderadoParentesco: '',
    apoderadoTelefono: '',
    
    // Datos del Apoderado Suplente
    suplenteNombre: '',
    suplenteRut: '',
    suplenteParentesco: '',
    suplenteTelefono: '',

    // Datos del Padre
    padreApellidoPaterno: '',
    padreApellidoMaterno: '',
    padreNombres: '',
    padreRun: '',
    padreFechaNacimiento: '',
    padreEdad: 0,
    padreFonoParticular: '',
    padreDireccionParticular: '',
    padreEmpresa: '',
    padreFonoComercial: '',
    padreDireccionComercial: '',
    padreProfesion: '',
    padreCargo: '',
    padreEmail: '',

    // Datos de la Madre
    madreApellidoPaterno: '',
    madreApellidoMaterno: '',
    madreNombres: '',
    madreRun: '',
    madreFechaNacimiento: '',
    madreEdad: 0,
    madreFonoParticular: '',
    madreDireccionParticular: '',
    madreEmpresa: '',
    madreFonoComercial: '',
    madreDireccionComercial: '',
    madreProfesion: '',
    madreCargo: '',
    madreEmail: '',

    // Emergencia / Apoyo
    conQuienVive: '',
    personasAutorizadasRetiro: '',
    redApoyoNombres: '',
    redApoyoContactos: '',
  });

  const loadInitialData = async () => {
    if (!userData) return;
    setLoading(true);
    try {
      // Fetch Cursos
      const cursosSnap = await getDocs(collection(db, 'cursos'));
      const listCursos = cursosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCursos(listCursos);

      // Fetch Pupilos
      let pupilosQuery;
      if (userData.rol === 'admin') {
        // Admins can see all students to test
        pupilosQuery = query(collection(db, 'alumnos'), where('desactivado', '!=', true));
      } else {
        // Apoderados only see their assigned pupilos
        pupilosQuery = query(
          collection(db, 'alumnos'),
          where('apoderados', 'array-contains', userData.uid)
        );
      }
      const pupilosSnap = await getDocs(pupilosQuery);
      const listPupilos = pupilosSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as any));
      setPupilos(listPupilos);

      // Pre-select first student if available
      if (listPupilos.length > 0) {
        setSelectedAlumnoId(listPupilos[0].id);
        setSelectedCursoId(listPupilos[0].cursoId || '');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error al cargar pupilos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [userData]);

  useEffect(() => {
    if (!selectedAlumnoId) return;
    const currentAlumno = pupilos.find(p => p.id === selectedAlumnoId);
    if (currentAlumno) {
      setSelectedCursoId(currentAlumno.cursoId || '');
      setFormData({
        nombre: currentAlumno.nombre || '',
        rut: currentAlumno.rut || '',
        fechaNacimiento: currentAlumno.fechaNacimiento || '',
        edad: currentAlumno.edad || 0,
        nacionalidad: currentAlumno.nacionalidad || '',
        nivelEnsenanza: currentAlumno.nivelEnsenanza || '',
        jornada: currentAlumno.jornada || '',
        establecimientoEducativo: currentAlumno.establecimientoEducativo || '',
        direccionDomicilio: currentAlumno.direccionDomicilio || '',
        telefono: currentAlumno.telefono || '',
        email: currentAlumno.email || '',
        foto: currentAlumno.foto || '',
        
        apoderadoNombre: currentAlumno.apoderadoNombre || '',
        apoderadoRut: currentAlumno.apoderadoRut || '',
        apoderadoParentesco: currentAlumno.apoderadoParentesco || '',
        apoderadoTelefono: currentAlumno.apoderadoTelefono || '',
        
        suplenteNombre: currentAlumno.suplenteNombre || '',
        suplenteRut: currentAlumno.suplenteRut || '',
        suplenteParentesco: currentAlumno.suplenteParentesco || '',
        suplenteTelefono: currentAlumno.suplenteTelefono || '',

        padreApellidoPaterno: currentAlumno.padreApellidoPaterno || '',
        padreApellidoMaterno: currentAlumno.padreApellidoMaterno || '',
        padreNombres: currentAlumno.padreNombres || '',
        padreRun: currentAlumno.padreRun || '',
        padreFechaNacimiento: currentAlumno.padreFechaNacimiento || '',
        padreEdad: currentAlumno.padreEdad || 0,
        padreFonoParticular: currentAlumno.padreFonoParticular || '',
        padreDireccionParticular: currentAlumno.padreDireccionParticular || '',
        padreEmpresa: currentAlumno.padreEmpresa || '',
        padreFonoComercial: currentAlumno.padreFonoComercial || '',
        padreDireccionComercial: currentAlumno.padreDireccionComercial || '',
        padreProfesion: currentAlumno.padreProfesion || '',
        padreCargo: currentAlumno.padreCargo || '',
        padreEmail: currentAlumno.padreEmail || '',

        madreApellidoPaterno: currentAlumno.madreApellidoPaterno || '',
        madreApellidoMaterno: currentAlumno.madreApellidoMaterno || '',
        madreNombres: currentAlumno.madreNombres || '',
        madreRun: currentAlumno.madreRun || '',
        madreFechaNacimiento: currentAlumno.madreFechaNacimiento || '',
        madreEdad: currentAlumno.madreEdad || 0,
        madreFonoParticular: currentAlumno.madreFonoParticular || '',
        madreDireccionParticular: currentAlumno.madreDireccionParticular || '',
        madreEmpresa: currentAlumno.madreEmpresa || '',
        madreFonoComercial: currentAlumno.madreFonoComercial || '',
        madreDireccionComercial: currentAlumno.madreDireccionComercial || '',
        madreProfesion: currentAlumno.madreProfesion || '',
        madreCargo: currentAlumno.madreCargo || '',
        madreEmail: currentAlumno.madreEmail || '',

        conQuienVive: currentAlumno.conQuienVive || '',
        personasAutorizadasRetiro: currentAlumno.personasAutorizadasRetiro || '',
        redApoyoNombres: currentAlumno.redApoyoNombres || '',
        redApoyoContactos: currentAlumno.redApoyoContactos || '',
      });
    }
  }, [selectedAlumnoId, pupilos]);

  const fetchCursoDetails = async () => {
    if (!selectedCursoId) return;
    setLoadingCompaneros(true);
    setLoadingAvisos(true);
    try {
      // Fetch classmates
      const qCompaneros = query(
        collection(db, 'alumnos'),
        where('cursoId', '==', selectedCursoId),
        where('desactivado', '!=', true)
      );
      const snapCompaneros = await getDocs(qCompaneros);
      const listCompaneros = snapCompaneros.docs.map(d => ({ id: d.id, ...d.data() }));
      setCompaneros(listCompaneros);

      // Fetch alerts/announcements (avisos)
      const qAvisos = query(collection(db, 'avisos'));
      const snapAvisos = await getDocs(qAvisos);
      const listAvisos = snapAvisos.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((aviso: any) => {
          const matchesCurso = 
            (aviso.destinatarios && (aviso.destinatarios.includes(selectedCursoId) || aviso.destinatarios.includes(userData?.uid))) ||
            aviso.titulo.toLowerCase().includes(selectedCursoId.toLowerCase()) ||
            aviso.cuerpo.toLowerCase().includes(selectedCursoId.toLowerCase()) ||
            aviso.critico;
          return matchesCurso;
        });
      setAvisosCurso(listAvisos);
    } catch (err) {
      console.error('Error al cargar detalles del curso:', err);
    } finally {
      setLoadingCompaneros(false);
      setLoadingAvisos(false);
    }
  };

  useEffect(() => {
    if (isCursoModalOpen && selectedCursoId) {
      fetchCursoDetails();
    }
  }, [isCursoModalOpen, selectedCursoId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAlumnoId) return;

    // Validación de formato permitido
    const allowedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedFormats.includes(file.type)) {
      toast.error('Formato no permitido. Solo se permiten imágenes JPG, PNG y WEBP.');
      return;
    }

    // Validación de tamaño máximo (2 MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('La imagen es demasiado grande. El límite de tamaño es de 2 MB.');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `alumnos/${selectedAlumnoId}/foto_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Update student document in Firestore
      await updateDoc(doc(db, 'alumnos', selectedAlumnoId), {
        foto: downloadUrl,
      });

      setFormData((prev: any) => ({ ...prev, foto: downloadUrl }));
      toast.success('Imagen del alumno subida correctamente.');
      
      // Reload local data
      const updatedPupilos = pupilos.map(p => p.id === selectedAlumnoId ? { ...p, foto: downloadUrl } : p);
      setPupilos(updatedPupilos);
    } catch (err: any) {
      console.error(err);
      toast.error('Error al subir imagen: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlumnoId) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'alumnos', selectedAlumnoId), {
        ...formData,
      });
      toast.success('Datos actualizados correctamente.');
      // Update local state
      const updatedPupilos = pupilos.map(p => p.id === selectedAlumnoId ? { ...p, ...formData } : p);
      setPupilos(updatedPupilos);
    } catch (err: any) {
      console.error(err);
      toast.error('Error al guardar datos: ' + err.message);
    } finally {
      setLoading(false);
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

  return (
    <div className="max-w-6xl mx-auto px-4 text-neutral-800 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-neutral-200 gap-4">
        <div>
          <h1 className="text-xl font-bold font-heading text-neutral-900">Sección de Apoderados</h1>
          <p className="text-[11px] text-neutral-500">Gestión de fichas y datos personales de tus pupilos</p>
        </div>
 
        {/* Student Filter */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-neutral-500">Alumno a Cargo:</span>
            <select
              value={selectedAlumnoId}
              onChange={e => {
                const alumId = e.target.value;
                setSelectedAlumnoId(alumId);
                const alum = pupilos.find(p => p.id === alumId);
                if (alum) setSelectedCursoId(alum.cursoId || '');
              }}
              className="bg-transparent border-none text-xs text-neutral-800 font-semibold focus:outline-none"
            >
              <option value="">Selecciona un alumno...</option>
              {pupilos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
 
      {!selectedAlumnoId ? (
        <Card className="text-center py-20 bg-white border border-neutral-200">
          <span className="text-5xl">🎒</span>
          <h3 className="text-sm font-bold mt-3 text-neutral-700">Sin alumnos asociados</h3>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-1">Selecciona un alumno o contacta a la administración para vincular a tu pupilo.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left profile overview */}
          <Card className="lg:col-span-1 bg-white border border-neutral-200 p-5 flex flex-col items-center text-center space-y-4">
            <div className="relative group w-32 h-32 rounded-full overflow-hidden border border-neutral-200 shadow-sm">
              {formData.foto ? (
                <img src={formData.foto} alt="Foto alumno" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-5xl">🎒</div>
              )}
              <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span>{uploading ? 'Subiendo...' : 'Cambiar Foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-neutral-800">{formData.nombre}</h3>
              <p className="text-3xs text-neutral-500 font-mono mt-0.5">{formData.rut}</p>
              <button
                type="button"
                onClick={() => setIsCursoModalOpen(true)}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 hover:border-purple-300 transition-all cursor-pointer shadow-2xs group"
                title="Presiona para ver el horario, compañeros y avisos del curso"
              >
                <span>🏫 {cursos.find(c => c.id === selectedCursoId)?.nombre || 'Sin Curso'}</span>
                <svg className="h-3 w-3 text-purple-500 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="w-full border-t border-neutral-200 pt-3 flex gap-1">
              <button
                onClick={() => setActiveTab('ficha')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ficha'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                Ficha Pupilo
              </button>
              <button
                onClick={() => setActiveTab('personales')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'personales'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                Datos Personales
              </button>
            </div>
          </Card>

          {/* Right details forms */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSaveData} className="space-y-6">
              {activeTab === 'ficha' ? (
                <Card className="bg-white border border-neutral-200 p-5 space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-neutral-800">Ficha del Estudiante</h2>
                    <p className="text-[10px] text-neutral-500">Datos generales e identificación básica</p>
                  </div>

                  <fieldset className="border border-neutral-200 rounded-xl p-4 space-y-4">
                    <legend className="text-xs font-bold px-2 uppercase tracking-wider text-neutral-600">📋 Identificación del Estudiante</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label="Nombre Completo"
                        value={formData.nombre}
                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                        required
                      />
                      <Input
                        label="RUN / Identificación"
                        value={formData.rut}
                        onChange={e => setFormData({ ...formData, rut: e.target.value })}
                        required
                      />
                      <Input
                        label="Fecha de Nacimiento"
                        type="date"
                        value={formData.fechaNacimiento}
                        onChange={e => {
                          const date = e.target.value;
                          setFormData({ ...formData, fechaNacimiento: date, edad: calculateAge(date) });
                        }}
                      />
                      <Input
                        label="Edad"
                        type="number"
                        value={formData.edad}
                        disabled
                        className="cursor-not-allowed opacity-70"
                      />
                      <Input
                        label="Nacionalidad"
                        value={formData.nacionalidad}
                        onChange={e => setFormData({ ...formData, nacionalidad: e.target.value })}
                      />
                      <Select
                        label="Nivel de Enseñanza"
                        value={formData.nivelEnsenanza}
                        onChange={e => setFormData({ ...formData, nivelEnsenanza: e.target.value })}
                      >
                        <option value="">Seleccione...</option>
                        <option value="Pre-Básica">Pre-Básica</option>
                        <option value="Enseñanza Básica">Enseñanza Básica</option>
                        <option value="Enseñanza Media">Enseñanza Media</option>
                      </Select>
                      <Select
                        label="Jornada"
                        value={formData.jornada}
                        onChange={e => setFormData({ ...formData, jornada: e.target.value })}
                      >
                        <option value="">Seleccione...</option>
                        <option value="Mañana">Mañana</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Completa">Completa</option>
                      </Select>
                      <Input
                        label="Establecimiento Educativo"
                        value={formData.establecimientoEducativo}
                        onChange={e => setFormData({ ...formData, establecimientoEducativo: e.target.value })}
                      />
                      <Input
                        label="Dirección de Domicilio"
                        value={formData.direccionDomicilio}
                        onChange={e => setFormData({ ...formData, direccionDomicilio: e.target.value })}
                      />
                      <Input
                        label="Número de Teléfono"
                        value={formData.telefono}
                        onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                      />
                      <Input
                        label="Correo Electrónico"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </fieldset>

                  <fieldset className="border border-neutral-200 rounded-xl p-4 space-y-4">
                    <legend className="text-xs font-bold px-2 uppercase tracking-wider text-neutral-600">🏠 Composición Familiar y Red de Apoyo</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Select
                        label="¿Con quién vive el estudiante?"
                        value={formData.conQuienVive}
                        onChange={e => setFormData({ ...formData, conQuienVive: e.target.value })}
                      >
                        <option value="">Seleccione...</option>
                        <option value="Ambos Padres">Ambos Padres</option>
                        <option value="Solo Madre">Solo Madre</option>
                        <option value="Solo Padre">Solo Padre</option>
                        <option value="Abuelos">Abuelos / Tíos</option>
                        <option value="Tutor Legal">Tutor Legal</option>
                      </Select>
                      <Input
                        label="Personas autorizadas para retirarlo"
                        value={formData.personasAutorizadasRetiro}
                        onChange={e => setFormData({ ...formData, personasAutorizadasRetiro: e.target.value })}
                      />
                      <Input
                        label="Red de Apoyo (Emergencias): Nombres"
                        value={formData.redApoyoNombres}
                        onChange={e => setFormData({ ...formData, redApoyoNombres: e.target.value })}
                      />
                      <Input
                        label="Red de Apoyo (Emergencias): Contactos"
                        value={formData.redApoyoContactos}
                        onChange={e => setFormData({ ...formData, redApoyoContactos: e.target.value })}
                      />
                    </div>
                  </fieldset>

                  <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
                    <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Cambios'}</Button>
                  </div>
                </Card>
              ) : (
                <Card className="bg-white border border-neutral-200 p-5 space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-neutral-800">Identificación de Apoderados</h2>
                    <p className="text-[10px] text-neutral-500">Datos personales del apoderado titular, suplente, padre y madre</p>
                  </div>

                  {/* Datos del Titular */}
                  <fieldset className="border border-neutral-200 rounded-xl p-4 space-y-4">
                    <legend className="text-xs font-bold px-2 uppercase tracking-wider text-neutral-600">👤 Datos del Titular</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label="Nombre Titular"
                        value={formData.apoderadoNombre}
                        onChange={e => setFormData({ ...formData, apoderadoNombre: e.target.value })}
                      />
                      <Input
                        label="RUT Titular"
                        value={formData.apoderadoRut}
                        onChange={e => setFormData({ ...formData, apoderadoRut: e.target.value })}
                      />
                      <Input
                        label="Parentesco"
                        placeholder="Ej: Madre, Padre, Tía..."
                        value={formData.apoderadoParentesco}
                        onChange={e => setFormData({ ...formData, apoderadoParentesco: e.target.value })}
                      />
                      <Input
                        label="Teléfono de Contacto"
                        value={formData.apoderadoTelefono}
                        onChange={e => setFormData({ ...formData, apoderadoTelefono: e.target.value })}
                      />
                    </div>
                  </fieldset>

                  {/* Datos del Apoderado Suplente */}
                  <fieldset className="border border-neutral-200 rounded-xl p-4 space-y-4">
                    <legend className="text-xs font-bold px-2 uppercase tracking-wider text-neutral-600">👥 Datos del Apoderado Suplente</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label="Nombre Suplente"
                        value={formData.suplenteNombre}
                        onChange={e => setFormData({ ...formData, suplenteNombre: e.target.value })}
                      />
                      <Input
                        label="RUT Suplente"
                        value={formData.suplenteRut}
                        onChange={e => setFormData({ ...formData, suplenteRut: e.target.value })}
                      />
                      <Input
                        label="Parentesco"
                        value={formData.suplenteParentesco}
                        onChange={e => setFormData({ ...formData, suplenteParentesco: e.target.value })}
                      />
                      <Input
                        label="Teléfono"
                        value={formData.suplenteTelefono}
                        onChange={e => setFormData({ ...formData, suplenteTelefono: e.target.value })}
                      />
                    </div>
                  </fieldset>

                  {/* Datos del Padre */}
                  <fieldset className="border border-neutral-200 rounded-xl p-4 space-y-4">
                    <legend className="text-xs font-bold px-2 uppercase tracking-wider text-neutral-600">👨 Datos del Padre</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label="Nombres Padre"
                        value={formData.padreNombres}
                        onChange={e => setFormData({ ...formData, padreNombres: e.target.value })}
                      />
                      <Input
                        label="Apellido Paterno"
                        value={formData.padreApellidoPaterno}
                        onChange={e => setFormData({ ...formData, padreApellidoPaterno: e.target.value })}
                      />
                      <Input
                        label="Apellido Materno"
                        value={formData.padreApellidoMaterno}
                        onChange={e => setFormData({ ...formData, padreApellidoMaterno: e.target.value })}
                      />
                      <Input
                        label="RUN Padre"
                        value={formData.padreRun}
                        onChange={e => setFormData({ ...formData, padreRun: e.target.value })}
                      />
                      <Input
                        label="Fecha de Nacimiento"
                        type="date"
                        value={formData.padreFechaNacimiento}
                        onChange={e => {
                          const date = e.target.value;
                          setFormData({ ...formData, padreFechaNacimiento: date, padreEdad: calculateAge(date) });
                        }}
                      />
                      <Input
                        label="Edad"
                        type="number"
                        value={formData.padreEdad}
                        disabled
                        className="cursor-not-allowed opacity-70"
                      />
                      <Input
                        label="Fono Particular"
                        value={formData.padreFonoParticular}
                        onChange={e => setFormData({ ...formData, padreFonoParticular: e.target.value })}
                      />
                      <Input
                        label="Dirección Particular"
                        value={formData.padreDireccionParticular}
                        onChange={e => setFormData({ ...formData, padreDireccionParticular: e.target.value })}
                      />
                      <Input
                        label="Profesión / Escolaridad"
                        value={formData.padreProfesion}
                        onChange={e => setFormData({ ...formData, padreProfesion: e.target.value })}
                      />
                      <Input
                        label="Correo Electrónico Padre"
                        type="email"
                        value={formData.padreEmail}
                        onChange={e => setFormData({ ...formData, padreEmail: e.target.value })}
                        className="md:col-span-2"
                      />
                    </div>
                  </fieldset>

                  {/* Datos de la Madre */}
                  <fieldset className="border border-neutral-200 rounded-xl p-4 space-y-4">
                    <legend className="text-xs font-bold px-2 uppercase tracking-wider text-neutral-600">👩 Datos de la Madre</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label="Nombres Madre"
                        value={formData.madreNombres}
                        onChange={e => setFormData({ ...formData, madreNombres: e.target.value })}
                      />
                      <Input
                        label="Apellido Paterno"
                        value={formData.madreApellidoPaterno}
                        onChange={e => setFormData({ ...formData, madreApellidoPaterno: e.target.value })}
                      />
                      <Input
                        label="Apellido Materno"
                        value={formData.madreApellidoMaterno}
                        onChange={e => setFormData({ ...formData, madreApellidoMaterno: e.target.value })}
                      />
                      <Input
                        label="RUN Madre"
                        value={formData.madreRun}
                        onChange={e => setFormData({ ...formData, madreRun: e.target.value })}
                      />
                      <Input
                        label="Fecha de Nacimiento"
                        type="date"
                        value={formData.madreFechaNacimiento}
                        onChange={e => {
                          const date = e.target.value;
                          setFormData({ ...formData, madreFechaNacimiento: date, madreEdad: calculateAge(date) });
                        }}
                      />
                      <Input
                        label="Edad"
                        type="number"
                        value={formData.madreEdad}
                        disabled
                        className="cursor-not-allowed opacity-70"
                      />
                      <Input
                        label="Fono Particular"
                        value={formData.madreFonoParticular}
                        onChange={e => setFormData({ ...formData, madreFonoParticular: e.target.value })}
                      />
                      <Input
                        label="Dirección Particular"
                        value={formData.madreDireccionParticular}
                        onChange={e => setFormData({ ...formData, madreDireccionParticular: e.target.value })}
                      />
                      <Input
                        label="Profesión / Escolaridad"
                        value={formData.madreProfesion}
                        onChange={e => setFormData({ ...formData, madreProfesion: e.target.value })}
                      />
                      <Input
                        label="Correo Electrónico Madre"
                        type="email"
                        value={formData.madreEmail}
                        onChange={e => setFormData({ ...formData, madreEmail: e.target.value })}
                        className="md:col-span-2"
                      />
                    </div>
                  </fieldset>

                  <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
                    <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Cambios'}</Button>
                  </div>
                </Card>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Course Details Modal */}
      <Modal
        isOpen={isCursoModalOpen}
        onClose={() => setIsCursoModalOpen(false)}
        title={`Información del Curso: ${cursos.find(c => c.id === selectedCursoId)?.nombre || 'Sin Curso'}`}
        size="lg"
      >
        <div className="space-y-6 text-neutral-100">
          {/* Navigation Tabs */}
          <div className="flex border-b border-surface-3 gap-1">
            <button
              type="button"
              onClick={() => setCursoTab('horario')}
              className={`pb-2.5 px-4 text-xs font-semibold transition-all border-b-2 ${
                cursoTab === 'horario'
                  ? 'border-primary-500 text-primary-400 font-bold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              📅 Horario de Clases
            </button>
            <button
              type="button"
              onClick={() => setCursoTab('companeros')}
              className={`pb-2.5 px-4 text-xs font-semibold transition-all border-b-2 ${
                cursoTab === 'companeros'
                  ? 'border-primary-500 text-primary-400 font-bold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              👥 Compañeros de Curso
            </button>
            <button
              type="button"
              onClick={() => setCursoTab('avisos')}
              className={`pb-2.5 px-4 text-xs font-semibold transition-all border-b-2 ${
                cursoTab === 'avisos'
                  ? 'border-primary-500 text-primary-400 font-bold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              🔔 Comunicados ({avisosCurso.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[250px]">
            {cursoTab === 'horario' && (
              <div className="overflow-x-auto rounded-xl border border-surface-3 bg-surface-2/40">
                <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                  <thead>
                    <tr className="bg-surface-3/80 border-b border-surface-3 text-neutral-300">
                      <th className="p-3 font-semibold">Hora</th>
                      <th className="p-3 font-semibold">Lunes</th>
                      <th className="p-3 font-semibold">Martes</th>
                      <th className="p-3 font-semibold">Miércoles</th>
                      <th className="p-3 font-semibold">Jueves</th>
                      <th className="p-3 font-semibold">Viernes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-3 text-neutral-200">
                    {getHorario(selectedCursoId).map((row, index) => (
                      <tr key={index} className="hover:bg-surface-3/30 transition-colors">
                        <td className="p-3 font-medium text-neutral-400 bg-surface-3/10 font-mono">{row.hora}</td>
                        <td className="p-3">{row.lunes}</td>
                        <td className="p-3">{row.martes}</td>
                        <td className="p-3">{row.miercoles}</td>
                        <td className="p-3">{row.jueves}</td>
                        <td className="p-3">{row.viernes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {cursoTab === 'companeros' && (
              <div>
                {loadingCompaneros ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full" />
                  </div>
                ) : companeros.length === 0 ? (
                  <p className="text-center py-10 text-xs text-neutral-400">No se encontraron otros compañeros matriculados.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {companeros.map(c => (
                      <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-2/30 border border-surface-3/60 hover:border-surface-3 transition-colors">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-surface-3 bg-surface-3 flex items-center justify-center">
                          {c.foto ? (
                            <img src={c.foto} alt={c.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm">🎒</span>
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-neutral-100 truncate">{c.nombre}</p>
                          <p className="text-[10px] text-neutral-400 font-mono truncate">{c.rut}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {cursoTab === 'avisos' && (
              <div>
                {loadingAvisos ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full" />
                  </div>
                ) : avisosCurso.length === 0 ? (
                  <div className="text-center py-10 text-xs text-neutral-400 space-y-2">
                    <p>No hay avisos recientes dirigidos a este curso.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {avisosCurso.map(a => (
                      <div key={a.id} className={`p-4 rounded-xl border transition-colors ${
                        a.critico 
                          ? 'bg-danger-900/10 border-danger-900/35 hover:bg-danger-900/15' 
                          : 'bg-surface-2/30 border-surface-3 hover:bg-surface-2/45'
                      }`}>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            a.critico ? 'bg-danger-500/15 text-danger-400' : 'bg-surface-3 text-neutral-300'
                          }`}>
                            {a.critico ? 'Crítico ⚠️' : 'Informativo'}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {a.fecha?.toDate ? new Date(a.fecha.toDate()).toLocaleDateString() : 'Reciente'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-neutral-100">{a.titulo}</h4>
                        <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed whitespace-pre-wrap">{a.cuerpo}</p>
                        {a.publicadoPor && (
                          <p className="text-[9px] text-neutral-500 mt-2 text-right italic">— {a.publicadoPor}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
