import React from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useGameSession } from '../../lib/useGameSession';
import { useGamePresence } from '../../lib/useGamePresence';
import GameHeader from '../../components/GameHeader';
import InviteToPlay from '../../components/InviteToPlay';

const OPTIONS = [
  { key: 'pedra', label: 'Pedra', emoji: '🪨' },
  { key: 'papel', label: 'Papel', emoji: '📄' },
  { key: 'tesoura', label: 'Tesoura', emoji: '✂️' }
];
const BEATS = { pedra: 'tesoura', papel: 'pedra', tesoura: 'papel' };

function computeResult(ownerChoice, partnerChoice) {
  if (!ownerChoice || !partnerChoice) return null;
  if (ownerChoice === partnerChoice) return 'draw';
  return BEATS[ownerChoice] === partnerChoice ? 'owner' : 'partner';
}

const INITIAL_STATE = { ownerChoice: null, partnerChoice: null };

export default function RockPaperScissors() {
  const { session: authSession, partner } = useAuth();
  const myId = authSession?.user?.id;
  const { session, updateState } = useGameSession('ppt', INITIAL_STATE);
  const onlineIds = useGamePresence('ppt', myId);
  const partnerOnline = !!partner?.id && onlineIds.includes(partner.id);

  if (!session) {
    return <div className="screen" style={{ padding: 20 }}><p style={{ color: 'var(--muted)' }}>Carregando…</p></div>;
  }

  const isOwner = session.owner_id === myId;
  const { ownerChoice, partnerChoice } = session.state;
  const myChoice = isOwner ? ownerChoice : partnerChoice;
  const theirChoice = isOwner ? partnerChoice : ownerChoice;
  const result = computeResult(ownerChoice, partnerChoice);

  function choose(key) {
    if (myChoice) return;
    updateState(isOwner ? { ownerChoice: key, partnerChoice } : { ownerChoice, partnerChoice: key });
  }

  function playAgain() {
    updateState(INITIAL_STATE);
  }

  let statusText;
  if (result === 'draw') statusText = 'Empate!';
  else if (result) statusText = (result === 'owner') === isOwner ? 'Você venceu! 🎉' : 'Seu par venceu!';
  else if (myChoice) statusText = 'Aguardando seu par escolher…';
  else statusText = 'Escolha sua jogada';

  return (
    <div className="screen" style={{ padding: 20 }}>
      <GameHeader
        title="Pedra, papel e tesoura"
        description="Os dois escolhem ao mesmo tempo, sem ver a jogada um do outro. Pedra ganha de tesoura, tesoura ganha de papel, papel ganha de pedra. Escolha igual é empate."
        partnerName={partner?.name}
        partnerOnline={partnerOnline}
      />

      <p style={{ textAlign: 'center', color: result ? 'var(--gold)' : 'var(--muted)', fontWeight: 700, marginBottom: 22 }}>
        {statusText}
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 28 }}>
        <PlayerSlot label="Você" choice={myChoice} reveal />
        <div style={{ fontSize: 22, color: 'var(--muted)', alignSelf: 'center' }}>×</div>
        <PlayerSlot label="Seu par" choice={theirChoice} reveal={!!myChoice} />
      </div>

      {!myChoice ? (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => choose(o.key)}
              className="card"
              style={{ flex: 1, maxWidth: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px 6px', border: 'none' }}
            >
              <span style={{ fontSize: 30 }}>{o.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{o.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <button className="btn btn-outline" style={{ width: '100%' }} onClick={playAgain}>
          {result ? 'Jogar de novo' : 'Reiniciar'}
        </button>
      )}
      {!partnerOnline && <InviteToPlay gameKey="ppt" gameTitle="Pedra, papel e tesoura" />}
    </div>
  );
}

function PlayerSlot({ label, choice, reveal }) {
  const emoji = choice ? OPTIONS.find((o) => o.key === choice)?.emoji : null;
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="card" style={{ width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, border: 'none' }}>
        {choice ? (reveal ? emoji : '🤔') : '—'}
      </div>
      <p className="eyebrow" style={{ marginTop: 6 }}>{label}</p>
    </div>
  );
}
