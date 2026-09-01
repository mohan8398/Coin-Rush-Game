import React, { useEffect, useRef } from 'react';
import { useGameInput } from '../hooks/useGameInput';

export default function GameScreen({
  roomCode,
  players = [],
  collectibles = [],
  myId,
  worldConfig,
  remainingCoins,
}) {
  const canvasRef = useRef(null);
  const playersRef = useRef(new Map());
  const collectiblesRef = useRef(new Map());
  const particlesRef = useRef([]);
  const lastTickTimeRef = useRef(performance.now());
  const myIdRef = useRef(myId);
  const worldConfigRef = useRef(worldConfig);

  const { setDirection } = useGameInput(true);

  useEffect(() => {
    myIdRef.current = myId;
  }, [myId]);

  useEffect(() => {
    worldConfigRef.current = worldConfig;
  }, [worldConfig]);

  useEffect(() => {
    const newMap = new Map();
    collectibles.forEach((c) => {
      newMap.set(c.id, {
        ...c,
        animOffset: Math.random() * Math.PI * 2,
      });
    });
    collectiblesRef.current = newMap;
  }, [collectibles]);

  useEffect(() => {
    const seen = new Set();
    players.forEach((p) => {
      seen.add(p.id);
      const existing = playersRef.current.get(p.id);
      if (existing) {
        existing.prevX = existing.renderX ?? existing.x;
        existing.prevY = existing.renderY ?? existing.y;
        existing.x = p.x;
        existing.y = p.y;
        existing.score = p.score;
        existing.color = p.color;
        existing.username = p.username;
      } else {
        playersRef.current.set(p.id, {
          ...p,
          prevX: p.x,
          prevY: p.y,
          renderX: p.x,
          renderY: p.y,
        });
      }
    });

    for (const id of playersRef.current.keys()) {
      if (!seen.has(id)) playersRef.current.delete(id);
    }
    lastTickTimeRef.current = performance.now();
  }, [players]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let running = true;

    const TICK_MS = 1000 / (worldConfigRef.current?.tickRate || 20);

    const resizeCanvas = () => {
      const wrapper = canvas.parentElement;
      if (!wrapper) return;
      const ww = wrapper.clientWidth;
      const wh = wrapper.clientHeight;
      const w = worldConfigRef.current.worldWidth || 1200;
      const h = worldConfigRef.current.worldHeight || 750;

      const scale = Math.min(ww / w, wh / h, 1);
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = Math.floor(w * scale) + 'px';
      canvas.style.height = Math.floor(h * scale) + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 40;
    patternCanvas.height = 40;
    const pctx = patternCanvas.getContext('2d');
    pctx.fillStyle = '#0d0f1c';
    pctx.fillRect(0, 0, 40, 40);
    pctx.strokeStyle = 'rgba(255,255,255,0.025)';
    pctx.lineWidth = 1;
    pctx.beginPath();
    pctx.moveTo(40, 0);
    pctx.lineTo(40, 40);
    pctx.moveTo(0, 40);
    pctx.lineTo(40, 40);
    pctx.stroke();
    const tilePattern = ctx.createPattern(patternCanvas, 'repeat');

    const loop = (now) => {
      if (!running) return;

      const w = worldConfigRef.current.worldWidth || 1200;
      const h = worldConfigRef.current.worldHeight || 750;
      const alpha = Math.min((now - lastTickTimeRef.current) / TICK_MS, 1);

      for (const p of playersRef.current.values()) {
        p.renderX = p.prevX + (p.x - p.prevX) * alpha;
        p.renderY = p.prevY + (p.y - p.prevY) * alpha;
      }

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.15;
        pt.life -= 0.04;
        if (pt.life <= 0) particlesRef.current.splice(i, 1);
      }

      ctx.clearRect(0, 0, w, h);

      if (tilePattern) {
        ctx.fillStyle = tilePattern;
        ctx.fillRect(0, 0, w, h);
      }

      const vign = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8);
      vign.addColorStop(0, 'transparent');
      vign.addColorStop(1, 'rgba(5,6,12,0.55)');
      ctx.fillStyle = vign;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(108,99,255,0.25)';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, w - 4, h - 4);

      const t = now / 1000;
      const coinRadius = worldConfigRef.current.collectibleRadius || 14;
      for (const coin of collectiblesRef.current.values()) {
        const bob = Math.sin(t * 2.5 + coin.animOffset) * 3;
        const cx = coin.x;
        const cy = coin.y + bob;

        ctx.save();
        ctx.shadowColor = '#f7c948';
        ctx.shadowBlur = 18;

        const g = ctx.createRadialGradient(
          cx - coinRadius * 0.3,
          cy - coinRadius * 0.3,
          coinRadius * 0.05,
          cx,
          cy,
          coinRadius
        );
        g.addColorStop(0, '#fff6b0');
        g.addColorStop(0.4, '#f7c948');
        g.addColorStop(1, '#c8860a');

        ctx.beginPath();
        ctx.arc(cx, cy, coinRadius, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx - coinRadius * 0.2, cy - coinRadius * 0.25, coinRadius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fill();

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.font = `bold ${Math.round(coinRadius * 0.9)}px 'Space Grotesk', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', cx + 1, cy + 1);

        ctx.restore();
      }

      for (const pt of particlesRef.current) {
        ctx.globalAlpha = Math.max(pt.life, 0);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const playerRadius = worldConfigRef.current.playerRadius || 18;
      for (const p of playersRef.current.values()) {
        const px = p.renderX;
        const py = p.renderY;
        const isMe = p.id === myIdRef.current;

        ctx.save();
        ctx.shadowColor = p.color || '#6C63FF';
        ctx.shadowBlur = isMe ? 30 : 16;

        ctx.beginPath();
        ctx.arc(px, py, playerRadius, 0, Math.PI * 2);

        const bodyGrad = ctx.createRadialGradient(
          px - playerRadius * 0.3,
          py - playerRadius * 0.3,
          playerRadius * 0.05,
          px,
          py,
          playerRadius
        );
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(1, p.color || '#6C63FF');
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        if (isMe) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        ctx.shadowBlur = 0;

        const nameText = p.username || 'Player';
        const nameW = Math.min(ctx.measureText(nameText).width + 14, 120);
        const nameH = 18;
        const nameX = px - nameW / 2;
        const nameY = py - playerRadius - nameH - 5;

        ctx.fillStyle = 'rgba(8,10,18,0.75)';
        ctx.beginPath();
        ctx.roundRect(nameX, nameY, nameW, nameH, 5);
        ctx.fill();

        ctx.fillStyle = isMe ? '#fff' : 'rgba(232,234,246,0.9)';
        ctx.font = `${isMe ? 700 : 500} 11px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(nameText, px, nameY + nameH / 2);

        ctx.fillStyle = 'rgba(247,201,72,0.9)';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText(`${p.score || 0}`, px, py + playerRadius + 10);

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="screen active" id="screen-game">
      <div className="game-layout">
        <div className="canvas-wrapper" id="canvas-wrapper">
          <canvas id="game-canvas" ref={canvasRef}></canvas>
          <div className="canvas-overlay" id="canvas-overlay"></div>
        </div>

        <aside className="hud-sidebar">
          <div className="hud-room-info">
            <span className="hud-room-label">Room</span>
            <span className="hud-room-code" id="hud-room-code">
              {roomCode}
            </span>
          </div>

          <div className="hud-coins">
            <div>
              <div className="hud-coins-label">Coins Left</div>
              <div className="hud-coins-count" id="hud-coins-left">
                {remainingCoins}
              </div>
            </div>
          </div>

          <div className="hud-section-title">Live Scores</div>
          <div id="hud-leaderboard" className="hud-leaderboard">
            {sortedPlayers.map((p, i) => (
              <div key={p.id || i} className={`hud-lb-row ${p.id === myId ? 'is-me' : ''}`}>
                <span className="hud-lb-rank">#{i + 1}</span>
                <span className="hud-lb-dot" style={{ background: p.color || '#6C63FF' }}></span>
                <span className="hud-lb-name">{p.username}</span>
                <span className="hud-lb-score">{p.score || 0}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
