'use client';

import Link from "next/link";
import { useEffect, useRef } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Sarabun', sans-serif;
    background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #ecfeff 100%);
    min-height: 100vh;
    overflow-x: hidden;
  }

  .topbar {
    position: sticky; top: 0; z-index: 50;
    backdrop-filter: blur(20px);
    background: rgba(255,255,255,0.72);
    border-bottom: 1px solid rgba(255,255,255,0.5);
    box-shadow: 0 1px 20px rgba(59,130,246,0.06);
  }
  .topbar-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 0 24px; height: 64px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .logo {
    font-family: 'DM Serif Display', serif;
    font-size: 18px; color: #1e40af; letter-spacing: -0.01em;
  }
  .login-btn {
    padding: 9px 22px; border-radius: 50px;
    background: linear-gradient(135deg, #3b82f6, #0ea5e9);
    color: white; font-family: 'Sarabun', sans-serif;
    font-size: 14px; font-weight: 600; text-decoration: none;
    box-shadow: 0 4px 14px rgba(59,130,246,0.35);
    transition: transform 0.18s, box-shadow 0.18s;
    display: inline-block;
  }
  .login-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(59,130,246,0.45);
  }

  .hero {
    position: relative; z-index: 10;
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; text-align: center;
    padding: 80px 24px 60px;
    min-height: calc(100vh - 64px);
  }
  .hero-tag {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(59,130,246,0.08);
    border: 1px solid rgba(59,130,246,0.2);
    border-radius: 50px; padding: 6px 16px;
    font-size: 12px; font-weight: 600; color: #3b82f6;
    letter-spacing: 0.06em; text-transform: uppercase;
    margin-bottom: 28px;
    animation: fadeUp 0.6s ease both;
  }
  .hero-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(38px, 7vw, 68px);
    color: #1e293b; line-height: 1.1; letter-spacing: -0.02em;
    animation: fadeUp 0.7s ease 0.1s both;
  }
  .hero-title span { color: #3b82f6; }
  .hero-sub {
    margin-top: 20px; max-width: 480px;
    font-size: 16px; line-height: 1.7; color: #64748b;
    animation: fadeUp 0.7s ease 0.2s both;
  }

  .card-wrap {
    margin-top: 48px; perspective: 1000px;
    animation: fadeUp 0.8s ease 0.3s both;
  }
  .glass-card {
    backdrop-filter: blur(20px);
    background: rgba(255,255,255,0.72);
    border: 1.5px solid rgba(255,255,255,0.7);
    box-shadow: 0 20px 60px rgba(59,130,246,0.12), 0 2px 0 rgba(255,255,255,0.8) inset;
    border-radius: 28px; padding: 40px 36px;
    max-width: 420px; width: 100%;
  }
  .card-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: linear-gradient(135deg, #3b82f6, #0ea5e9);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin-bottom: 16px;
    box-shadow: 0 8px 20px rgba(59,130,246,0.3);
  }
  .card-title {
    font-family: 'DM Serif Display', serif;
    font-size: 22px; color: #1e293b; margin-bottom: 10px;
  }
  .card-desc { font-size: 14px; line-height: 1.7; color: #64748b; }
  .card-cta {
    display: inline-block; margin-top: 24px;
    background: linear-gradient(135deg, #3b82f6, #0ea5e9);
    color: white; font-family: 'Sarabun', sans-serif;
    font-size: 15px; font-weight: 700; text-decoration: none;
    padding: 13px 28px; border-radius: 14px;
    box-shadow: 0 6px 20px rgba(59,130,246,0.35);
    transition: transform 0.18s, box-shadow 0.18s;
  }
  .card-cta:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 10px 28px rgba(59,130,246,0.45);
  }

  .features {
    display: flex; justify-content: center; gap: 12px;
    flex-wrap: wrap; margin-top: 40px;
    animation: fadeUp 0.8s ease 0.4s both;
  }
  .feature-pill {
    display: flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,0.65); backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.6);
    border-radius: 50px; padding: 8px 16px;
    font-size: 13px; color: #475569; font-weight: 500;
    box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  }
  .feature-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

  .footer {
    position: relative; z-index: 10;
    text-align: center; padding: 24px;
    font-size: 12px; color: #94a3b8;
  }


  .svg-bg {
    position: fixed; inset: 0; width: 100%; height: 100%;
    opacity: 0.18; pointer-events: none; z-index: 0;
    transition: transform 0.4s ease;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ripple {
    0%   { width: 80px;  height: 80px;  opacity: 0.6; }
    100% { width: 700px; height: 700px; opacity: 0; }
  }
`;

function useParallax() {
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 18;
      const y = (e.clientY / window.innerHeight - 0.5) * 18;
      const bg = document.getElementById("network-bg");
      if (bg) bg.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
}

function NetworkBackground() {
  const nodes: [number, number][] = [
    [120, 180], [310, 100], [520, 280], [680, 130],
    [420, 430], [200, 380], [600, 400], [760, 310],
  ];
  const edges: [number, number][] = [
    [0,1],[1,2],[2,3],[1,4],[4,5],[2,6],[6,7],[3,7],[5,0],[4,6],
  ];
  return (
    <svg id="network-bg" className="svg-bg" viewBox="0 0 900 600" fill="none">
      {edges.map(([a, b], i) => (
        <line key={i}
          x1={nodes[a][0]} y1={nodes[a][1]}
          x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="#3b82f6" strokeWidth="1"
        />
      ))}
      {nodes.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i === 0 ? 6 : 4} fill="#3b82f6" />
      ))}
    </svg>
  );
}

function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const card = ref.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const rx = ((e.clientY - top - height / 2) / height) * 12;
    const ry = ((e.clientX - left - width / 2) / width) * -12;
    card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "rotateX(0deg) rotateY(0deg)";
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ transformStyle: "preserve-3d", transition: "transform 0.2s ease" }}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  useParallax();

  const features = [
    { emoji: "🔔", label: "แจ้งเตือนอัตโนมัติ", color: "#10b981" },
    { emoji: "🤝", label: "ประสานงานทีมดูแล", color: "#f59e0b" },
  ];

  return (
    <>
      <style>{styles}</style>

      <NetworkBackground />
      <div className="pulse-wrap">
        <div className="ring" />
        <div className="ring" />
        <div className="ring" />
      </div>

      <nav className="topbar">
        <div className="topbar-inner">
          <span className="logo">Community Care Hub</span>
          <Link href="/login" className="login-btn">
            เข้าสู่ระบบผู้ดูแล
          </Link>
        </div>
      </nav>

      <main className="hero">
        <div className="hero-tag">
          <span>●</span> ระบบดูแลชุมชนอัจฉริยะ
        </div>

        <h2 className="hero-title">
          Smart Care<br />
          <span>for Communities</span>
        </h2>

        <p className="hero-sub">
          ระบบติดตามและจัดการการดูแลชุมชน ช่วยให้เจ้าหน้าที่
          ดูข้อมูล แจ้งเตือน และสื่อสารกับผู้ดูแลได้อย่างมีประสิทธิภาพ
        </p>

        <div className="card-wrap">
          <TiltCard>
            <div className="glass-card">
              <h3 className="card-title">Care Monitoring System</h3>
              <p className="card-desc">
                ระบบช่วยติดตามข้อมูลการดูแล แจ้งเตือนอัตโนมัติ
                และช่วยให้การประสานงานในชุมชนเป็นเรื่องง่าย
              </p>
              <Link href="/login" className="card-cta">
                เริ่มใช้งานระบบ →
              </Link>
            </div>
          </TiltCard>
        </div>

        <div className="features">
          {features.map(({ emoji, label, color }) => (
            <div key={label} className="feature-pill">
              <span className="feature-dot" style={{ background: color }} />
              {emoji} {label}
            </div>
          ))}
        </div>
      </main>

      <footer className="footer">
        Community Care Hub © 2026
      </footer>
    </>
  );
}