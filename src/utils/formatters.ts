export const getGradeColor = (nota: number): string => {
  if (nota >= 6.0) {
    return 'nota-excelente';
  }
  if (nota >= 5.0) {
    return 'nota-buena';
  }
  if (nota >= 4.0) {
    return 'nota-regular';
  }
  return 'nota-mala';
};

export const formatGrade = (nota: number): string =>
  nota.toFixed(1);

export const getGradeLabel = (nota: number): string => {
  if (nota >= 6.0) {
    return 'Excelente';
  }
  if (nota >= 5.0) {
    return 'Bueno';
  }
  if (nota >= 4.0) {
    return 'Suficiente';
  }
  if (nota >= 2.0) {
    return 'Insuficiente';
  }
  return 'Reprobado';
};

export const calculateAverage = (notas: number[]): number => {
  if (notas.length === 0) {
    return 0;
  }
  const sum = notas.reduce((acc, n) => acc + n, 0);
  return Math.round((sum / notas.length) * 10) / 10;
};

export const formatRut = (rut: string): string => {
  const clean = rut.replace(/[^0-9kK]/g, '');
  if (clean.length < 2) {
    return clean;
  }
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
};

export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaults: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat('es-CL', defaults).format(date);
};

export const formatShortDate = (date: Date): string =>
  new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'ahora';
  }
  if (diffMins < 60) {
    return `hace ${diffMins} min`;
  }
  if (diffHours < 24) {
    return `hace ${diffHours}h`;
  }
  if (diffDays < 7) {
    return `hace ${diffDays}d`;
  }
  return formatShortDate(date);
};

export const ATTENDANCE_LIMIT_PERCENTAGE = 15;

export const isAttendanceCritical = (porcentajeAusencias: number): boolean =>
  porcentajeAusencias >= ATTENDANCE_LIMIT_PERCENTAGE;
