import { useEffect, useReducer } from 'react';
import { subscribeToAsistenciaByAlumno, calcularEstadisticasAsistencia } from './asistencia.service';
import type { RegistroAsistencia, EstadisticasAsistencia } from '@/types';

interface AsistenciaState {
  records: RegistroAsistencia[];
  isLoading: boolean;
  error: string | null;
}

type AsistenciaAction =
  | { type: 'SET_LOADING' }
  | { type: 'SET_RECORDS'; payload: RegistroAsistencia[] }
  | { type: 'SET_ERROR'; payload: string };

const asistenciaReducer = (state: AsistenciaState, action: AsistenciaAction): AsistenciaState => {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, isLoading: true, error: null };
    case 'SET_RECORDS': return { records: action.payload, isLoading: false, error: null };
    case 'SET_ERROR':   return { ...state, error: action.payload, isLoading: false };
    default: return state;
  }
};

const emptyStats: EstadisticasAsistencia = {
  totalDias: 0,
  presentes: 0,
  ausentes: 0,
  tardanzas: 0,
  porcentajeAsistencia: 100,
  superaLimite: false,
};

export const useAsistencia = (alumnoId: string) => {
  const [state, dispatch] = useReducer(asistenciaReducer, {
    records: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!alumnoId) {
      return;
    }

    dispatch({ type: 'SET_LOADING' });

    const unsubscribe = subscribeToAsistenciaByAlumno(
      alumnoId,
      records => dispatch({ type: 'SET_RECORDS', payload: records }),
      error => dispatch({ type: 'SET_ERROR', payload: error.message }),
    );

    return unsubscribe;
  }, [alumnoId]);

  const estadisticas = state.records.length > 0
    ? calcularEstadisticasAsistencia(state.records)
    : emptyStats;

  return { ...state, estadisticas };
};
