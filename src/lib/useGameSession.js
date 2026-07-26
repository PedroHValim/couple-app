import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// Estado de um jogo compartilhado pelo casal, sincronizado em tempo real.
// Cada jogo (ex: "tictactoe") tem uma linha só por casal — se ainda não
// existir, cria na hora. `state` é livre (jsonb) pra cada jogo definir o formato.
export function useGameSession(gameKey, initialState) {
  const [session, setSession] = useState(null);

  const load = useCallback(async () => {
    const { data: existing } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('game', gameKey)
      .order('created_at', { ascending: true })
      .limit(1);

    if (existing?.length) {
      setSession(existing[0]);
      return;
    }

    const { data: created } = await supabase
      .from('game_sessions')
      .insert({ game: gameKey, state: initialState })
      .select()
      .single();
    setSession(created);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameKey]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`game-${gameKey}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `game=eq.${gameKey}` },
        (payload) => {
          setSession((prev) => (prev && prev.id === payload.new.id ? payload.new : prev));
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [gameKey]);

  const updateState = useCallback(async (newState) => {
    if (!session) return;
    setSession((prev) => ({ ...prev, state: newState }));
    await supabase.from('game_sessions').update({ state: newState, updated_at: new Date().toISOString() }).eq('id', session.id);
  }, [session]);

  return { session, updateState };
}
