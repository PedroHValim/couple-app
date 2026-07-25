import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function initialState() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return 'idle';
}

// Ativa notificações push reais (funcionam com o app fechado).
// Requer HTTPS + o app instalado na tela inicial no iOS (iOS 16.4+).
export function usePushSubscription(userId) {
  const [state, setState] = useState(initialState); // idle | asking | granted | denied | unsupported | error

  const subscribeAndSave = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      console.warn('VITE_VAPID_PUBLIC_KEY não configurada — veja README.md.');
      setState('error');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        subscription: subscription.toJSON(),
        updated_at: new Date().toISOString()
      });

      setState('granted');
    } catch (err) {
      console.error(err);
      setState('error');
    }
  }, [userId]);

  // Se a permissão já foi concedida antes (sessão anterior), garante que a
  // subscription exista e esteja salva no banco, sem precisar mostrar o banner.
  useEffect(() => {
    if (userId && Notification?.permission === 'granted') {
      subscribeAndSave();
    }
  }, [userId, subscribeAndSave]);

  const enable = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }

    setState('asking');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setState('denied');
      return;
    }

    await subscribeAndSave();
  }, [subscribeAndSave]);

  return { state, enable };
}
