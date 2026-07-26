import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

export default function InviteToPlay({ gameKey, gameTitle }) {
  const { session, profile, partner } = useAuth();
  const [sent, setSent] = useState(false);

  if (!partner) return null;

  async function invite() {
    await supabase.from('messages').insert({
      sender_id: session.user.id,
      receiver_id: partner.id,
      type: `convite:${gameKey}`,
      body: `${profile?.name || 'Seu par'} te chamou pra jogar ${gameTitle}! 🎮`
    });
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  }

  return (
    <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={invite} disabled={sent}>
      {sent ? 'Convite enviado! 🎉' : `Chamar ${partner.name} pra jogar`}
    </button>
  );
}
