import { useCallback, useRef } from 'react';

// Dispara onLongPress ao segurar por `delay`ms (dedo ou mouse).
// Cancela se o dedo se mover (rolando a lista) ou soltar antes da hora,
// e bloqueia o clique/navegação normal que teria disparado no soltar.
export function useLongPress(onLongPress, { delay = 550, moveThreshold = 10 } = {}) {
  const timerRef = useRef(null);
  const firedRef = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const clear = useCallback(() => {
    clearTimeout(timerRef.current);
  }, []);

  const start = useCallback((e) => {
    firedRef.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
    clear();
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      if (navigator.vibrate) navigator.vibrate(15);
      onLongPress(e);
    }, delay);
  }, [onLongPress, delay, clear]);

  const move = useCallback((e) => {
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.hypot(dx, dy) > moveThreshold) clear();
  }, [clear, moveThreshold]);

  return {
    onPointerDown: start,
    onPointerMove: move,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (e) => e.preventDefault(),
    onClickCapture: (e) => {
      if (firedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        firedRef.current = false;
      }
    },
    style: { WebkitTouchCallout: 'none', userSelect: 'none', touchAction: 'manipulation' }
  };
}
