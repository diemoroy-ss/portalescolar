import { useEffect, useReducer } from 'react';
import {
  subscribeToNotasByAlumno,
  groupNotasByAsignatura,
  getPromedioGeneral,
} from './notas.service';
import type { Nota } from '@/types';

interface NotasState {
  notas: Nota[];
  isLoading: boolean;
  error: string | null;
}

type NotasAction =
  | { type: 'SET_LOADING' }
  | { type: 'SET_NOTAS'; payload: Nota[] }
  | { type: 'SET_ERROR'; payload: string };

const notasReducer = (state: NotasState, action: NotasAction): NotasState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'SET_NOTAS':
      return { notas: action.payload, isLoading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
};

export const useNotas = (alumnoId: string) => {
  const [state, dispatch] = useReducer(notasReducer, {
    notas: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!alumnoId) {
      return;
    }

    dispatch({ type: 'SET_LOADING' });

    const unsubscribe = subscribeToNotasByAlumno(
      alumnoId,
      notas => dispatch({ type: 'SET_NOTAS', payload: notas }),
      error => dispatch({ type: 'SET_ERROR', payload: error.message }),
    );

    return unsubscribe;
  }, [alumnoId]);

  const notasPorAsignatura = groupNotasByAsignatura(state.notas);
  const promedioGeneral = getPromedioGeneral(state.notas);

  return {
    ...state,
    notasPorAsignatura,
    promedioGeneral,
  };
};
