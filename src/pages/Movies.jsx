import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { useMovies } from '../lib/useMovies';
import { useLongPress } from '../lib/useLongPress';
import { PlusIcon, FilmIcon } from '../components/Icons';

const GENRES = ['Terror', 'Suspense', 'Romance', 'Comédia', 'Ação', 'Drama', 'Ficção', 'Animação', 'Documentário', 'Outro'];
const RATINGS = Array.from({ length: 10 }, (_, i) => i + 1);

function scoreOf(movie) {
  return movie.partner_rating != null ? (movie.owner_rating + movie.partner_rating) / 2 : movie.owner_rating;
}

export default function Movies() {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const { movies, reload } = useMovies(myId);
  const [showForm, setShowForm] = useState(false);

  const sorted = movies ? [...movies].sort((a, b) => scoreOf(b) - scoreOf(a)) : null;

  async function deleteMovie(movie) {
    if (!window.confirm(`Apagar "${movie.title}" da lista?`)) return;
    await supabase.from('movies').delete().eq('id', movie.id);
    reload();
  }

  return (
    <div className="screen">
      <div style={{ padding: '20px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p className="eyebrow">pra assistir juntos</p>
          <h1 style={{ fontSize: 24, marginTop: 4 }}>Filmes</h1>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px' }} onClick={() => setShowForm(true)}>
          <PlusIcon width={16} height={16} /> Novo
        </button>
      </div>

      {showForm && (
        <NewMovieForm onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); reload(); }} />
      )}

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        {sorted === null && <p style={{ color: 'var(--muted)' }}>Carregando…</p>}
        {sorted?.length === 0 && (
          <div className="card center-col" style={{ padding: 32, gap: 8, textAlign: 'center' }}>
            <FilmIcon width={26} height={26} />
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Nenhum filme ainda. Cadastre o primeiro!</p>
          </div>
        )}
        {sorted?.map((movie) => (
          <MovieCard key={movie.id} movie={movie} myId={myId} onDelete={() => deleteMovie(movie)} onChanged={reload} />
        ))}
        {sorted && sorted.length > 0 && (
          <p style={{ fontSize: 11.5, color: 'var(--muted)', textAlign: 'center' }}>Segure um filme pra apagar da lista</p>
        )}
      </div>
    </div>
  );
}

function MovieCard({ movie, myId, onDelete, onChanged }) {
  const { handlers } = useLongPress(onDelete);
  const isOwner = movie.owner_id === myId;
  const myRating = isOwner ? movie.owner_rating : movie.partner_rating;
  const partnerRating = isOwner ? movie.partner_rating : movie.owner_rating;
  const score = scoreOf(movie);

  async function rate(value) {
    const field = isOwner ? 'owner_rating' : 'partner_rating';
    await supabase.from('movies').update({ [field]: value }).eq('id', movie.id);
    onChanged();
  }

  return (
    <div {...handlers} className="card" style={{ ...handlers.style, display: 'flex', gap: 14, alignItems: 'center' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="eyebrow" style={{ color: 'var(--lavender)' }}>{movie.genre}</p>
        <h3 style={{ fontSize: 17, marginTop: 2 }}>{movie.title}</h3>
        <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12.5, color: 'var(--muted)', alignItems: 'center', flexWrap: 'wrap' }}>
          <label
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            Sua nota:
            <select className="field" style={{ width: 56, padding: '4px 6px' }} value={myRating ?? ''} onChange={(e) => rate(Number(e.target.value))}>
              <option value="" disabled>—</option>
              {RATINGS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <span>Par: {partnerRating ?? 'aguardando'}</span>
        </div>
      </div>
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)' }}>{score.toFixed(1)}</p>
        <p className="eyebrow">nota</p>
      </div>
    </div>
  );
}

function NewMovieForm({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState(GENRES[0]);
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error: insertErr } = await supabase.from('movies').insert({ title, genre, owner_rating: rating });
      if (insertErr) throw insertErr;
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ margin: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input className="field" placeholder="Nome do filme" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <select className="field" value={genre} onChange={(e) => setGenre(e.target.value)}>
        {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>
      <label style={{ fontSize: 12.5, color: 'var(--muted)' }}>
        Sua vontade de assistir: {rating}
        <input type="range" min="1" max="10" value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ width: '100%', marginTop: 6 }} />
      </label>
      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </form>
  );
}
