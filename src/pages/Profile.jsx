import React, { useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { compressImage } from '../lib/compressImage';
import { useTheme, THEMES } from '../lib/useTheme';
import { AVATAR_STYLES, avatarUrl, randomSeed, displayAvatarUrl } from '../lib/dicebear';
import { CameraIcon, LogoutIcon } from '../components/Icons';

export default function Profile() {
  const { profile, partner, signOut, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
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
        // Subir uma foto de novo volta a usar a foto real, mesmo se tinha um avatar de desenho escolhido.
        await supabase.from('profiles').update({ avatar_url: pub.publicUrl, avatar_style: null }).eq('id', profile.id);
        await refreshProfile();
      }
    } finally {
      setUploading(false);
    }
  }

  async function chooseAvatarStyle(style) {
    await supabase.from('profiles').update({ avatar_style: style, avatar_seed: profile.id }).eq('id', profile.id);
    await refreshProfile();
  }

  async function shuffleAvatar() {
    await supabase.from('profiles').update({ avatar_seed: randomSeed() }).eq('id', profile.id);
    await refreshProfile();
  }

  async function useRealPhoto() {
    await supabase.from('profiles').update({ avatar_style: null }).eq('id', profile.id);
    await refreshProfile();
  }

  return (
    <div className="screen" style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 20 }}>
      <p className="eyebrow">seu perfil</p>
      <h1 style={{ fontSize: 24, marginTop: 4, marginBottom: 20 }}>Ajustes</h1>

      <div className="center-col" style={{ gap: 10, marginBottom: 24 }}>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            width: 96, height: 96, borderRadius: '50%', border: '3px solid var(--gold)',
            backgroundColor: 'var(--night-3)',
            backgroundImage: displayAvatarUrl(profile) ? `url(${displayAvatarUrl(profile)})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
          }}
        >
          {!displayAvatarUrl(profile) && <CameraIcon width={26} height={26} />}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>{uploading ? 'Enviando foto…' : 'Toque para trocar a foto'}</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <p className="eyebrow">avatar de desenho</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {AVATAR_STYLES.map((s) => (
            <button
              key={s.key}
              onClick={() => chooseAvatarStyle(s.key)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 4 }}
            >
              <span
                style={{
                  width: 48, height: 48, borderRadius: '50%',
                  backgroundColor: 'var(--night-3)',
                  backgroundImage: `url(${avatarUrl(s.key, profile?.id || s.key)})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  border: profile?.avatar_style === s.key ? '3px solid var(--gold)' : '3px solid transparent'
                }}
              />
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>{s.label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {profile?.avatar_style && (
            <>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={shuffleAvatar}>🎲 Sortear outro</button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={useRealPhoto}>Usar foto real</button>
            </>
          )}
        </div>
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

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <p className="eyebrow">cor do app</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {THEMES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', padding: 4
              }}
            >
              <span style={{
                width: 36, height: 36, borderRadius: '50%', background: t.swatch,
                border: theme === t.key ? '3px solid var(--cream)' : '3px solid transparent',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }} />
              <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{t.label}</span>
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--muted)' }}>Só muda no seu aparelho — cada um pode escolher a sua.</p>
      </div>

      {partner && (
        <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            backgroundColor: 'var(--night-3)',
            backgroundImage: displayAvatarUrl(partner) ? `url(${displayAvatarUrl(partner)})` : 'none',
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
