import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { compressImage } from '../lib/compressImage';
import { useLongPress } from '../lib/useLongPress';
import { PlusIcon, CameraIcon } from '../components/Icons';

export default function Trips() {
  const { session } = useAuth();
  const [trips, setTrips] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function loadTrips() {
    const { data } = await supabase.from('trips').select('*').order('trip_date', { ascending: false });
    setTrips(data || []);
  }

  useEffect(() => { loadTrips(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function deleteTrip(trip) {
    if (!window.confirm(`Apagar a viagem "${trip.title}"? Isso remove todas as fotos dela também.`)) return;
    const { data: files } = await supabase.storage.from('trips').list(trip.id);
    if (files?.length) {
      await supabase.storage.from('trips').remove(files.map((f) => `${trip.id}/${f.name}`));
    }
    await supabase.from('trips').delete().eq('id', trip.id);
    loadTrips();
  }

  return (
    <div className="screen">
      <div style={{ padding: '20px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p className="eyebrow">o mural de vocês</p>
          <h1 style={{ fontSize: 24, marginTop: 4 }}>Nossas viagens</h1>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px' }} onClick={() => setShowForm(true)}>
          <PlusIcon width={16} height={16} /> Nova
        </button>
      </div>

      {showForm && (
        <NewTripForm
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); loadTrips(); }}
        />
      )}

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
        {trips === null && <p style={{ color: 'var(--muted)' }}>Carregando…</p>}
        {trips?.length === 0 && (
          <div className="card center-col" style={{ padding: 32, gap: 8, textAlign: 'center' }}>
            <CameraIcon width={26} height={26} />
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Nenhuma viagem ainda. Que tal registrar a primeira?</p>
          </div>
        )}
        {trips?.map((trip) => (
          <TripCard key={trip.id} trip={trip} onDelete={() => deleteTrip(trip)} />
        ))}
      </div>
    </div>
  );
}

function TripCard({ trip, onDelete }) {
  const longPress = useLongPress(onDelete);
  return (
    <Link
      to={`/viagens/${trip.id}`}
      {...longPress}
      className="card"
      style={{
        ...longPress.style,
        display: 'block',
        textDecoration: 'none',
        padding: 0,
        overflow: 'hidden',
        height: 160,
        position: 'relative',
        backgroundImage: trip.cover_image_url ? `url(${trip.cover_image_url})` : 'linear-gradient(135deg,#2A2A5C,#1F1F45)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(20,20,43,0) 30%, rgba(20,20,43,0.9) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 16 }}>
        <p className="eyebrow" style={{ color: 'var(--gold)' }}>{formatDate(trip.trip_date)}</p>
        <h3 style={{ fontSize: 19, color: 'var(--cream)' }}>{trip.title}</h3>
      </div>
    </Link>
  );
}

function NewTripForm({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data: trip, error: insertErr } = await supabase
        .from('trips')
        .insert({ title, trip_date: date || null, description })
        .select()
        .single();
      if (insertErr) throw insertErr;

      if (coverFile) {
        const compressed = await compressImage(coverFile);
        const path = `${trip.id}/cover-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage.from('trips').upload(path, compressed, { upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('trips').getPublicUrl(path);
        await supabase.from('trips').update({ cover_image_url: pub.publicUrl }).eq('id', trip.id);
      }
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ margin: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input className="field" placeholder="Título da viagem" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <textarea className="field" placeholder="Uma lembrança sobre essa viagem…" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      <label style={{ fontSize: 12.5, color: 'var(--muted)' }}>
        Foto de capa
        <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} style={{ display: 'block', marginTop: 6 }} />
      </label>
      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </form>
  );
}

function formatDate(d) {
  if (!d) return 'sem data';
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
