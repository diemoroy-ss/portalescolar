import { useEffect, useReducer, useCallback } from 'react';
import { subscribeToEventosByCurso } from './agenda.service';
import type { Evento } from '@/types';

interface AgendaState {
  eventos: Evento[];
  isLoading: boolean;
  error: string | null;
  year: number;
  month: number;
}

type AgendaAction =
  | { type: 'SET_LOADING' }
  | { type: 'SET_EVENTOS'; payload: Evento[] }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'NAVIGATE'; payload: { year: number; month: number } };

const agendaReducer = (state: AgendaState, action: AgendaAction): AgendaState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'SET_EVENTOS':
      return { ...state, eventos: action.payload, isLoading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'NAVIGATE':
      return { ...state, ...action.payload, isLoading: true, eventos: [] };
    default:
      return state;
  }
};

export const useAgenda = (cursoId: string) => {
  const now = new Date();
  const [state, dispatch] = useReducer(agendaReducer, {
    eventos: [],
    isLoading: true,
    error: null,
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  useEffect(() => {
    if (!cursoId) {
      return;
    }

    dispatch({ type: 'SET_LOADING' });

    const unsubscribe = subscribeToEventosByCurso(
      cursoId,
      state.year,
      state.month,
      eventos => dispatch({ type: 'SET_EVENTOS', payload: eventos }),
      error => dispatch({ type: 'SET_ERROR', payload: error.message }),
    );

    return unsubscribe;
  }, [cursoId, state.year, state.month]);

  const navigatePrevious = useCallback(() => {
    const d = new Date(state.year, state.month - 1);
    dispatch({ type: 'NAVIGATE', payload: { year: d.getFullYear(), month: d.getMonth() } });
  }, [state.year, state.month]);

  const navigateNext = useCallback(() => {
    const d = new Date(state.year, state.month + 1);
    dispatch({ type: 'NAVIGATE', payload: { year: d.getFullYear(), month: d.getMonth() } });
  }, [state.year, state.month]);

  const getEventosForDay = useCallback(
    (day: number): Evento[] =>
      state.eventos.filter(e => {
        const fecha = e.fecha.toDate();
        return (
          fecha.getDate() === day &&
          fecha.getMonth() === state.month &&
          fecha.getFullYear() === state.year
        );
      }),
    [state.eventos, state.month, state.year],
  );

  return {
    ...state,
    navigatePrevious,
    navigateNext,
    getEventosForDay,
  };
};
