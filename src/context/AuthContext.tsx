import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useRef,
} from 'react';
import type { User } from 'firebase/auth';
import type { Usuario } from '@/types';
import {
  subscribeToAuthChanges,
  fetchUserProfile,
  logoutUser,
  resetSessionTimer,
} from '@/services/auth.service';

interface AuthState {
  user: User | null;
  userData: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; userData: Usuario } }
  | { type: 'CLEAR_USER' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        userData: action.payload.userData,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'CLEAR_USER':
      return {
        user: null,
        userData: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  userData: null,
  isLoading: true,
  isAuthenticated: false,
};

interface AuthContextValue extends AuthState {
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  changeRole: (role: 'apoderado' | 'docente' | 'admin') => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const activityEvents = useRef<string[]>([
    'mousedown',
    'keydown',
    'touchstart',
    'scroll',
  ]);

  const handleSessionExpire = useCallback(async () => {
    await logoutUser();
    dispatch({ type: 'CLEAR_USER' });
  }, []);

  const refreshSessionTimer = useCallback(() => {
    if (state.isAuthenticated) {
      resetSessionTimer(handleSessionExpire);
    }
  }, [state.isAuthenticated, handleSessionExpire]);

  useEffect(() => {
    const events = activityEvents.current;
    events.forEach(event => window.addEventListener(event, refreshSessionTimer));
    return () => {
      events.forEach(event => window.removeEventListener(event, refreshSessionTimer));
    };
  }, [refreshSessionTimer]);

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });

    const unsubscribe = subscribeToAuthChanges(async (firebaseUser: User | null) => {
      if (!firebaseUser) {
        dispatch({ type: 'CLEAR_USER' });
        return;
      }

      try {
        const userData = await fetchUserProfile(firebaseUser.uid);
        if (!userData) {
          dispatch({ type: 'CLEAR_USER' });
          return;
        }

        // Check for role override in sessionStorage if user is superadmin
        let activeRole = userData.rol;
        if (firebaseUser.email === 'diemoroy@gmail.com') {
          const persistedRole = sessionStorage.getItem('superadmin_role');
          if (persistedRole && ['apoderado', 'docente', 'admin'].includes(persistedRole)) {
            activeRole = persistedRole as any;
          }
        }

        dispatch({
          type: 'SET_USER',
          payload: {
            user: firebaseUser,
            userData: {
              ...userData,
              rol: activeRole,
            },
          },
        });
        resetSessionTimer(handleSessionExpire);
      } catch (error) {
        console.error('Error fetching user profile, signing out:', error);
        await logoutUser();
        dispatch({ type: 'CLEAR_USER' });
      }
    });

    return unsubscribe;
  }, [handleSessionExpire]);

  const logout = useCallback(async () => {
    sessionStorage.removeItem('superadmin_role');
    await logoutUser();
    dispatch({ type: 'CLEAR_USER' });
  }, []);

  const changeRole = useCallback((newRole: 'apoderado' | 'docente' | 'admin') => {
    if (state.userData && state.user?.email === 'diemoroy@gmail.com') {
      sessionStorage.setItem('superadmin_role', newRole);
      dispatch({
        type: 'SET_USER',
        payload: {
          user: state.user,
          userData: {
            ...state.userData,
            rol: newRole,
          },
        },
      });
    }
  }, [state.user, state.userData]);

  const refreshUserData = useCallback(async () => {
    if (!state.user) {
      return;
    }
    const userData = await fetchUserProfile(state.user.uid);
    if (userData) {
      const persistedRole = state.user.email === 'diemoroy@gmail.com'
        ? (sessionStorage.getItem('superadmin_role') || state.userData?.rol || userData.rol)
        : userData.rol;
      dispatch({
        type: 'SET_USER',
        payload: {
          user: state.user,
          userData: {
            ...userData,
            rol: persistedRole as any,
          },
        },
      });
    }
  }, [state.user, state.userData]);

  return (
    <AuthContext.Provider value={{ ...state, logout, refreshUserData, changeRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return context;
};
