"use client";

import { useRef, useEffect } from "react";

/**
 * Animated hexagonal grid background.
 * Auto-adapts to light/dark mode via `html.dark` class detection.
 * Usage: place as a sibling of your content inside a `relative` container.
 */
export function HexGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;

    function resize() {
      width = canvas!.parentElement?.clientWidth ?? window.innerWidth;
      height = canvas!.parentElement?.clientHeight ?? window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const hexSize = 40;
    const hexH = hexSize * Math.sqrt(3);

    function isDark() {
      return document.documentElement.classList.contains("dark");
    }

    function drawHex(cx: number, cy: number, alpha: number, pulse: number) {
      const dark = isDark();
      const mult = dark ? 1 : 0.35;
      ctx!.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + (hexSize * 0.9 + pulse * 2) * Math.cos(angle);
        const y = cy + (hexSize * 0.9 + pulse * 2) * Math.sin(angle);
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.closePath();
      ctx!.strokeStyle = `rgba(139, 92, 246, ${(0.08 + alpha * 0.12) * mult})`;
      ctx!.lineWidth = 0.8;
      ctx!.stroke();

      if (alpha > 0.3) {
        ctx!.fillStyle = `rgba(139, 92, 246, ${alpha * 0.04 * mult})`;
        ctx!.fill();
      }
    }

    let time = 0;
    function animate() {
      time += 0.005;
      ctx!.clearRect(0, 0, width, height);

      for (let row = -1; row < height / hexH + 1; row++) {
        for (let col = -1; col < width / (hexSize * 1.5) + 1; col++) {
          const cx = col * hexSize * 1.5;
          const cy = row * hexH + (col % 2 === 0 ? 0 : hexH / 2);
          const dist = Math.sqrt((cx - width / 2) ** 2 + (cy - height / 2) ** 2);
          const wave = Math.sin(dist * 0.008 - time * 2) * 0.5 + 0.5;
          const pulse = Math.sin(time * 3 + dist * 0.01) * 0.5 + 0.5;
          drawHex(cx, cy, wave, pulse);
        }
      }

      // Center glow
      const dark = isDark();
      const gm = dark ? 1 : 0.3;
      const grad = ctx!.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 300);
      grad.addColorStop(0, `rgba(139, 92, 246, ${(0.06 + Math.sin(time) * 0.02) * gm})`);
      grad.addColorStop(0.5, `rgba(99, 102, 241, ${(0.03 + Math.sin(time * 1.5) * 0.01) * gm})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, width, height);

      animRef.current = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />;
}
