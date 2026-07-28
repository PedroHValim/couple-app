import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { useMovies } from '../lib/useMovies';
import { useLongPress } from '../lib/useLongPress';
import { TMDB_ENABLED, searchMovies, posterUrl, getWatchProviders } from '../lib/tmdb';
import { PlusIcon, FilmIcon, CloseIcon } from '../components/Icons';

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
  const [providers, setProviders] = useState(undefined); // undefined = carregando, null = sem dado

  useEffect(() => {
    let active = true;
    setProviders(undefined);
    getWatchProviders(movie.tmdb_id).then((r) => { if (active) setProviders(r); });
    return () => { active = false; };
  }, [movie.tmdb_id]);

  const streamingList = providers?.streaming || [];

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
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--cream)', marginBottom: 16 }}>
          {movie.overview || 'Sem sinopse disponível pra esse filme (foi cadastrado manualmente).'}
        </p>

        {movie.tmdb_id && (
          <>
            <p className="eyebrow" style={{ marginBottom: 8 }}>onde assistir</p>
            {providers === undefined ? (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Buscando…</p>
            ) : streamingList.length > 0 ? (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {streamingList.map((p) => (
                  <div key={p.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 56 }}>
                    <img src={p.logo} alt={p.name} style={{ width: 40, height: 40, borderRadius: 10 }} />
                    <span style={{ fontSize: 9.5, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.2 }}>{p.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Não achamos em nenhum streaming por assinatura no Brasil agora.</p>
            )}
            {providers?.link && (
              <p style={{ fontSize: 10.5, color: 'var(--muted)', opacity: 0.6, marginTop: 8 }}>Dados de streaming via JustWatch/TMDB</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NewMovieForm({ onClose, onCreated }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    let active = true;
    const t = setTimeout(async () => {
      const r = await searchMovies(query);
      if (active) {
        setResults(r);
        setSearching(false);
      }
    }, 400);
    return () => { active = false; clearTimeout(t); };
  }, [query]);

  function pick(result) {
    setSelected(result);
    setResults([]);
  }

  function pickManual() {
    setSelected({ id: null, title: query.trim(), overview: '', posterPath: null, genre: 'Outro' });
    setResults([]);
  }

  function reset() {
    setSelected(null);
    setQuery('');
    setResults([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error: insertErr } = await supabase.from('movies').insert({
        title: selected.title,
        genre: selected.genre || 'Outro',
        owner_rating: rating,
        tmdb_id: selected.id ?? null,
        poster_path: selected.posterPath ?? null,
        overview: selected.overview || null
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
      {!selected ? (
        <>
          <input
            className="field"
            placeholder="Nome do filme…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {searching && <p style={{ fontSize: 11.5, color: 'var(--muted)' }}>Buscando…</p>}
          {results.length > 0 && (
            <div style={{ background: 'var(--night)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => pick(r)}
                  style={{ display: 'flex', gap: 10, width: '100%', textAlign: 'left', padding: 8, background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--cream)', alignItems: 'center', cursor: 'pointer' }}
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
          {query.trim() && !searching && results.length === 0 && (
            <button type="button" className="btn btn-outline" onClick={pickManual}>
              Não achei — cadastrar "{query.trim()}" assim mesmo
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {selected.posterPath ? (
              <img src={posterUrl(selected.posterPath)} alt="" style={{ width: 52, height: 76, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 52, height: 76, borderRadius: 8, background: 'rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FilmIcon width={20} height={20} style={{ color: 'var(--muted)' }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 16 }}>{selected.title}</h3>
              <p className="eyebrow" style={{ marginTop: 2, color: 'var(--lavender)' }}>{selected.genre}</p>
            </div>
            <button type="button" className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 11.5, flexShrink: 0 }} onClick={reset}>Trocar</button>
          </div>

          <label style={{ fontSize: 12.5, color: 'var(--muted)' }}>
            Sua vontade de assistir: {rating}
            <input type="range" min="1" max="10" value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ width: '100%', marginTop: 6 }} />
          </label>

          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button>
          </div>
        </>
      )}
    </form>
  );
}
