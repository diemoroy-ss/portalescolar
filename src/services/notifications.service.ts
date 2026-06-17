import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, getFirebaseMessaging } from '@/lib/firebase';
import { toast } from 'sonner';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const requestNotificationPermission = async (uid: string): Promise<string | null> => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return null;
  }

  const token = await getToken(messaging, { vapidKey: VAPID_KEY });

  await updateDoc(doc(db, 'usuarios', uid), {
    fcmToken: token,
    actualizadoEn: serverTimestamp(),
  });

  return token;
};

export const subscribeToForegroundMessages = async () => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    return () => undefined;
  }

  const unsubscribe = onMessage(messaging, payload => {
    const title = payload.notification?.title ?? 'Nueva notificación';
    const body = payload.notification?.body ?? '';

    toast.info(title, {
      description: body,
      duration: 6000,
    });
  });

  return unsubscribe;
};
