// Avatares cartoon gerados pela API pública e gratuita do DiceBear (SVG por URL,
// sem chave, sem cadastro). https://www.dicebear.com — cada estilo + seed sempre
// gera o mesmo desenho, então dá pra "sortear" só trocando a seed.
export const AVATAR_STYLES = [
  { key: 'adventurer', label: 'Aventureiro' },
  { key: 'avataaars', label: 'Clássico' },
  { key: 'big-smile', label: 'Sorridente' },
  { key: 'lorelei', label: 'Delicado' },
  { key: 'micah', label: 'Moderno' },
  { key: 'notionists', label: 'Minimalista' }
];

export function avatarUrl(style, seed) {
  return `https://api.dicebear.com/10.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}

// "photo-fullbody" é uma foto/PNG normal (subida pelo próprio usuário, ex: um
// avatar 3D exportado de algum criador tipo Avaturn) que a gente decidiu não
// cortar em círculo, mostrando de corpo inteiro na cena de proximidade.
// Não depende de nenhum serviço externo ficar no ar — é só um arquivo nosso.
export const FULL_BODY_STYLE = 'photo-fullbody';

// Decide o que mostrar: avatar de desenho escolhido, senão a foto (real ou corpo inteiro).
export function displayAvatarUrl(person) {
  if (!person) return null;
  if (person.avatar_style && person.avatar_style !== FULL_BODY_STYLE) {
    return avatarUrl(person.avatar_style, person.avatar_seed || person.id);
  }
  return person.avatar_url || null;
}

export function isFullBodyAvatar(person) {
  return person?.avatar_style === FULL_BODY_STYLE;
}
