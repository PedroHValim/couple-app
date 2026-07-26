import React from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useGameSession } from '../../lib/useGameSession';
import { useGamePresence } from '../../lib/useGamePresence';
import GameHeader from '../../components/GameHeader';
import InviteToPlay from '../../components/InviteToPlay';

const COLS = 7;
const ROWS = 6;
const idx = (row, col) => row * COLS + col;

const LINES = (() => {
  const lines = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) lines.push([idx(r, c), idx(r, c + 1), idx(r, c + 2), idx(r, c + 3)]);
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) lines.push([idx(r, c), idx(r + 1, c), idx(r + 2, c), idx(r + 3, c)]);
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) lines.push([idx(r, c), idx(r + 1, c + 1), idx(r + 2, c + 2), idx(r + 3, c + 3)]);
  }
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) lines.push([idx(r, c), idx(r - 1, c + 1), idx(r - 2, c + 2), idx(r - 3, c + 3)]);
  }
  return lines;
})();

function computeWinner(board) {
  for (const [a, b, c, d] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c] && board[a] === board[d]) return board[a];
  }
  if (board.every(Boolean)) return 'draw';
  return null;
}

function dropInColumn(board, col, symbol) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[idx(r, col)]) {
      const next = board.slice();
      next[idx(r, col)] = symbol;
      return next;
    }
  }
  return null;
}

const INITIAL_STATE = { board: Array(COLS * ROWS).fill(null), turn: 'X' };

export default function ConnectFour() {
  const { session: authSession, partner } = useAuth();
  const myId = authSession?.user?.id;
  const { session, updateState } = useGameSession('lig4', INITIAL_STATE);
  const onlineIds = useGamePresence('lig4', myId);
  const partnerOnline = !!partner?.id && onlineIds.includes(partner.id);

  if (!session) {
    return <div className="screen" style={{ padding: 20 }}><p style={{ color: 'var(--muted)' }}>Carregando…</p></div>;
  }

  const mySymbol = session.owner_id === myId ? 'X' : 'O';
  const { board, turn } = session.state;
  const winner = computeWinner(board);

  function handleColumnClick(col) {
    if (winner || turn !== mySymbol) return;
    const nextBoard = dropInColumn(board, col, mySymbol);
    if (!nextBoard) return; // coluna cheia
    updateState({ board: nextBoard, turn: mySymbol === 'X' ? 'O' : 'X' });
  }

  function handleRestart() {
    updateState(INITIAL_STATE);
  }

  let statusText;
  if (winner === 'draw') statusText = 'Empate!';
  else if (winner) statusText = winner === mySymbol ? 'Você venceu! 🎉' : 'Seu par venceu!';
  else statusText = turn === mySymbol ? 'Sua vez' : 'Vez do seu par';

  return (
    <div className="screen" style={{ padding: 20, paddingTop: 'calc(20px + env(safe-area-inset-top))' }}>
      <GameHeader
        title="Lig-4"
        description="Toquem numa coluna pra soltar sua peça (🟡 ou 🟣) — ela cai até o espaço vazio mais baixo. Quem alinhar 4 peças primeiro (horizontal, vertical ou diagonal) vence."
        partnerName={partner?.name}
        partnerOnline={partnerOnline}
      />

      <p style={{ textAlign: 'center', color: winner ? 'var(--gold)' : 'var(--muted)', fontWeight: 700, marginBottom: 16 }}>
        {statusText} — você é {mySymbol === 'X' ? '🟡' : '🟣'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 5, maxWidth: 350, margin: '0 auto 24px', background: 'rgba(255,255,255,0.04)', padding: 6, borderRadius: 14 }}>
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleColumnClick(i % COLS)}
            disabled={!!winner || turn !== mySymbol}
            style={{
              aspectRatio: '1/1',
              borderRadius: '50%',
              border: 'none',
              background: cell === 'X' ? 'var(--gold)' : cell === 'O' ? 'var(--lavender)' : 'rgba(255,255,255,0.06)',
              padding: 0
            }}
          />
        ))}
      </div>

      <button className="btn btn-outline" style={{ width: '100%' }} onClick={handleRestart}>Reiniciar</button>
      {!partnerOnline && <InviteToPlay gameKey="lig4" gameTitle="Lig-4" />}
    </div>
  );
}
