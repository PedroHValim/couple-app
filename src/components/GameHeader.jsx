import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from './Icons';

export default function GameHeader({ title, description }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Link to="/jogos" style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 999, padding: 8, display: 'flex', flexShrink: 0 }}>
          <ChevronLeftIcon width={18} height={18} />
        </Link>
        <div>
          <p className="eyebrow">jogos</p>
          <h1 style={{ fontSize: 22, marginTop: 2 }}>{title}</h1>
        </div>
      </div>
      {description && (
        <p style={{ fontSize: 12.5, color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 12px', lineHeight: 1.5 }}>
          {description}
        </p>
      )}
    </div>
  );
}
