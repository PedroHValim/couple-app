import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

export default function Login() {
  const { session, loading } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && session) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error: signErr } = await supabase.auth.signUp({ email, password });
        if (signErr) throw signErr;
        if (data.user) {
          // O perfil já foi criado por um trigger no banco (veja supabase/schema.sql).
          // Aqui só atualizamos o nome escolhido.
          await supabase.from('profiles').update({ name }).eq('id', data.user.id);
        }
        if (!data.session) {
          setInfo('Conta criada! Verifique seu e-mail para confirmar antes de entrar.');
        }
      } else {
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
        if (loginErr) throw loginErr;
      }
    } catch (err) {
      setError(traduzErro(err.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen center-col" style={{ padding: '32px 28px', gap: 28, minHeight: '100dvh' }}>
      <div style={{ textAlign: 'center' }}>
        <p className="eyebrow">nossa órbita</p>
        <h1 style={{ fontSize: 32, marginTop: 6 }}>
          {mode === 'login' ? 'Que bom te ver de novo' : 'Vamos começar'}
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14 }}>
          {mode === 'login' ? 'Entre para ver onde vocês estão.' : 'Crie sua conta para depois se conectar com seu par.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mode === 'signup' && (
          <input className="field" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <input className="field" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="field" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

        {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
        {info && <p style={{ color: 'var(--gold)', fontSize: 13 }}>{info}</p>}

        <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: 8 }}>
          {busy ? 'Um instante…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>

      <button
        className="btn-ghost"
        style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13 }}
        onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo(''); }}
      >
        {mode === 'login' ? 'Ainda não tem conta? Criar uma' : 'Já tem conta? Entrar'}
      </button>
    </div>
  );
}

function traduzErro(msg) {
  if (msg?.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg?.includes('already registered')) return 'Esse e-mail já está cadastrado.';
  return msg || 'Algo deu errado. Tente de novo.';
}
