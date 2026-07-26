import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from './Icons';

export default function GameHeader({ title, description, partnerName, partnerOnline }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Link to="/jogos" style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 999, padding: 8, display: 'flex', flexShrink: 0 }}>
          <ChevronLeftIcon width={18} height={18} />
        </Link>
        <div style={{ flex: 1 }}>
          <p className="eyebrow">jogos</p>
          <h1 style={{ fontSize: 22, marginTop: 2 }}>{title}</h1>
        </div>
        {partnerName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--muted)' }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: partnerOnline ? '#6FDD8B' : 'rgba(255,255,255,0.25)',
              boxShadow: partnerOnline ? '0 0 6px #6FDD8B' : 'none'
            }} />
            {partnerName} {partnerOnline ? 'aqui agora' : 'fora da tela'}
          </div>
        )}
      </div>
      {description && (
        <p style={{ fontSize: 12.5, color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 12px', lineHeight: 1.5 }}>
          {description}
        </p>
      )}
    </div>
  );
}
