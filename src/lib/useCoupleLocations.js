import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export function useCoupleLocations(myId, partnerId) {
  const [locations, setLocations] = useState({}); // { [userId]: {lat,lng,updated_at} }

  useEffect(() => {
    if (!myId || !partnerId) return;
    let active = true;

    async function loadInitial() {
      const { data } = await supabase
        .from('locations')
        .select('user_id, lat, lng, updated_at')
        .in('user_id', [myId, partnerId]);
      if (!active || !data) return;
      const next = {};
      data.forEach((row) => { next[row.user_id] = row; });
      setLocations(next);
    }
    loadInitial();

    const channel = supabase
      .channel('locations-couple')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'locations', filter: `user_id=eq.${partnerId}` },
        (payload) => {
          setLocations((prev) => ({ ...prev, [partnerId]: payload.new }));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'locations', filter: `user_id=eq.${myId}` },
        (payload) => {
          setLocations((prev) => ({ ...prev, [myId]: payload.new }));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [myId, partnerId]);

  return locations;
}
