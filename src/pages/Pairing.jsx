import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

export default function Pairing() {
  const { session, profile, loading, refreshProfile } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!loading && !session) return <Navigate to="/login" replace />;
  if (profile?.partner_id) return <Navigate to="/" replace />;

  async function handlePair(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { error: rpcErr } = await supabase.rpc('pair_with_code', { code: code.trim().toUpperCase() });
      if (rpcErr) throw rpcErr;
      await refreshProfile();
    } catch (err) {
      setError(err.message?.includes('not found') ? 'Código não encontrado. Confira com seu par.' : 'Não foi possível conectar. Tente de novo.');
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!profile?.invite_code) return;
    await navigator.clipboard.writeText(profile.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="screen center-col" style={{ padding: '32px 28px', gap: 26, minHeight: '100dvh' }}>
      <div style={{ textAlign: 'center' }}>
        <p className="eyebrow">último passo</p>
        <h1 style={{ fontSize: 28, marginTop: 6 }}>Conecte com seu par</h1>
        <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14 }}>
          Compartilhe seu código com ela(e), ou digite o código que você recebeu.
        </p>
      </div>

      <div className="card" style={{ width: '100%', textAlign: 'center' }}>
        <p className="eyebrow">seu código</p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: 4, margin: '8px 0' }}>
          {profile?.invite_code || '——'}
        </p>
        <button className="btn btn-outline" onClick={copyCode} style={{ width: '100%' }}>
          {copied ? 'Copiado!' : 'Copiar código'}
        </button>
      </div>

      <div style={{ width: '100%', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>ou</div>

      <form onSubmit={handlePair} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          className="field"
          placeholder="Código do seu par"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ textAlign: 'center', letterSpacing: 3, textTransform: 'uppercase' }}
          required
        />
        {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Conectando…' : 'Conectar'}
        </button>
      </form>
    </div>
  );
}
