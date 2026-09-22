import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useGameSession } from '../../lib/useGameSession';
import { useGamePresence } from '../../lib/useGamePresence';
import GameHeader from '../../components/GameHeader';
import InviteToPlay from '../../components/InviteToPlay';

const MAX_ERRORS = 6; // cabeça, tronco, 2 braços e 2 pernas
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Tira acento e deixa maiúsculo, só pra comparar: quem chuta "C" acerta o
// "Ç" de "coração", e quem chuta "A" acerta o "Ã" — mas na tela aparece a
// letra certinha, com acento e tudo.
function normalize(text) {
  // 0x300 a 0x36f é a faixa dos acentos que o NFD separa das letras.
  return [...text.normalize('NFD')]
    .filter((ch) => ch.charCodeAt(0) < 0x300 || ch.charCodeAt(0) > 0x36f)
    .join('')
    .toUpperCase();
}

const isLetter = (ch) => /[A-Z]/.test(ch);

// "A" e "B" são os dois lados do casal (A = quem criou a partida).
// `setter` é quem escolheu a palavra desta rodada; o outro chuta.
function freshState(setter) {
  return { setter, startedBy: setter, word: null, hint: '', guesses: [] };
}
const INITIAL_STATE = freshState('A');

// O bonequinho vai aparecendo parte por parte, a cada letra errada.
function Gallows({ errors }) {
  const show = (n) => (errors >= n ? 1 : 0);
  const fade = { transition: 'opacity 0.3s ease' };
  return (
    <svg viewBox="0 0 120 140" width="146" height="170" style={{ display: 'block', margin: '0 auto 8px' }}>
      <g stroke="var(--muted)" strokeWidth="4" strokeLinecap="round" fill="none">
        <line x1="10" y1="132" x2="82" y2="132" />
        <line x1="30" y1="132" x2="30" y2="10" />
        <line x1="30" y1="10" x2="80" y2="10" />
        <line x1="80" y1="10" x2="80" y2="26" />
      </g>
      <g stroke="var(--gold)" strokeWidth="4" strokeLinecap="round" fill="none">
        <circle cx="80" cy="40" r="14" opacity={show(1)} style={fade} />
        <line x1="80" y1="54" x2="80" y2="92" opacity={show(2)} style={fade} />
        <line x1="80" y1="64" x2="61" y2="78" opacity={show(3)} style={fade} />
        <line x1="80" y1="64" x2="99" y2="78" opacity={show(4)} style={fade} />
        <line x1="80" y1="92" x2="63" y2="116" opacity={show(5)} style={fade} />
        <line x1="80" y1="92" x2="97" y2="116" opacity={show(6)} style={fade} />
      </g>
    </svg>
  );
}

export default function Hangman() {
  const { session: authSession, partner } = useAuth();
  const myId = authSession?.user?.id;
  const { session, updateState } = useGameSession('hangman', INITIAL_STATE);
  const onlineIds = useGamePresence('hangman', myId);
  const partnerOnline = !!partner?.id && onlineIds.includes(partner.id);

  const [draftWord, setDraftWord] = useState('');
  const [draftHint, setDraftHint] = useState('');
  const [error, setError] = useState('');

  if (!session) {
    return <div className="screen" style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 20 }}><p style={{ color: 'var(--muted)' }}>Carregando…</p></div>;
  }

  const state = { ...INITIAL_STATE, ...session.state };
  const myRole = session.owner_id === myId ? 'A' : 'B';
  const iAmSetter = state.setter === myRole;

  const word = state.word || '';
  const normWord = normalize(word);
  const guesses = state.guesses || [];

  const wrongGuesses = guesses.filter((g) => !normWord.includes(g));
  const errors = wrongGuesses.length;
  const lost = !!word && errors >= MAX_ERRORS;
  const won = !!word && !lost && [...normWord].every((ch) => !isLetter(ch) || guesses.includes(ch));
  const finished = won || lost;

  // O dono da palavra sempre vê a palavra; quem chuta só vê no fim da partida.
  const reveal = iAmSetter || finished;

  function handleSubmitWord(e) {
    e.preventDefault();
    const clean = draftWord.trim().replace(/\s+/g, ' ');
    if (!/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s-]*$/.test(clean)) {
      setError('Use só letras (espaço e hífen também valem).');
      return;
    }
    if (clean.replace(/[^A-Za-zÀ-ÿ]/g, '').length < 3) {
      setError('A palavra precisa ter pelo menos 3 letras.');
      return;
    }
    setError('');
    updateState({ ...state, word: clean, hint: draftHint.trim(), guesses: [] });
    setDraftWord('');
    setDraftHint('');
  }

  function handleGuess(letter) {
    if (iAmSetter || finished || !word || guesses.includes(letter)) return;
    updateState({ ...state, guesses: [...guesses, letter] });
  }

  // Puxa a vez de escolher a palavra pra mim. Só vale antes de a palavra
  // existir — e `startedBy` acompanha, pra próxima partida inverter certinho.
  function handleTakeTurn() {
    updateState({ ...state, setter: myRole, startedBy: myRole });
  }

  function handleRestart() {
    // Rodízio: quem chutou nesta partida escolhe a palavra da próxima.
    setDraftWord('');
    setDraftHint('');
    setError('');
    updateState(freshState(state.startedBy === 'A' ? 'B' : 'A'));
  }

  const partnerName = partner?.name || 'Seu par';

  let statusText;
  let statusHighlight = false;
  if (!word) {
    statusText = iAmSetter ? 'Escolha a palavra secreta' : `${partnerName} está escolhendo a palavra…`;
  } else if (won) {
    statusText = iAmSetter ? `${partnerName} adivinhou! 🎉` : 'Você adivinhou! 🎉';
    statusHighlight = true;
  } else if (lost) {
    statusText = iAmSetter ? `${partnerName} não conseguiu dessa vez!` : 'Enforcou! 😵';
    statusHighlight = true;
  } else {
    statusText = iAmSetter ? `Vez de ${partnerName} chutar` : 'Sua vez — escolha uma letra';
  }

  return (
    <div className="screen" style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 20 }}>
      <GameHeader
        title="Forca"
        description="Um dos dois escolhe uma palavra secreta (com uma dica, se quiser) e o outro vai chutando letras. Cada letra errada desenha uma parte do boneco — são 6 erros até enforcar. A cada partida vocês trocam quem escolhe a palavra."
        partnerName={partner?.name}
        partnerOnline={partnerOnline}
      />

      <p style={{ textAlign: 'center', color: statusHighlight ? 'var(--gold)' : 'var(--muted)', fontWeight: 700, marginBottom: 16 }}>
        {statusText}
      </p>

      {!word ? (
        iAmSetter ? (
          <form onSubmit={handleSubmitWord} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              className="field"
              value={draftWord}
              onChange={(e) => setDraftWord(e.target.value)}
              placeholder="Palavra secreta"
              maxLength={24}
              autoComplete="off"
              autoCapitalize="none"
              autoFocus
            />
            <input
              className="field"
              value={draftHint}
              onChange={(e) => setDraftHint(e.target.value)}
              placeholder="Dica (opcional)"
              maxLength={40}
              autoComplete="off"
            />
            {error && <p style={{ fontSize: 12.5, color: '#FF8E8E' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={!draftWord.trim()}>
              Mandar pra {partnerName}
            </button>
          </form>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
            <p style={{ fontSize: 34, marginBottom: 8 }}>🤫</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 16 }}>
              Assim que {partnerName} mandar a palavra, ela aparece aqui pra você chutar.
            </p>
            {/* Sem isso quem não está na vez fica travado esperando: se o par
                não estiver por perto, dá pra puxar a vez e escolher a palavra. */}
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={handleTakeTurn}>
              Deixa que eu escolho
            </button>
          </div>
        )
      ) : (
        <>
          <Gallows errors={errors} />

          <p className="eyebrow" style={{ textAlign: 'center', marginBottom: 14 }}>
            {errors} de {MAX_ERRORS} erros
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
            {[...word].map((ch, i) => {
              if (ch === ' ') return <span key={i} style={{ width: 12 }} />;
              const norm = normalize(ch);
              const pending = isLetter(norm) && !guesses.includes(norm);
              const hidden = pending && !reveal;
              const missed = lost && pending;
              // Pra quem escolheu a palavra: as letras que o par ainda não
              // descobriu ficam apagadas, então dá pra acompanhar o progresso
              // dele ao vivo em vez de ver a palavra inteira acesa.
              const dim = pending && iAmSetter && !finished;
              return (
                <span
                  key={i}
                  style={{
                    minWidth: 24, fontSize: 24, fontWeight: 800, textAlign: 'center',
                    borderBottom: '2.5px solid rgba(255,255,255,0.22)', paddingBottom: 2,
                    color: missed ? '#FF8E8E' : dim ? 'rgba(255,255,255,0.22)' : 'var(--cream)',
                    transition: 'color 0.25s ease'
                  }}
                >
                  {hidden ? ' ' : ch.toUpperCase()}
                </span>
              );
            })}
          </div>

          {state.hint && (
            <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--muted)', marginBottom: 16 }}>
              💡 {state.hint}
            </p>
          )}

          {!iAmSetter && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 20 }}>
              {ALPHABET.map((letter) => {
                const used = guesses.includes(letter);
                const hit = used && normWord.includes(letter);
                return (
                  <button
                    key={letter}
                    onClick={() => handleGuess(letter)}
                    disabled={used || finished}
                    className="card"
                    style={{
                      padding: 0, aspectRatio: '1/1', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontWeight: 800,
                      opacity: used ? 0.45 : 1,
                      color: !used ? 'var(--cream)' : hit ? 'var(--gold)' : '#FF8E8E'
                    }}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          )}

          {iAmSetter && (
            <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--muted)', marginBottom: 20 }}>
              {wrongGuesses.length ? `Erros: ${wrongGuesses.join(' · ')}` : 'Nenhum erro ainda.'}
            </p>
          )}

          <button className="btn btn-outline" style={{ width: '100%' }} onClick={handleRestart}>
            {finished ? 'Jogar de novo' : 'Reiniciar'}
          </button>
        </>
      )}

      {!partnerOnline && <InviteToPlay gameKey="forca" gameTitle="a Forca" />}
    </div>
  );
}
