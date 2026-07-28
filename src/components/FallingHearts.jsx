import React, { useMemo } from 'react';

// Decoração de aniversário de namoro: corações caindo do topo da tela.
// pointerEvents 'none' pra não atrapalhar nenhum toque por baixo.
export default function FallingHearts() {
  const hearts = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 5 + Math.random() * 4,
    size: 14 + Math.random() * 14,
    emoji: Math.random() > 0.5 ? '💛' : '❤️'
  })), []);

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 'min(480px, 100vw)', height: '100vh',
        pointerEvents: 'none', overflow: 'hidden', zIndex: 60
      }}
    >
      {hearts.map((h) => (
        <span
          key={h.id}
          style={{
            position: 'absolute',
            top: -40,
            left: `${h.left}%`,
            fontSize: h.size,
            animation: `fall-heart ${h.duration}s linear ${h.delay}s infinite`
          }}
        >
          {h.emoji}
        </span>
      ))}
    </div>
  );
}
