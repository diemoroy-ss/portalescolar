export type UserRole = 'apoderado' | 'docente' | 'admin' | 'administrativo';

export type AttendanceStatus = 'presente' | 'ausente' | 'tardanza';

export type EventType = 'prueba' | 'tarea' | 'trabajo' | 'actividad' | 'otro';

export type DocumentType = 'certificado_alumno_regular' | 'autorizacion';

export type DocumentStatus = 'pendiente' | 'aprobado' | 'rechazado' | 'generado';

export type MessageStatus = 'enviado' | 'leido';

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

export interface Usuario {
  uid: string;
  nombre: string;
  email: string;
  rol: UserRole;
  cursos: string[];
  alumnos: string[];
  fcmToken?: string;
  primerLogin: boolean;
  creadoEn: FirestoreTimestamp;
  actualizadoEn: FirestoreTimestamp;
}

export interface Alumno {
  id: string;
  nombre: string;
  rut: string;
  cursoId: string;
  apoderados: string[];
  foto?: string;
  creadoEn: FirestoreTimestamp;

  // --- Información Personal y de Contacto ---
  fechaNacimiento?: string;
  edad?: number;
  nacionalidad?: string;
  nivelEnsenanza?: string;
  jornada?: string;
  establecimientoEducativo?: string;
  direccionDomicilio?: string;
  telefono?: string;
  email?: string;
  // Datos adicionales de apoderados
  apoderadoNombre?: string;
  apoderadoRut?: string;
  apoderadoProfesion?: string;
  apoderadoTelefonoEmergencia?: string;
  apoderadoEmail?: string;

  // --- Antecedentes Médicos ---
  enfermedadesCronicas?: string;
  alergias?: string;
  condicionSaludRelevante?: string;
  grupoSanguineo?: string;
  previsionSalud?: string;
  convenioAccidentes?: boolean;
  requierePie?: boolean;

  // --- Datos Familiares y Socioeducativos ---
  conQuienVive?: string;
  personasAutorizadasRetiro?: string;
  redApoyoNombres?: string;
  redApoyoContactos?: string;

  desactivado?: boolean;
}

export interface Curso {
  id: string;
  nombre: string;
  nivel: string;
  docentes: string[];
  alumnos: string[];
  docenteJefeId?: string;
  asignaturas?: string[];
  docentesAsignaturas?: Record<string, string>;
  creadoEn: FirestoreTimestamp;
}

export interface Asignatura {
  id: string;
  nombre: string;
  departamento?: string;
  creadoEn?: FirestoreTimestamp;
}

export interface Departamento {
  id: string;
  nombre: string;
  creadoEn?: FirestoreTimestamp;
}

export interface Evento {
  id: string;
  titulo: string;
  tipo: EventType;
  asignatura: string;
  fecha: FirestoreTimestamp;
  cursoId: string;
  descripcion: string;
  adjuntos: string[];
  creadoPor: string;
  creadoEn: FirestoreTimestamp;
}

export interface Nota {
  id: string;
  alumnoId: string;
  asignatura: string;
  evaluacion: string;
  nota: number;
  fecha: FirestoreTimestamp;
  docenteId: string;
  cursoId: string;
  creadoEn: FirestoreTimestamp;
}

export interface RegistroAsistencia {
  id: string;
  alumnoId: string;
  cursoId: string;
  fecha: FirestoreTimestamp;
  estado: AttendanceStatus;
  justificacion?: string;
  justificacionArchivo?: string;
  justificadoPor?: string;
  justificadoEn?: FirestoreTimestamp;
}

export interface Mensaje {
  id: string;
  de: string;
  para: string;
  asunto: string;
  cuerpo: string;
  leido: boolean;
  fecha: FirestoreTimestamp;
  alumnoId?: string;
}

export interface Aviso {
  id: string;
  titulo: string;
  cuerpo: string;
  destinatarios: string[];
  leidoPor: string[];
  fecha: FirestoreTimestamp;
  critico: boolean;
  publicadoPor: string;
}

export interface Documento {
  id: string;
  tipo: DocumentType;
  alumnoId: string;
  estado: DocumentStatus;
  fecha: FirestoreTimestamp;
  archivoUrl?: string;
  solicitadoPor: string;
  respuestaPor?: string;
  respuestaEn?: FirestoreTimestamp;
  comentario?: string;
}

export interface NotasPorAsignatura {
  asignatura: string;
  notas: Nota[];
  promedio: number;
}

export interface EstadisticasAsistencia {
  totalDias: number;
  presentes: number;
  ausentes: number;
  tardanzas: number;
  porcentajeAsistencia: number;
  superaLimite: boolean;
}

export interface BloqueHorario {
  id: string;
  horaInicio: string;
  horaFin: string;
  tipo: 'clase' | 'recreo';
  nombre?: string;
  diaSemana?: number;
}

export interface CeldaHorario {
  bloqueId: string;
  diaSemana: number;
  asignaturaId: string;
  docenteId: string;
  color?: string;
}
