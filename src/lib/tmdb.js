// Busca de filmes na API do TMDB (The Movie Database) — grátis pra uso pessoal.
// Veja README.md pra como gerar a chave. Sem a chave, a busca fica desativada
// e o cadastro de filme continua funcionando manualmente, sem quebrar nada.
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';
const LOGO_BASE = 'https://image.tmdb.org/t/p/w92';

export const TMDB_ENABLED = !!API_KEY;

// Lista oficial de gêneros de filme do TMDB — os ids são estáveis há anos,
// então evita 1 chamada extra à API só pra traduzir id -> nome.
const GENRE_NAMES = {
  28: 'Ação', 12: 'Aventura', 16: 'Animação', 35: 'Comédia', 80: 'Crime',
  99: 'Documentário', 18: 'Drama', 10751: 'Família', 14: 'Fantasia', 36: 'História',
  27: 'Terror', 10402: 'Música', 9648: 'Mistério', 10749: 'Romance',
  878: 'Ficção científica', 10770: 'Cinema TV', 53: 'Suspense', 10752: 'Guerra', 37: 'Faroeste'
};

export function posterUrl(posterPath) {
  return posterPath ? `${IMAGE_BASE}${posterPath}` : null;
}

export async function searchMovies(query) {
  if (!TMDB_ENABLED || !query.trim()) return [];
  try {
    const res = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).slice(0, 8).map((m) => ({
      id: m.id,
      title: m.title,
      year: m.release_date ? m.release_date.slice(0, 4) : '',
      overview: m.overview || '',
      posterPath: m.poster_path || null,
      genre: GENRE_NAMES[m.genre_ids?.[0]] || 'Outro'
    }));
  } catch {
    return [];
  }
}

// Onde assistir (streaming, aluguel, compra) no Brasil — dados vêm do JustWatch
// via TMDB. Busca sob demanda (não guardamos no banco: catálogo muda toda hora).
export async function getWatchProviders(tmdbId) {
  if (!TMDB_ENABLED || !tmdbId) return null;
  try {
    const res = await fetch(`${BASE_URL}/movie/${tmdbId}/watch/providers?api_key=${API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    const br = data.results?.BR;
    if (!br) return null;
    const toList = (arr) => (arr || []).map((p) => ({ name: p.provider_name, logo: `${LOGO_BASE}${p.logo_path}` }));
    return {
      link: br.link,
      streaming: toList(br.flatrate),
      rent: toList(br.rent),
      buy: toList(br.buy)
    };
  } catch {
    return null;
  }
}
