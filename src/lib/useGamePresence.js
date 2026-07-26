import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// Rastreia quem está com a tela deste jogo aberta agora, via Realtime Presence.
// Retorna a lista de user ids "presentes" no canal desse jogo neste momento.
export function useGamePresence(gameKey, myId) {
  const [onlineIds, setOnlineIds] = useState([]);

  useEffect(() => {
    if (!gameKey || !myId) return;

    const channel = supabase.channel(`presence-game-${gameKey}`, {
      config: { presence: { key: myId } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineIds(Object.keys(channel.presenceState()));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => supabase.removeChannel(channel);
  }, [gameKey, myId]);

  return onlineIds;
}
