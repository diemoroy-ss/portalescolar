import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  type User,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Usuario } from '@/types';

const SESSION_TIMEOUT_MS =
  parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES ?? '30') * 60 * 1000;

let sessionTimer: ReturnType<typeof setTimeout> | null = null;

const clearSessionTimer = () => {
  if (sessionTimer) {
    clearTimeout(sessionTimer);
    sessionTimer = null;
  }
};

const startSessionTimer = (onExpire: () => void) => {
  clearSessionTimer();
  sessionTimer = setTimeout(onExpire, SESSION_TIMEOUT_MS);
};

export const resetSessionTimer = (onExpire: () => void) => {
  startSessionTimer(onExpire);
};

export const loginWithEmail = async (
  email: string,
  password: string,
): Promise<{ user: User; userData: Usuario }> => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'usuarios', user.uid));

  if (!userDoc.exists()) {
    await signOut(auth);
    throw new Error('Usuario no encontrado en el sistema.');
  }

  const userData = { uid: user.uid, ...userDoc.data() } as Usuario;
  return { user, userData };
};

export const logoutUser = async (): Promise<void> => {
  clearSessionTimer();
  await signOut(auth);
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

export const changeUserPassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('No hay usuario autenticado.');
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);

  await updateDoc(doc(db, 'usuarios', user.uid), {
    primerLogin: false,
    actualizadoEn: serverTimestamp(),
  });
};

export const fetchUserProfile = async (uid: string): Promise<Usuario | null> => {
  const userDoc = await getDoc(doc(db, 'usuarios', uid));
  if (!userDoc.exists()) {
    return null;
  }
  return { uid, ...userDoc.data() } as Usuario;
};

export const subscribeToAuthChanges = (
  callback: (user: User | null) => void,
) => onAuthStateChanged(auth, callback);
