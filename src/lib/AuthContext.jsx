import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    const { data: me } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(me || null);
    if (me?.partner_id) {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', me.partner_id).single();
      setPartner(p || null);
    } else {
      setPartner(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfile(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) loadProfile(newSession.user.id);
      else {
        setProfile(null);
        setPartner(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  // Mantém meu perfil e o do meu par sincronizados ao vivo — se um dos dois
  // mudar nome, foto ou data de namoro, o outro vê na hora, sem recarregar o app.
  useEffect(() => {
    const myId = session?.user?.id;
    if (!myId) return;
    const partnerId = profile?.partner_id;

    const channel = supabase.channel('profiles-couple-sync').on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${myId}` },
      (payload) => setProfile(payload.new)
    );

    if (partnerId) {
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${partnerId}` },
        (payload) => setPartner(payload.new)
      );
    }

    channel.subscribe();
    return () => supabase.removeChannel(channel);
  }, [session?.user?.id, profile?.partner_id]);

  const refreshProfile = useCallback(() => {
    if (session) return loadProfile(session.user.id);
  }, [session, loadProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, profile, partner, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
