import { useCallback, useRef } from 'react';

// Dispara onLongPress ao segurar por `delay`ms (dedo ou mouse).
// Cancela se o dedo se mover (rolando a lista) ou soltar antes da hora.
// wasLongPress() diz pro chamador se deve ignorar o clique normal que
// seguiria o toque (ex: não navegar se acabou de apagar).
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

  const wasLongPress = useCallback(() => {
    const fired = firedRef.current;
    firedRef.current = false;
    return fired;
  }, []);

  return {
    handlers: {
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
      onContextMenu: (e) => e.preventDefault(),
      style: { WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'manipulation' }
    },
    wasLongPress
  };
}
