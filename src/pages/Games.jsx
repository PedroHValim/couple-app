import React from 'react';
import { Link } from 'react-router-dom';
import { GameIcon } from '../components/Icons';

const GAMES = [
  { key: 'velha', title: 'Jogo da velha', description: 'O clássico X e O, em tempo real, um contra o outro.' },
  { key: 'ppt', title: 'Pedra, papel e tesoura', description: 'Escolham ao mesmo tempo e vejam quem leva a rodada.' },
  { key: 'lig4', title: 'Lig-4', description: 'Alinhe 4 peças antes do seu par, num tabuleiro 7x6.' }
];

export default function Games() {
  return (
    <div className="screen">
      <div style={{ padding: '20px 20px 12px' }}>
        <p className="eyebrow">joguem juntos, de longe</p>
        <h1 style={{ fontSize: 24, marginTop: 4 }}>Jogos</h1>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {GAMES.map((g) => (
          <Link
            key={g.key}
            to={`/jogos/${g.key}`}
            className="card"
            style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(244,201,93,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GameIcon width={24} height={24} style={{ color: 'var(--gold)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 16 }}>{g.title}</h3>
              <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>{g.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
