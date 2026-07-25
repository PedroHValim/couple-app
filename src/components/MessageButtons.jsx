import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { QUICK_MESSAGES, phraseFor } from '../lib/messages';
import { ICONS_BY_KEY } from './Icons';

export default function MessageButtons({ myId, partnerId }) {
  const [sendingKey, setSendingKey] = useState(null);
  const [sentKey, setSentKey] = useState(null);

  async function send(type) {
    if (!partnerId || sendingKey) return;
    setSendingKey(type);
    const body = phraseFor(type);
    try {
      await supabase.from('messages').insert({
        sender_id: myId,
        receiver_id: partnerId,
        type,
        body
      });
      setSentKey(type);
      setTimeout(() => setSentKey(null), 1800);
    } finally {
      setSendingKey(null);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '0 20px' }}>
      {Object.entries(QUICK_MESSAGES).map(([key, def]) => {
        const Icon = ICONS_BY_KEY[def.icon];
        const isSent = sentKey === key;
        return (
          <button
            key={key}
            onClick={() => send(key)}
            disabled={sendingKey === key}
            className="card"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: '14px 6px',
              border: 'none',
              background: isSent ? 'rgba(244,201,93,0.18)' : 'rgba(255,255,255,0.05)',
              color: isSent ? 'var(--gold)' : 'var(--cream)',
              transition: 'background 0.2s ease'
            }}
          >
            <Icon width={22} height={22} />
            <span style={{ fontSize: 11, fontWeight: 700 }}>{isSent ? 'Enviado!' : def.label}</span>
          </button>
        );
      })}
    </div>
  );
}
