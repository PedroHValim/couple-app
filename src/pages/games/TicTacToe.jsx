import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { useGameSession } from '../../lib/useGameSession';
import { ChevronLeftIcon } from '../../components/Icons';

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function computeWinner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every(Boolean)) return 'draw';
  return null;
}

const INITIAL_STATE = { board: Array(9).fill(null), turn: 'X' };

export default function TicTacToe() {
  const { session: authSession } = useAuth();
  const myId = authSession?.user?.id;
  const { session, updateState } = useGameSession('tictactoe', INITIAL_STATE);

  if (!session) {
    return <div className="screen" style={{ padding: 20 }}><p style={{ color: 'var(--muted)' }}>Carregando…</p></div>;
  }

  const mySymbol = session.owner_id === myId ? 'X' : 'O';
  const { board, turn } = session.state;
  const winner = computeWinner(board);

  function handleClick(i) {
    if (board[i] || winner || turn !== mySymbol) return;
    const nextBoard = [...board];
    nextBoard[i] = mySymbol;
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
    <div className="screen" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Link to="/jogos" style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 999, padding: 8, display: 'flex' }}>
          <ChevronLeftIcon width={18} height={18} />
        </Link>
        <div>
          <p className="eyebrow">jogos</p>
          <h1 style={{ fontSize: 22, marginTop: 2 }}>Jogo da velha</h1>
        </div>
      </div>

      <p style={{ textAlign: 'center', color: winner ? 'var(--gold)' : 'var(--muted)', fontWeight: 700, marginBottom: 18 }}>
        {statusText} — você é {mySymbol}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 300, margin: '0 auto 24px' }}>
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className="card"
            disabled={!!cell || !!winner || turn !== mySymbol}
            style={{
              aspectRatio: '1/1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 800,
              color: cell === 'X' ? 'var(--gold)' : 'var(--lavender)',
              border: 'none'
            }}
          >
            {cell}
          </button>
        ))}
      </div>

      <button className="btn btn-outline" style={{ width: '100%' }} onClick={handleRestart}>Reiniciar</button>
    </div>
  );
}
