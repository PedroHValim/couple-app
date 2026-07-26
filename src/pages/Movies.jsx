import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { useMovies } from '../lib/useMovies';
import { useLongPress } from '../lib/useLongPress';
import { TMDB_ENABLED, searchMovies, posterUrl } from '../lib/tmdb';
import { PlusIcon, FilmIcon, CloseIcon } from '../components/Icons';

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
  const [openMovie, setOpenMovie] = useState(null);

  const sorted = movies ? [...movies].sort((a, b) => scoreOf(b) - scoreOf(a)) : null;

  async function deleteMovie(movie) {
    if (!window.confirm(`Apagar "${movie.title}" da lista?`)) return;
    await supabase.from('movies').delete().eq('id', movie.id);
    setOpenMovie(null);
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
          <MovieCard
            key={movie.id}
            movie={movie}
            myId={myId}
            onOpen={() => setOpenMovie(movie)}
            onDelete={() => deleteMovie(movie)}
            onChanged={reload}
          />
        ))}
        {sorted && sorted.length > 0 && (
          <p style={{ fontSize: 11.5, color: 'var(--muted)', textAlign: 'center' }}>Toque num filme pra ver a sinopse · segure pra apagar</p>
        )}
        {TMDB_ENABLED && (
          <p style={{ fontSize: 10.5, color: 'var(--muted)', textAlign: 'center', opacity: 0.6, marginTop: 4 }}>
            Dados de filmes fornecidos pela TMDB — este app usa a API do TMDB mas não é endossado por eles.
          </p>
        )}
      </div>

      {openMovie && (
        <MovieDetail movie={openMovie} onClose={() => setOpenMovie(null)} onDelete={() => deleteMovie(openMovie)} />
      )}
    </div>
  );
}

function MovieCard({ movie, myId, onOpen, onDelete, onChanged }) {
  const { handlers, wasLongPress } = useLongPress(onDelete);
  const isOwner = movie.owner_id === myId;
  const myRating = isOwner ? movie.owner_rating : movie.partner_rating;
  const partnerRating = isOwner ? movie.partner_rating : movie.owner_rating;
  const score = scoreOf(movie);
  const poster = posterUrl(movie.poster_path);

  async function rate(value) {
    const field = isOwner ? 'owner_rating' : 'partner_rating';
    await supabase.from('movies').update({ [field]: value }).eq('id', movie.id);
    onChanged();
  }

  return (
    <div
      {...handlers}
      onClick={() => { if (!wasLongPress()) onOpen(); }}
      className="card"
      style={{ ...handlers.style, cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center' }}
    >
      {poster ? (
        <img src={poster} alt="" style={{ width: 46, height: 66, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
      ) : (
        <div style={{ width: 46, height: 66, borderRadius: 8, background: 'rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FilmIcon width={20} height={20} style={{ color: 'var(--muted)' }} />
        </div>
      )}
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

function MovieDetail({ movie, onClose }) {
  const poster = posterUrl(movie.poster_path);
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(6,6,16,0.88)', display: 'flex', alignItems: 'flex-end' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          borderRadius: '20px 20px 0 0',
          padding: 20,
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
          background: 'var(--night-2)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderBottom: 'none',
          boxShadow: '0 -12px 40px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 999, padding: 6, display: 'flex' }}>
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {poster ? (
            <img src={poster} alt="" style={{ width: 100, height: 148, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
          ) : (
            <div style={{ width: 100, height: 148, borderRadius: 10, background: 'rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FilmIcon width={28} height={28} style={{ color: 'var(--muted)' }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <p className="eyebrow" style={{ color: 'var(--lavender)' }}>{movie.genre}</p>
            <h2 style={{ fontSize: 20, marginTop: 4 }}>{movie.title}</h2>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)', marginTop: 8 }}>{scoreOf(movie).toFixed(1)}</p>
          </div>
        </div>

        <p className="eyebrow" style={{ marginBottom: 6 }}>sinopse</p>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--cream)', marginBottom: 4 }}>
          {movie.overview || 'Sem sinopse disponível pra esse filme (foi cadastrado manualmente).'}
        </p>
      </div>
    </div>
  );
}

function NewMovieForm({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [genre, setGenre] = useState(GENRES[0]);
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!TMDB_ENABLED || selected || !query.trim()) {
      setResults([]);
      return;
    }
    let active = true;
    const t = setTimeout(async () => {
      const r = await searchMovies(query);
      if (active) setResults(r);
    }, 400);
    return () => { active = false; clearTimeout(t); };
  }, [query, selected]);

  function handleTitleChange(value) {
    setTitle(value);
    setQuery(value);
    if (selected) setSelected(null);
  }

  function pick(result) {
    setSelected(result);
    setTitle(result.title);
    setQuery(result.title);
    if (GENRES.includes(result.genre)) setGenre(result.genre);
    setResults([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error: insertErr } = await supabase.from('movies').insert({
        title,
        genre,
        owner_rating: rating,
        tmdb_id: selected?.id ?? null,
        poster_path: selected?.posterPath ?? null,
        overview: selected?.overview ?? null
      });
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
      <div style={{ position: 'relative' }}>
        <input
          className="field"
          placeholder={TMDB_ENABLED ? 'Nome do filme (busca automática)' : 'Nome do filme'}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
        />
        {results.length > 0 && (
          <div className="card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: 4, padding: 6, maxHeight: 260, overflowY: 'auto' }}>
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => pick(r)}
                style={{ display: 'flex', gap: 10, width: '100%', textAlign: 'left', padding: 6, background: 'none', border: 'none', color: 'var(--cream)', alignItems: 'center', cursor: 'pointer' }}
              >
                {r.posterPath ? (
                  <img src={posterUrl(r.posterPath)} alt="" style={{ width: 34, height: 50, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 34, height: 50, borderRadius: 6, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
                )}
                <span style={{ fontSize: 13.5 }}>{r.title}{r.year ? ` (${r.year})` : ''}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <p style={{ fontSize: 11.5, color: 'var(--muted)' }}>
          Pôster e sinopse do TMDB serão salvos junto. Pra cadastrar manualmente, edite o nome acima.
        </p>
      )}

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
