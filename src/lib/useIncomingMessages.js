import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// Escuta mensagens novas destinadas a este usuário. Quando o app está aberto,
// mostra um toast na tela e (se permitido) uma notificação do navegador.
// Quando o app está em segundo plano/fechado, quem cuida disso é o service worker + Web Push
// (veja supabase/functions/send-push e src/sw-push.js).
export function useIncomingMessages(myId) {
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    if (!myId) return;

    const channel = supabase
      .channel('messages-incoming')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${myId}` },
        (payload) => {
          const msg = payload.new;
          setLastMessage(msg);

          if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState === 'visible') {
            new Notification('Nossa Órbita 💛', { body: msg.body, icon: `${import.meta.env.BASE_URL}icons/icon-192.png` });
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [myId]);

  return lastMessage;
}
