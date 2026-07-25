import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';

// Observa a localização do dispositivo e envia para o Supabase periodicamente.
// Retorna o status de permissão para a UI poder orientar o usuário.
export function useLocationSync(userId) {
  const [status, setStatus] = useState('idle'); // idle | watching | denied | unsupported
  const lastSent = useRef(0);

  useEffect(() => {
    if (!userId) return;
    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        setStatus('watching');
        const now = Date.now();
        // Evita gravar no banco a cada poucos metros: no máximo 1x a cada 20s.
        if (now - lastSent.current < 20000) return;
        lastSent.current = now;
        await supabase.from('locations').upsert({
          user_id: userId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          updated_at: new Date().toISOString()
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setStatus('denied');
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userId]);

  return status;
}
