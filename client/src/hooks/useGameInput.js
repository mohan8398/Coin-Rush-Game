import { useEffect, useRef } from 'react';
import { emitEvent } from '../services/socket';

export function useGameInput(active) {
  const keysRef = useRef({ up: false, down: false, left: false, right: false });
  const lastDirRef = useRef({ dx: 0, dy: 0 });

  useEffect(() => {
    if (!active) {
      keysRef.current = { up: false, down: false, left: false, right: false };
      lastDirRef.current = { dx: 0, dy: 0 };
      return;
    }

    const setKey = (code, val) => {
      switch (code) {
        case 'ArrowUp':
        case 'KeyW':
          keysRef.current.up = val;
          break;
        case 'ArrowDown':
        case 'KeyS':
          keysRef.current.down = val;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          keysRef.current.left = val;
          break;
        case 'ArrowRight':
        case 'KeyD':
          keysRef.current.right = val;
          break;
        default:
          break;
      }
    };

    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      setKey(e.code, true);
    };

    const handleKeyUp = (e) => {
      setKey(e.code, false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const interval = setInterval(() => {
      let dx = 0;
      let dy = 0;
      if (keysRef.current.left) dx -= 1;
      if (keysRef.current.right) dx += 1;
      if (keysRef.current.up) dy -= 1;
      if (keysRef.current.down) dy += 1;

      if (dx !== lastDirRef.current.dx || dy !== lastDirRef.current.dy) {
        emitEvent('player_input', { dx, dy });
        lastDirRef.current = { dx, dy };
      }
    }, 1000 / 20);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(interval);
    };
  }, [active]);

  const setDirection = (key, val) => {
    keysRef.current[key] = val;
  };

  return { setDirection };
}
