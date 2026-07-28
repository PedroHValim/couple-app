import React, { useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { compressImage } from '../lib/compressImage';
import { CameraIcon, LogoutIcon } from '../components/Icons';

export default function Profile() {
  const { profile, partner, signOut, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [anniversary, setAnniversary] = useState(profile?.anniversary_date || '');
  const [saving, setSaving] = useState(false);
  const [savingAnniversary, setSavingAnniversary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function saveName() {
    setSaving(true);
    await supabase.from('profiles').update({ name }).eq('id', profile.id);
    await refreshProfile();
    setSaving(false);
  }

  async function saveAnniversary() {
    setSavingAnniversary(true);
    await supabase.rpc('set_anniversary_date', { new_date: anniversary || null });
    await refreshProfile();
    setSavingAnniversary(false);
  }

  async function handleAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 800, quality: 0.8 });
      const path = `${profile.id}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('avatars').upload(path, compressed, { upsert: true });
      if (!error) {
        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
        await supabase.from('profiles').update({ avatar_url: pub.publicUrl }).eq('id', profile.id);
        await refreshProfile();
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="screen" style={{ padding: 20 }}>
      <p className="eyebrow">seu perfil</p>
      <h1 style={{ fontSize: 24, marginTop: 4, marginBottom: 20 }}>Ajustes</h1>

      <div className="center-col" style={{ gap: 10, marginBottom: 24 }}>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            width: 96, height: 96, borderRadius: '50%', border: '3px solid var(--gold)',
            background: profile?.avatar_url ? `url(${profile.avatar_url})` : 'var(--night-3)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
          }}
        >
          {!profile?.avatar_url && <CameraIcon width={26} height={26} />}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>{uploading ? 'Enviando foto…' : 'Toque para trocar a foto'}</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <p className="eyebrow">seu nome</p>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-primary" onClick={saveName} disabled={saving}>{saving ? 'Salvando…' : 'Salvar nome'}</button>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <p className="eyebrow">pedido de namoro</p>
        <input className="field" type="date" value={anniversary} onChange={(e) => setAnniversary(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
        <button className="btn btn-primary" onClick={saveAnniversary} disabled={savingAnniversary || !anniversary}>
          {savingAnniversary ? 'Salvando…' : 'Salvar data'}
        </button>
        <p style={{ fontSize: 11.5, color: 'var(--muted)' }}>Vale pros dois — aparece na tela inicial a contagem de dias juntos.</p>
      </div>

      {partner && (
        <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: partner.avatar_url ? `url(${partner.avatar_url})` : 'var(--night-3)',
            backgroundSize: 'cover', backgroundPosition: 'center'
          }} />
          <div>
            <p className="eyebrow">conectado com</p>
            <p style={{ fontWeight: 700 }}>{partner.name}</p>
          </div>
        </div>
      )}

      <button className="btn btn-ghost" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={signOut}>
        <LogoutIcon width={16} height={16} /> Sair da conta
      </button>
    </div>
  );
}
