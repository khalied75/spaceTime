import { useState, useEffect, useRef, useCallback } from "react";

const STAR_COUNT = 180;

function generateStars() {
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    r: Math.random() * 1.5 + 0.3,
    opacity: Math.random() * 0.7 + 0.2,
    twinkleDelay: Math.random() * 4,
  }));
}

const stars = generateStars();

function SpacetimeGrid({ mass, distortion }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const timeRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const rows = 22;
    const cols = 22;
    const spacingX = W / (cols - 1);
    const spacingY = H / (rows - 1);

    timeRef.current += 0.012;
    const t = timeRef.current;

    // Build warped grid points
    const getWarp = (gx, gy) => {
      const dx = gx - cx;
      const dy = gy - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const maxDist = Math.sqrt(cx * cx + cy * cy);
      const normalizedDist = dist / maxDist;
      const warpStrength = (distortion / 100) * mass * 0.012;
      const falloff = Math.exp(-normalizedDist * 2.5);
      const warpAmount = warpStrength * falloff * 320;
      // Pulse
      const pulse = Math.sin(t - dist * 0.015) * 0.12 * falloff * (distortion / 100);
      const wx = gx - (dx / dist) * warpAmount * (1 + pulse);
      const wy = gy - (dy / dist) * warpAmount * (1 + pulse);
      return { x: wx, y: wy };
    };

    // Draw grid lines
    const alpha = 0.18 + (distortion / 100) * 0.22;

    // Horizontal lines
    for (let row = 0; row < rows; row++) {
      const gy = row * spacingY;
      ctx.beginPath();
      for (let col = 0; col < cols; col++) {
        const gx = col * spacingX;
        const { x, y } = getWarp(gx, gy);
        const dx = gx - cx;
        const dy2 = gy - cy;
        const dist = Math.sqrt(dx * dx + dy2 * dy2);
        const maxDist = Math.sqrt(cx * cx + cy * cy);
        const closeness = 1 - Math.min(dist / maxDist, 1);
        const lineAlpha = alpha + closeness * 0.35;
        if (col === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      const rowCenter = Math.abs(row - rows / 2) / (rows / 2);
      const la = alpha + (1 - rowCenter) * 0.2;
      ctx.strokeStyle = `rgba(140, 80, 255, ${la})`;
      ctx.lineWidth = 0.7 + (1 - rowCenter) * 0.5;
      ctx.stroke();
    }

    // Vertical lines
    for (let col = 0; col < cols; col++) {
      const gx = col * spacingX;
      ctx.beginPath();
      for (let row = 0; row < rows; row++) {
        const gy = row * spacingY;
        const { x, y } = getWarp(gx, gy);
        if (row === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      const colCenter = Math.abs(col - cols / 2) / (cols / 2);
      const la = alpha + (1 - colCenter) * 0.2;
      ctx.strokeStyle = `rgba(100, 60, 210, ${la})`;
      ctx.lineWidth = 0.7 + (1 - colCenter) * 0.5;
      ctx.stroke();
    }

    // Black hole glow layers
    const bhRadius = (distortion / 100) * mass * 0.38 + 18;
    const glowCount = 5;
    for (let i = glowCount; i >= 0; i--) {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, bhRadius * (1 + i * 0.9));
      const gAlpha = 0.13 - i * 0.02;
      grad.addColorStop(0, `rgba(110, 40, 255, ${gAlpha + 0.1})`);
      grad.addColorStop(0.4, `rgba(60, 10, 140, ${gAlpha})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, bhRadius * (1 + i * 0.9), 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Event horizon ring
    const ringGrad = ctx.createRadialGradient(cx, cy, bhRadius * 0.7, cx, cy, bhRadius * 1.1);
    ringGrad.addColorStop(0, "rgba(180,100,255,0.18)");
    ringGrad.addColorStop(0.6, "rgba(120,50,255,0.28)");
    ringGrad.addColorStop(1, "rgba(80,20,180,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, bhRadius * 1.05, 0, Math.PI * 2);
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = bhRadius * 0.35;
    ctx.stroke();

    // Core black hole
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, bhRadius);
    coreGrad.addColorStop(0, "rgba(0,0,0,1)");
    coreGrad.addColorStop(0.7, "rgba(5,0,20,1)");
    coreGrad.addColorStop(1, "rgba(10,0,40,0.85)");
    ctx.beginPath();
    ctx.arc(cx, cy, bhRadius, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // Accretion glow flicker
    const flickerA = 0.09 + Math.sin(t * 3.1) * 0.04;
    const accGrad = ctx.createRadialGradient(cx, cy, bhRadius * 0.9, cx, cy, bhRadius * 1.6);
    accGrad.addColorStop(0, `rgba(200,120,255,${flickerA})`);
    accGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, bhRadius * 1.6, 0, Math.PI * 2);
    ctx.fillStyle = accGrad;
    ctx.fill();

    animFrameRef.current = requestAnimationFrame(draw);
  }, [mass, distortion]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

function getMassLabel(mass) {
  if (mass < 20) return { ar: "نجم صغير", en: "Small Star", color: "#64b5f6" };
  if (mass < 40) return { ar: "نجم متوسط", en: "Medium Star", color: "#81c784" };
  if (mass < 60) return { ar: "نجم عملاق", en: "Giant Star", color: "#ffb74d" };
  if (mass < 80) return { ar: "نجم نيوتروني", en: "Neutron Star", color: "#f06292" };
  return { ar: "ثقب أسود", en: "Black Hole", color: "#ce93d8" };
}

 function App() {
  const [mass, setMass] = useState(50);
  const [distortion, setDistortion] = useState(70);
  const massLabel = getMassLabel(mass);

  const curvaturePercent = Math.round((mass * distortion) / 100);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#04020d",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        fontFamily: "'Cairo', 'Segoe UI', sans-serif",
        color: "#e0d8ff",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(140,80,255,0.5); }
          70% { box-shadow: 0 0 0 18px rgba(140,80,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(140,80,255,0); }
        }
        @keyframes rotateOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbitCounter {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

        .stat-card {
          background: rgba(20, 8, 50, 0.7);
          border: 1px solid rgba(140, 80, 255, 0.25);
          border-radius: 14px;
          padding: 14px 18px;
          backdrop-filter: blur(12px);
          animation: fadeUp 0.6s ease both;
          transition: border-color 0.3s;
        }
        .stat-card:hover {
          border-color: rgba(140, 80, 255, 0.55);
        }

        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          height: 5px;
          border-radius: 99px;
          outline: none;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #9c5fff;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(140,80,255,0.8);
          animation: pulseRing 2s infinite;
          border: 2px solid #e0d0ff;
        }
        input[type=range].mass-range {
          background: linear-gradient(to right, #3a1a80 0%, #9c5fff 100%);
        }
        input[type=range].dist-range {
          background: linear-gradient(to right, #1a3a80 0%, #5fa8ff 100%);
        }

        .info-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(140, 80, 255, 0.15);
          border: 1px solid rgba(140, 80, 255, 0.3);
          border-radius: 99px;
          padding: 4px 12px;
          font-size: 11px;
          color: #c4a8ff;
          font-family: 'Cairo', sans-serif;
        }

        .theory-point {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(140,80,255,0.1);
          animation: fadeUp 0.7s ease both;
        }
        .theory-point:last-child { border-bottom: none; }

        .dot-icon {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #9c5fff;
          margin-top: 6px;
          flex-shrink: 0;
          box-shadow: 0 0 8px rgba(140,80,255,0.8);
        }

        .progress-bar-track {
          width: 100%;
          height: 8px;
          background: rgba(255,255,255,0.07);
          border-radius: 99px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, #5a1fff, #c06fff);
          transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 0 12px rgba(140,80,255,0.5);
        }

        .orbit-container {
          position: relative;
          width: 60px;
          height: 60px;
          flex-shrink: 0;
        }
        .orbit-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1.5px solid rgba(140,80,255,0.35);
          animation: rotateOrbit 4s linear infinite;
        }
        .orbit-dot {
          position: absolute;
          width: 7px;
          height: 7px;
          background: #9c5fff;
          border-radius: 50%;
          top: -3.5px;
          left: calc(50% - 3.5px);
          box-shadow: 0 0 8px rgba(140,80,255,0.9);
          animation: orbitCounter 4s linear infinite;
        }
        .orbit-core {
          position: absolute;
          inset: 30%;
          border-radius: 50%;
          background: radial-gradient(circle, #2a0a60, #0a0020);
          box-shadow: 0 0 18px rgba(140,80,255,0.5);
        }
      `}</style>

      {/* Stars background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {stars.map((s) => (
          <div
            key={s.id}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.r * 2}px`,
              height: `${s.r * 2}px`,
              borderRadius: "50%",
              background: "white",
              opacity: s.opacity,
              animation: `twinkle ${2 + s.twinkleDelay}s ease-in-out infinite`,
              animationDelay: `${s.twinkleDelay}s`,
            }}
          />
        ))}
      </div>

      {/* Nebula glow background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(60,10,120,0.22) 0%, transparent 70%)",
      }} />

      {/* Main content */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 460,
        padding: "24px 18px 40px",
        display: "flex", flexDirection: "column", gap: 20,
      }}>

        {/* Header */}
        <div style={{ textAlign: "right", animation: "fadeUp 0.5s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#e8daff", lineHeight: 1.2 }}>
                🌌 انحناء غشاء الزمكان
              </div>
              <div style={{ fontSize: 13, color: "#9c7fcc", fontWeight: 300, marginTop: 2 }}>
                Spacetime Curvature
              </div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "#8a78a8", lineHeight: 1.8, textAlign: "right", marginTop: 8 }}>
            انحناء الزمكان من الأساس لنظرية النسبية العامة، حيث تشوّه الكتلة والطاقة نسيج الفضاء-الزمان، مما يخلق تأثير الجاذبية على حركة الأجسام.
          </p>
        </div>

        {/* Canvas */}
        <div style={{
          position: "relative",
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(140,80,255,0.2)",
          background: "rgba(4, 1, 18, 0.9)",
          height: 300,
          boxShadow: "0 0 60px rgba(100,40,200,0.2), inset 0 0 40px rgba(0,0,0,0.6)",
        }}>
          <SpacetimeGrid mass={mass} distortion={distortion} />
          {/* Label overlay */}
          <div style={{
            position: "absolute", bottom: 10, left: 10,
            fontSize: 9, color: "rgba(140,80,255,0.4)",
            fontFamily: "'Cairo', sans-serif",
            letterSpacing: "0.08em",
          }}>
            محاكاة انحناء نسيج الزمكان
          </div>
        </div>

        {/* Theory points */}
        <div style={{ background: "rgba(15,5,40,0.6)", borderRadius: 14, padding: "14px 16px", border: "1px solid rgba(140,80,255,0.15)" }}>
          <div className="theory-point" style={{ animationDelay: "0.1s" }}>
            <div className="dot-icon" />
            <div>
              <div style={{ fontSize: 12, color: "#c4a8ff", fontWeight: 700, marginBottom: 3 }}>
                التسبة العامة: الكتلة تنحني الفضاء كما تنحني قوة بلا اتجاه في سير الزمكان
              </div>
            </div>
          </div>
          <div className="theory-point" style={{ animationDelay: "0.2s" }}>
            <div className="dot-icon" style={{ background: "#5fa8ff" }} />
            <div>
              <div style={{ fontSize: 12, color: "#a8c8ff", fontWeight: 700, marginBottom: 3 }}>
                القياس: الأجسام تتبع مسارات جيوديسية حيث يبدو الحركة حول الكتل الكبيرة
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Mass Slider */}
          <div className="stat-card" style={{ animationDelay: "0.15s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="orbit-container">
                  <div className="orbit-ring">
                    <div className="orbit-dot" />
                  </div>
                  <div className="orbit-core" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#8a78a8" }}>الكتلة والتشويه</div>
                  <div style={{ fontSize: 10, color: "#6a5a88", marginTop: 1 }}>(Mass and Distortion)</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: massLabel.color }}>{mass}</div>
                <div style={{ fontSize: 9, color: massLabel.color, opacity: 0.8 }}>{massLabel.ar}</div>
              </div>
            </div>
            <input
              type="range" min={1} max={100} value={mass}
              onChange={(e) => setMass(Number(e.target.value))}
              className="mass-range"
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, color: "#5a4a78" }}>
              <span>1M☉ نجم صغير</span>
              <span>ثقب أسود 100M☉</span>
            </div>
          </div>

          {/* Distortion Slider */}
          <div className="stat-card" style={{ animationDelay: "0.25s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "#8a78a8" }}>مستوى الانحناء</div>
                <div style={{ fontSize: 10, color: "#6a5a88", marginTop: 1 }}>(Curvature Level)</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#5fa8ff" }}>{distortion}%</div>
            </div>
            <input
              type="range" min={0} max={100} value={distortion}
              onChange={(e) => setDistortion(Number(e.target.value))}
              className="dist-range"
            />
          </div>
        </div>

        {/* Curvature metric */}
        <div className="stat-card" style={{ animationDelay: "0.35s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "#8a78a8" }}>معامل انحناء الزمكان</div>
              <div style={{ fontSize: 10, color: "#6a5a88" }}>Spacetime Curvature Factor</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#ce93d8" }}>{curvaturePercent}%</div>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${curvaturePercent}%` }} />
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: "#8a78a8", textAlign: "right", lineHeight: 1.7 }}>
            {curvaturePercent < 20
              ? "انحناء ضعيف — نسيج الزمكان شبه مستوٍ"
              : curvaturePercent < 50
              ? "انحناء متوسط — تأثيرات جاذبية ملحوظة"
              : curvaturePercent < 75
              ? "انحناء شديد — تشوه واضح في نسيج الزمكان"
              : "انحناء أقصى — أفق الحوادث اقترب!"}
          </div>
        </div>

        {/* Bottom note */}
        <div style={{
          textAlign: "center",
          fontSize: 10,
          color: "rgba(140,80,255,0.35)",
          lineHeight: 1.7,
          animation: "fadeUp 0.8s ease both",
          animationDelay: "0.5s",
        }}>
          هذا النموذج يُظهر كيف تشوّه الكتلة نسيج الزمكان<br />
          وفق نظرية النسبية العامة لأينشتاين
        </div>
      </div>
    </div>
  );
}
export default App;