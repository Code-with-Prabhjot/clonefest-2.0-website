import { useEffect, useRef } from "react";

const TEAL = "93,145,166";
const ICE = "179,224,242";
const MATRIX = "71,115,70";
const HEX_CHARS = "0123456789ABCDEF";

function manhattan(a, b) {
    const mid = Math.random() < 0.5 ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
    const pts = [a, mid, b];
    const segs = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
        const len = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
        segs.push({ from: pts[i], to: pts[i + 1], len, start: total });
        total += len;
    }
    return { pts, segs, total, flash: 0 };
}

function pointAt(tr, d) {
    if (d <= 0) return tr.pts[0];
    for (const s of tr.segs) {
        if (d <= s.start + s.len) {
            const t = s.len === 0 ? 0 : (d - s.start) / s.len;
            return {
                x: s.from.x + (s.to.x - s.from.x) * t,
                y: s.from.y + (s.to.y - s.from.y) * t,
            };
        }
    }
    return tr.pts[tr.pts.length - 1];
}

export default function BackgroundCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const mouse = { x: -9999, y: -9999 };
        let w = 0;
        let h = 0;
        let raf = 0;
        let frame = 0;
        let nodes = [];
        let traces = [];
        let pulses = [];
        let glyphs = [];
        let rings = [];

        const spawnPulse = (startAtZero) => ({
            tr: traces[(Math.random() * traces.length) | 0],
            d: startAtZero ? 0 : Math.random() * 400 * dpr,
            v: (0.35 + Math.random() * 0.85) * dpr,
            green: Math.random() < 0.45,
        });

        const build = () => {
            w = canvas.width = window.innerWidth * dpr;
            h = canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            const gap = 150 * dpr;
            const cols = Math.ceil(w / gap) + 1;
            const rows = Math.ceil(h / gap) + 1;
            nodes = [];
            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    nodes.push({
                        x: c * gap + (Math.random() - 0.5) * gap * 0.55,
                        y: r * gap + (Math.random() - 0.5) * gap * 0.55,
                        c,
                        r,
                    });
                }
            }
            const at = (c, r) => nodes.find((n) => n.c === c && n.r === r);
            traces = [];
            for (const n of nodes) {
                const right = at(n.c + 1, n.r);
                const down = at(n.c, n.r + 1);
                if (right && Math.random() < 0.55) traces.push(manhattan(n, right));
                if (down && Math.random() < 0.55) traces.push(manhattan(n, down));
            }
            pulses = Array.from({ length: 26 }, () => spawnPulse(false));
            glyphs = Array.from({ length: 64 }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                s: (0.15 + Math.random() * 0.35) * dpr,
                ch: HEX_CHARS[(Math.random() * 16) | 0],
                a: 0.08 + Math.random() * 0.14,
                size: (10 + Math.random() * 4) * dpr,
            }));
            const m = Math.min(w, h);
            rings = [
                { x: w * 0.82, y: h * 0.2, r: m * 0.34, off: 0, v: 0.35 * dpr, a: 0.14 },
                { x: w * 0.12, y: h * 0.85, r: m * 0.27, off: 40, v: -0.28 * dpr, a: 0.12 },
                { x: w * 0.5, y: h * 0.52, r: m * 0.52, off: 90, v: 0.18 * dpr, a: 0.07 },
            ];
        };

        const strokeTrace = (tr, style, width) => {
            ctx.strokeStyle = style;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(tr.pts[0].x, tr.pts[0].y);
            for (let i = 1; i < tr.pts.length; i++) ctx.lineTo(tr.pts[i].x, tr.pts[i].y);
            ctx.stroke();
        };

        const draw = () => {
            ctx.clearRect(0, 0, w, h);

            for (const tr of traces) {
                const mid = tr.pts[1];
                const md = Math.hypot(mid.x - mouse.x, mid.y - mouse.y);
                const boost = Math.max(0, 1 - md / (320 * dpr));
                strokeTrace(tr, `rgba(${TEAL},${0.13 + boost * 0.4})`, 1.2 * dpr);
                if (tr.flash > 0) {
                    strokeTrace(tr, `rgba(${MATRIX},${tr.flash * 0.55})`, 1.4 * dpr);
                    tr.flash -= 0.015;
                }
            }

            for (const ring of rings) {
                ctx.beginPath();
                ctx.setLineDash([5 * dpr, 16 * dpr]);
                ctx.lineDashOffset = ring.off;
                ctx.strokeStyle = `rgba(${TEAL},${ring.a})`;
                ctx.lineWidth = 1 * dpr;
                ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                ring.off += ring.v;
            }

            for (const n of nodes) {
                const md = Math.hypot(n.x - mouse.x, n.y - mouse.y);
                const boost = Math.max(0, 1 - md / (220 * dpr));
                const size = (2 + boost * 2.5) * dpr;
                ctx.fillStyle =
                    boost > 0.15
                        ? `rgba(${ICE},${0.25 + boost * 0.6})`
                        : `rgba(${TEAL},0.3)`;
                ctx.fillRect(n.x - size / 2, n.y - size / 2, size, size);
            }

            for (const p of pulses) {
                p.d += p.v;
                if (!p.tr || p.d > p.tr.total) {
                    Object.assign(p, spawnPulse(true));
                    continue;
                }
                const color = p.green ? MATRIX : ICE;
                for (let i = 4; i >= 0; i--) {
                    const pt = pointAt(p.tr, p.d - i * 7 * dpr);
                    const alpha = i === 0 ? 0.85 : 0.28 - i * 0.05;
                    ctx.fillStyle = `rgba(${color},${Math.max(alpha, 0.03)})`;
                    const r = (i === 0 ? 2.6 : 1.6) * dpr;
                    ctx.fillRect(pt.x - r / 2, pt.y - r / 2, r, r);
                }
            }

            ctx.textBaseline = "top";
            for (const g of glyphs) {
                g.y += g.s;
                if (g.y > h + 24) {
                    g.y = -24;
                    g.x = Math.random() * w;
                }
                if (Math.random() < 0.012) g.ch = HEX_CHARS[(Math.random() * 16) | 0];
                ctx.font = `${g.size}px "JetBrains Mono", monospace`;
                ctx.fillStyle = `rgba(${TEAL},${g.a})`;
                ctx.fillText(g.ch, g.x, g.y);
            }

            frame++;
            if (frame % 240 === 0 && traces.length > 0) {
                const tr = traces[(Math.random() * traces.length) | 0];
                const a = tr.pts[0];
                const b = tr.pts[tr.pts.length - 1];
                const rebuilt = manhattan(a, b);
                rebuilt.flash = 1;
                traces[traces.indexOf(tr)] = rebuilt;
            }
        };

        const loop = () => {
            draw();
            raf = requestAnimationFrame(loop);
        };

        const onMove = (e) => {
            mouse.x = e.clientX * dpr;
            mouse.y = e.clientY * dpr;
        };
        const onLeave = () => {
            mouse.x = -9999;
            mouse.y = -9999;
        };

        let resizeTimer;
        const onResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                build();
                if (reduced) draw();
            }, 150);
        };

        build();
        if (reduced) {
            draw();
        } else {
            loop();
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseout", onLeave);
        }
        window.addEventListener("resize", onResize);

        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(resizeTimer);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseout", onLeave);
            window.removeEventListener("resize", onResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            data-testid="background-canvas"
            aria-hidden="true"
            className="absolute inset-0 z-0"
        />
    );
}