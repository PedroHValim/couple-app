import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// Lista de filmes do casal, ao vivo: qualquer INSERT/UPDATE/DELETE
// (ex: o parceiro colocando a nota dele) recarrega a lista pros dois.
export function useMovies(myId) {
  const [movies, setMovies] = useState(null);

  const reload = useCallback(async () => {
    if (!myId) return;
    const { data } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
    setMovies(data || []);
  }, [myId]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (!myId) return;
    const channel = supabase
      .channel('movies-couple')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movies' }, () => reload())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [myId, reload]);

  return { movies, reload };
}
