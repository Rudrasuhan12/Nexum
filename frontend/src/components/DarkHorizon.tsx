"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Lock,
  Globe2,
  Shield,
  GitBranch,
  Headphones,
  ArrowRight,
} from "lucide-react";

interface ShowcaseTab {
  id: string;
  label: string;
  description: string;
}

const showcaseTabs: ShowcaseTab[] = [
  {
    id: "context",
    label: "Context",
    description:
      "Emails, calls, records, product usage, connected tools. All live.",
  },
  {
    id: "agents",
    label: "Agents + automations",
    description:
      "An always-on revenue engine. Prospect, follow-up, research, running 24/7.",
  },
  {
    id: "ecosystem",
    label: "Ecosystem",
    description:
      "Nexum wherever you work. Browser, inbox, Slack, terminal, agents.",
  },
];

export default function DarkHorizon() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [tabProgress, setTabProgress] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const arcContainerRef = useRef<HTMLDivElement>(null);

  // Engine State References
  const stateRef = useRef({
    activeTab: 0,
    prevTab: -1,
    transitionProgress: 1,
    tabElapsed: 0,
    lastTimestamp: 0,
    mouseX: 0,
    mouseY: 0,
    targetMouseX: 0,
    targetMouseY: 0,
    radarPulseTime: 0,
    ecosystemTime: 0,
  });

  // 1. Scroll listener: triggers actively while the arc is in view
  useEffect(() => {
    const handleScroll = () => {
      if (!arcContainerRef.current) return;
      const rect = arcContainerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // START: When the arc enters the lower screen (90% viewport height)
      // END: When the arc settles comfortably under the headline (20% viewport height)
      const start = windowHeight * 0.90;
      const end = windowHeight * 0.20;
      const totalDistance = start - end;

      const progress = Math.min(1, Math.max(0, (start - rect.top) / totalDistance));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Function to switch tabs programmatically
  const switchTab = (index: number) => {
    const s = stateRef.current;
    if (index === s.activeTab && s.transitionProgress >= 1) return;
    s.prevTab = s.activeTab;
    s.activeTab = index;
    s.transitionProgress = 0;
    s.tabElapsed = 0;
    if (index === 1) s.radarPulseTime = 0;
    if (index === 2) s.ecosystemTime = 0;

    setActiveTab(index);
    setTabProgress(0);
  };

  // 2. Continuous 3D Projection Canvas Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const DURATION_PER_TAB = 7500; // 7.5 seconds
    const TRANSITION_DURATION = 1.35; // 1.35s continuous zoom-through

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Easing helpers
    const easeInOutCubic = (x: number) =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const easeOutExpo = (x: number) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));

    // --- DATA STRUCTURES ---
    const NUM_MERIDIANS = 16;
    const RING_RADII = [0.125, 0.155, 0.195, 0.25, 0.325, 0.42, 0.535, 0.675, 0.84, 1.04, 1.26];
    const funnelParticles = Array.from({ length: 10 }, (_, i) => ({
      meridianIndex: (i * 2 + Math.floor(Math.random() * 2)) % NUM_MERIDIANS,
      r: 0.2 + (i / 10) * 1.0,
      speed: 0.17 + Math.random() * 0.08,
    }));

    const RADAR_RINGS = [0.23, 0.43, 0.63, 0.83];
    const radarOrbiters = [
      { ringIdx: 0, angle: -Math.PI / 2, speed: 0.58, activeDelay: 0.15 },
      { ringIdx: 1, angle: -Math.PI / 2, speed: -0.4, activeDelay: 0.25 },
      { ringIdx: 2, angle: -Math.PI / 2, speed: 0.3, activeDelay: 0.35 },
      { ringIdx: 3, angle: -Math.PI / 2, speed: -0.22, activeDelay: 0.45 },
      { ringIdx: 2, angle: Math.PI * 0.35, speed: 0.3, activeDelay: 0.55 },
    ];

    const ORBIT_RADII = [0.27, 0.39, 0.51, 0.63, 0.75, 0.87];
    const ecosystemSatellites = [
      { ringIdx: 0, angle: 0.4, speed: 0.62 },
      { ringIdx: 1, angle: 2.1, speed: 0.46 },
      { ringIdx: 2, angle: 4.5, speed: 0.36 },
      { ringIdx: 3, angle: 1.1, speed: 0.28 },
      { ringIdx: 3, angle: 4.2, speed: 0.28 },
      { ringIdx: 4, angle: 5.5, speed: 0.22 },
      { ringIdx: 5, angle: 2.9, speed: 0.17 },
      { ringIdx: 5, angle: 0.1, speed: 0.17 },
    ];

    // --- 3D FUNNEL PROJECTION ---
    const projectFunnelPoint = (
      r: number,
      theta: number,
      scale: number,
      cx: number,
      cy: number,
      tiltX: number,
      tiltY: number,
      diveProgress = 0
    ) => {
      const depthFactor = 1 - diveProgress * 0.65;
      const depth = (0.44 / (Math.pow(r / 0.22, 1.85) + 0.36) - 0.12) * depthFactor;
      const x3d = r * Math.cos(theta);
      const z3d = r * Math.sin(theta);
      const y3d = depth;

      const basePitch = 0.55 + tiltY * 0.05;
      const pitch = basePitch + (1 - basePitch) * diveProgress;
      const yaw = tiltX * 0.08 * (1 - diveProgress);

      const rotX = x3d * Math.cos(yaw) - z3d * Math.sin(yaw);
      const rotZ = x3d * Math.sin(yaw) + z3d * Math.cos(yaw);
      const yOffset = -38 * (1 - diveProgress);

      const screenX = cx + rotX * scale;
      const screenY = cy + yOffset + (rotZ * pitch + y3d * 0.85) * scale;
      return { x: screenX, y: screenY, depth: y3d };
    };

    // --- DRAW SCENE 0: 3D GRAVITY FUNNEL ---
    const drawScene0 = (
      alpha: number,
      dt: number,
      baseScale: number,
      cx: number,
      cy: number,
      zoomMultiplier = 1,
      diveProgress = 0
    ) => {
      if (alpha <= 0.005) return;
      ctx.save();
      const scale = baseScale * zoomMultiplier;
      const tiltX = stateRef.current.mouseX;
      const tiltY = stateRef.current.mouseY;

      // 1. Concentric Horizontal Rings
      for (let i = 0; i < RING_RADII.length; i++) {
        const r = RING_RADII[i];
        const ringFade = i >= RING_RADII.length - 2 ? 0.55 : 1.0;
        const isInnerThroat = i === 0;
        ctx.strokeStyle = `rgba(255, 255, 255, ${(isInnerThroat ? 0.28 : 0.14) * alpha * ringFade})`;
        ctx.lineWidth = isInnerThroat ? 1.2 : 1;

        ctx.beginPath();
        const steps = 96;
        for (let s = 0; s <= steps; s++) {
          const theta = (s / steps) * Math.PI * 2;
          const pt = projectFunnelPoint(r, theta, scale, cx, cy, tiltX, tiltY, diveProgress);
          if (s === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // 2. Radial Meridians
      for (let m = 0; m < NUM_MERIDIANS; m++) {
        const theta = (m / NUM_MERIDIANS) * Math.PI * 2 + Math.PI / NUM_MERIDIANS;
        ctx.beginPath();
        const rStart = 0.125;
        const rEnd = 1.28;
        const steps = 48;

        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const r = rStart + t * (rEnd - rStart);
          const pt = projectFunnelPoint(r, theta, scale, cx, cy, tiltX, tiltY, diveProgress);
          if (s === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.14 * alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 3. Particles Flowing Inward
      for (const p of funnelParticles) {
        const accel = 1 + (1.25 - p.r) * 0.7 + diveProgress * 2.5;
        p.r -= p.speed * accel * dt;

        if (p.r < 0.125) {
          p.r = 1.1 + Math.random() * 0.18;
          p.meridianIndex = Math.floor(Math.random() * NUM_MERIDIANS);
          p.speed = 0.16 + Math.random() * 0.08;
        }

        const theta = (p.meridianIndex / NUM_MERIDIANS) * Math.PI * 2 + Math.PI / NUM_MERIDIANS;
        let pAlpha = 1.0;
        if (p.r > 1.05) pAlpha = Math.max(0, (1.28 - p.r) / 0.23);
        if (p.r < 0.19) pAlpha = Math.max(0, (p.r - 0.125) / 0.065);
        pAlpha *= alpha;

        if (pAlpha > 0.01) {
          const tailLen = 0.105;
          const tailSteps = 12;
          for (let ts = 0; ts < tailSteps; ts++) {
            const r1 = p.r + (ts / tailSteps) * tailLen;
            const r2 = p.r + ((ts + 1) / tailSteps) * tailLen;
            const pt1 = projectFunnelPoint(r1, theta, scale, cx, cy, tiltX, tiltY, diveProgress);
            const pt2 = projectFunnelPoint(r2, theta, scale, cx, cy, tiltX, tiltY, diveProgress);
            const segAlpha = (1 - ts / tailSteps) * 0.7 * pAlpha;

            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${segAlpha})`;
            ctx.lineWidth = 1.7;
            ctx.stroke();
          }

          const headPt = projectFunnelPoint(p.r, theta, scale, cx, cy, tiltX, tiltY, diveProgress);
          ctx.beginPath();
          ctx.arc(headPt.x, headPt.y, 2.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${pAlpha})`;
          ctx.shadowColor = "rgba(255, 255, 255, 0.85)";
          ctx.shadowBlur = 7;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      ctx.restore();
    };

    // --- DRAW SCENE 1: CONCENTRIC RADAR TARGET ---
    const drawScene1 = (
      alpha: number,
      dt: number,
      baseScale: number,
      cx: number,
      cy: number,
      zoomMultiplier = 1
    ) => {
      if (alpha <= 0.005) return;
      ctx.save();
      const s = stateRef.current;
      s.radarPulseTime += dt;
      const rScale = baseScale * 0.88 * zoomMultiplier;
      const outerRadius = RADAR_RINGS[3] * rScale;

      // 1. Diagonal Dashed Crosshairs
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.075 * alpha})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]);
      const diagLen = outerRadius;
      const cos45 = Math.cos(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(cx - diagLen * cos45, cy - diagLen * cos45);
      ctx.lineTo(cx + diagLen * cos45, cy + diagLen * cos45);
      ctx.moveTo(cx + diagLen * cos45, cy - diagLen * cos45);
      ctx.lineTo(cx - diagLen * cos45, cy + diagLen * cos45);
      ctx.stroke();
      ctx.restore();

      // 2. Concentric Rings
      for (let i = 0; i < RADAR_RINGS.length; i++) {
        const r = RADAR_RINGS[i] * rScale;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.14 * alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 3. Cardinal Ticks
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.26 * alpha})`;
      ctx.lineWidth = 1;
      const tickLen = 5.5;
      const cardinals = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];
      for (const ang of cardinals) {
        ctx.beginPath();
        ctx.moveTo(cx + (outerRadius - tickLen) * Math.cos(ang), cy + (outerRadius - tickLen) * Math.sin(ang));
        ctx.lineTo(cx + (outerRadius + tickLen) * Math.cos(ang), cy + (outerRadius + tickLen) * Math.sin(ang));
        ctx.stroke();
      }

      // 4. Vertical Signal Line & Pulse
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - outerRadius);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.24 * alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      const beamCycle = (s.radarPulseTime % 2.4) / 2.4;
      if (beamCycle < 0.48) {
        const beamP = beamCycle / 0.48;
        const beamY = cy - beamP * outerRadius;
        const beamTail = Math.min(beamP * outerRadius, 52 * zoomMultiplier);

        const beamGrad = ctx.createLinearGradient(cx, beamY, cx, beamY + beamTail);
        beamGrad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * alpha})`);
        beamGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);

        ctx.beginPath();
        ctx.moveTo(cx, beamY);
        ctx.lineTo(cx, beamY + beamTail);
        ctx.strokeStyle = beamGrad;
        ctx.lineWidth = 1.9;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, beamY, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(cx, cy - outerRadius, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.55 * alpha})`;
      ctx.fill();

      // 5. Orbiting Agent Dots
      for (const orb of radarOrbiters) {
        if (s.radarPulseTime < orb.activeDelay) continue;
        const orbFade = Math.min(1, (s.radarPulseTime - orb.activeDelay) / 0.35) * alpha;
        orb.angle += orb.speed * dt;
        const r = RADAR_RINGS[orb.ringIdx] * rScale;

        const trailArc = 0.28 * Math.sign(orb.speed);
        const trailSteps = 14;
        for (let st = 0; st < trailSteps; st++) {
          const a1 = orb.angle - (st / trailSteps) * trailArc;
          const a2 = orb.angle - ((st + 1) / trailSteps) * trailArc;
          ctx.beginPath();
          ctx.arc(cx, cy, r, a1, a2, orb.speed > 0);
          ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - st / trailSteps) * 0.48 * orbFade})`;
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }

        const ox = cx + r * Math.cos(orb.angle);
        const oy = cy + r * Math.sin(orb.angle);
        ctx.beginPath();
        ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${orbFade})`;
        ctx.shadowColor = "rgba(255, 255, 255, 0.85)";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 6. Central White Core Dot
      const coreDotRadius = Math.max(2, 6 * Math.min(2.2, zoomMultiplier));
      const glowRadius = 22 * Math.min(2.5, zoomMultiplier);
      const centerGlow = ctx.createRadialGradient(cx, cy, 2, cx, cy, glowRadius);
      centerGlow.addColorStop(0, `rgba(255, 255, 255, ${0.38 * alpha})`);
      centerGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = centerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, coreDotRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();

      ctx.restore();
    };

    // --- DRAW SCENE 2: TILTED PLANETARY ORBITS ---
    const drawScene2 = (
      alpha: number,
      dt: number,
      baseScale: number,
      cx: number,
      cy: number,
      zoomMultiplier = 1,
      morphToFunnel = 0
    ) => {
      if (alpha <= 0.005) return;
      ctx.save();
      const s = stateRef.current;
      s.ecosystemTime += dt;
      const oScale = baseScale * 0.9 * zoomMultiplier;

      const baseTilt = -0.41 + s.mouseX * 0.05;
      const tiltAngle = baseTilt * (1 - morphToFunnel);
      const ellipseRatio = (0.57 + s.mouseY * 0.04) * (1 - morphToFunnel) + 0.55 * morphToFunnel;

      const innerRx = 0.155 * oScale;
      const innerRy = innerRx * ellipseRatio;
      const sphereRadius = 0.125 * oScale;

      ctx.translate(cx, cy);

      // 1. Shaded Central 3D Sphere & Innermost Halo Ring
      if (sphereRadius > 1) {
        const coreGrad = ctx.createRadialGradient(
          -sphereRadius * 0.25,
          -sphereRadius * 0.25,
          sphereRadius * 0.1,
          0,
          0,
          sphereRadius
        );
        coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.06 * alpha})`);
        coreGrad.addColorStop(0.7, `rgba(255, 255, 255, ${0.02 * alpha})`);
        coreGrad.addColorStop(1, `rgba(255, 255, 255, 0.0)`);

        ctx.beginPath();
        ctx.arc(0, 0, sphereRadius, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, sphereRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.22 * alpha})`;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.save();
        ctx.rotate(tiltAngle);
        ctx.beginPath();
        ctx.ellipse(0, 0, innerRx, innerRy, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.26 * alpha})`;
        ctx.lineWidth = 1.15;
        ctx.stroke();
        ctx.restore();
      }

      ctx.rotate(tiltAngle);

      // 2. Concentric Orbit Rings
      for (let i = 0; i < ORBIT_RADII.length; i++) {
        const rx = ORBIT_RADII[i] * oScale;
        const ry = rx * ellipseRatio;

        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 3. Satellites
      for (const sat of ecosystemSatellites) {
        sat.angle += sat.speed * dt;
        const rx = ORBIT_RADII[sat.ringIdx] * oScale;
        const ry = rx * ellipseRatio;
        const depthFactor = 0.75 + 0.25 * Math.sin(sat.angle);

        const trailLen = 0.24;
        const steps = 10;
        for (let st = 0; st < steps; st++) {
          const a1 = sat.angle - (st / steps) * trailLen;
          const a2 = sat.angle - ((st + 1) / steps) * trailLen;
          ctx.beginPath();
          ctx.moveTo(rx * Math.cos(a1), ry * Math.sin(a1));
          ctx.lineTo(rx * Math.cos(a2), ry * Math.sin(a2));
          ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - st / steps) * 0.48 * alpha * depthFactor})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        const sx = rx * Math.cos(sat.angle);
        const sy = ry * Math.sin(sat.angle);

        ctx.beginPath();
        ctx.arc(sx, sy, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * depthFactor})`;
        ctx.shadowColor = "rgba(255, 255, 255, 0.85)";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    };

    // --- MAIN TICK PIPELINE ---
    stateRef.current.lastTimestamp = performance.now();

    const animate = (now: number) => {
      const s = stateRef.current;
      const dt = Math.min(0.05, (now - s.lastTimestamp) / 1000);
      s.lastTimestamp = now;

      // Mouse Parallax Lerp
      s.mouseX += (s.targetMouseX - s.mouseX) * 0.08;
      s.mouseY += (s.targetMouseY - s.mouseY) * 0.08;

      // Tab Progress Timer
      s.tabElapsed += dt * 1000;
      const pct = Math.min(100, (s.tabElapsed / DURATION_PER_TAB) * 100);
      setTabProgress(pct);

      if (s.tabElapsed >= DURATION_PER_TAB) {
        switchTab((s.activeTab + 1) % 3);
      }

      // Transition progress
      if (s.transitionProgress < 1) {
        s.transitionProgress = Math.min(1, s.transitionProgress + dt / TRANSITION_DURATION);
      }

      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.5;
      const baseScale = Math.min(width, height) * 0.80;

      if (s.transitionProgress >= 1 || s.prevTab === -1) {
        if (s.activeTab === 0) drawScene0(1, dt, baseScale, cx, cy, 1, 0);
        if (s.activeTab === 1) drawScene1(1, dt, baseScale, cx, cy, 1);
        if (s.activeTab === 2) drawScene2(1, dt, baseScale, cx, cy, 1, 0);
      } else {
        // CONTINUOUS CAMERA ZOOM-THROUGH TRANSITION
        const t = easeInOutCubic(s.transitionProgress);

        if (s.prevTab === 0 && s.activeTab === 1) {
          // Context -> Agents: Camera dives down into throat; radar emerges from throat
          const funnelZoom = 1 + t * 3.6;
          const funnelAlpha = Math.max(0, 1 - Math.pow(t, 1.5));
          drawScene0(funnelAlpha, dt, baseScale, cx, cy, funnelZoom, t);

          const radarZoom = 0.14 + 0.86 * easeOutExpo(s.transitionProgress);
          const radarAlpha = Math.min(1, s.transitionProgress * 1.45);
          drawScene1(radarAlpha, dt, baseScale, cx, cy, radarZoom);
        } else if (s.prevTab === 1 && s.activeTab === 2) {
          // Agents -> Ecosystem: Zooms into center dot; orbits bloom out
          const radarZoom = 1 + t * 4.2;
          const radarAlpha = Math.max(0, 1 - Math.pow(t, 1.4));
          drawScene1(radarAlpha, dt, baseScale, cx, cy, radarZoom);

          const ecoZoom = 0.12 + 0.88 * easeOutExpo(s.transitionProgress);
          const ecoAlpha = Math.min(1, s.transitionProgress * 1.45);
          drawScene2(ecoAlpha, dt, baseScale, cx, cy, ecoZoom, 0);
        } else if (s.prevTab === 2 && s.activeTab === 0) {
          // Ecosystem -> Context: Plunges into central sphere; orbits un-tilt into gravity funnel
          const ecoZoom = 1 + t * 3.8;
          const ecoAlpha = Math.max(0, 1 - Math.pow(t, 1.45));
          drawScene2(ecoAlpha, dt, baseScale, cx, cy, ecoZoom, t);

          const funnelZoom = 0.18 + 0.82 * easeOutExpo(s.transitionProgress);
          const funnelAlpha = Math.min(1, s.transitionProgress * 1.4);
          drawScene0(funnelAlpha, dt, baseScale, cx, cy, funnelZoom, 0);
        } else {
          const outZoom = 1 + t * 3.0;
          const outAlpha = 1 - t;
          const inZoom = 0.2 + 0.8 * t;
          const inAlpha = t;

          if (s.prevTab === 0) drawScene0(outAlpha, dt, baseScale, cx, cy, outZoom, t);
          if (s.prevTab === 1) drawScene1(outAlpha, dt, baseScale, cx, cy, outZoom);
          if (s.prevTab === 2) drawScene2(outAlpha, dt, baseScale, cx, cy, outZoom, t);

          if (s.activeTab === 0) drawScene0(inAlpha, dt, baseScale, cx, cy, inZoom, 0);
          if (s.activeTab === 1) drawScene1(inAlpha, dt, baseScale, cx, cy, inZoom);
          if (s.activeTab === 2) drawScene2(inAlpha, dt, baseScale, cx, cy, inZoom, 0);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  // Mouse Parallax on Canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    stateRef.current.targetMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  };

  const handleMouseLeave = () => {
    stateRef.current.targetMouseX = 0;
    stateRef.current.targetMouseY = 0;
  };

  // 1. Noticeable physical lift & expansion on scroll
  const arcTranslateY = (1 - scrollProgress) * 55; // 55px smooth vertical rise
  const arcScale = 0.94 + scrollProgress * 0.06;   // Expands smoothly from 0.94 -> 1.00

  // 2. Apex white sunlight bloom
  const apexBloomOpacity = 0.20 + scrollProgress * 0.65; // 20% -> 85% brightness

  // 3. Light sweep: 15% (only amber on left) when scrolled up -> 100% (full arc lit) when scrolled down
  const sweepPercent = 15 + scrollProgress * 85;
  

  return (
    <section
      ref={sectionRef}
      data-navbar-theme="dark"
      className="relative w-full bg-dark-cosmic-stripes text-white pt-36 pb-6 overflow-hidden"
    >
      {/* 1. Vertical Passing Lights */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[12%] top-0 h-44 w-[1px] bg-gradient-to-b from-transparent via-white/35 to-transparent animate-beam-slow" />
        <div className="absolute left-[31%] top-0 h-36 w-[1.5px] bg-gradient-to-b from-transparent via-white/40 to-transparent animate-beam-fast" style={{ animationDelay: "2.5s" }} />
        <div className="absolute left-[54%] top-0 h-52 w-[1px] bg-gradient-to-b from-transparent via-white/30 to-transparent animate-beam-mid" style={{ animationDelay: "1.2s" }} />
        <div className="absolute left-[73%] top-0 h-40 w-[1px] bg-gradient-to-b from-transparent via-white/30 to-transparent animate-beam-slow" style={{ animationDelay: "4.8s" }} />
        <div className="absolute left-[88%] top-0 h-48 w-[1.5px] bg-gradient-to-b from-transparent via-white/45 to-transparent animate-beam-mid" style={{ animationDelay: "3.4s" }} />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-6 lg:px-12">
        
        {/* 2. Headline */}
        <div className="flex flex-col items-center text-center">
          <span className="font-mono text-xs font-semibold tracking-[0.22em] text-slate-400 uppercase mb-4">
            The only protocol with
          </span>
          <h2 className="font-heading text-5xl sm:text-7xl lg:text-[96px] font-bold tracking-[-0.04em] text-white leading-none">
            Universal Consensus<sup className="text-3xl sm:text-5xl text-slate-500 font-medium top-[-0.45em] relative">™</sup>
          </h2>
        </div>

        {/* ==============================================================
            3. THE PLANETARY HORIZON ARC (CORNER-TO-CORNER & SCROLL LIGHT SWEEP)
           ============================================================== */}
        <div ref={arcContainerRef} className="relative w-full -mt-2 sm:-mt-6 lg:-mt-10 h-[200px] sm:h-[280px] lg:h-[360px] flex items-end justify-center overflow-hidden">
          
          {/* Subtle Ambient Apex Sunlight Haze (Soft White Halo at Center Peak) */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[260px] w-full transition-opacity duration-150 ease-out"
            style={{
              opacity: apexBloomOpacity,
              background: `radial-gradient(ellipse 48% 35% at 50% 15%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.04) 50%, rgba(0, 0, 0, 0) 80%)`,
            }}
          />

          <svg
            className="absolute inset-0 h-full w-full overflow-visible transition-transform duration-100 ease-out"
            style={{
              transform: `scale(${arcScale}) translateY(${arcTranslateY}px)`,
              transformOrigin: "bottom center",
            }}
            preserveAspectRatio="none"
            viewBox="0 0 1440 360"
            fill="none"
          >
            <defs>
              {/* Soothing Feathered Atmospheric Blur Filters */}
              <filter id="corona-outer-haze" x="-20%" y="-120%" width="140%" height="260%">
                <feGaussianBlur stdDeviation="18" result="blur" />
              </filter>
              <filter id="corona-inner-halo" x="-20%" y="-80%" width="140%" height="220%">
                <feGaussianBlur stdDeviation="6" result="blur" />
              </filter>

              {/* The Permanent Full-Spectrum Color Gradient (Amber -> Gold -> White -> Cyan -> Blue) */}
              <linearGradient id="earth-permanent-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EA580C" />    {/* Sunset Amber (Left Corner) */}
                <stop offset="22%" stopColor="#F59E0B" />   {/* Warm Gold */}
                <stop offset="45%" stopColor="#FEF08A" />   {/* Pale Sunlight */}
                <stop offset="50%" stopColor="#FFFFFF" />   {/* Crisp White Apex Core */}
                <stop offset="55%" stopColor="#A7F3D0" />   {/* Mint Atmosphere */}
                <stop offset="78%" stopColor="#2DD4BF" />   {/* Seafoam Cyan */}
                <stop offset="100%" stopColor="#38BDF8" />  {/* Electric Blue (Right Corner) */}
              </linearGradient>

              {/* DYNAMIC SCROLL SWEEP MASK (Connected directly to scrollProgress) */}
              <mask id="scroll-sweep-mask">
                <linearGradient id="sweep-mask-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset={`${sweepPercent}%`} stopColor="#ffffff" />
                  <stop offset={`${Math.min(100, sweepPercent + 14)}%`} stopColor="#444444" />
                  <stop offset="100%" stopColor="#181818" />
                </linearGradient>
                <rect x="-100" y="-100" width="1640" height="600" fill="url(#sweep-mask-gradient)" />
              </mask>
            </defs>

            {/* LAYER 1: Deep Diffuse White Atmosphere (Masked to sweep along with scroll) */}
            <path
              d="M 0 360 Q 720 -140 1440 360"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="24"
              strokeLinecap="round"
              filter="url(#corona-outer-haze)"
              mask="url(#scroll-sweep-mask)"
            />

            {/* LAYER 2: Near-Surface Luminous Rim Glow (Masked to sweep along with scroll) */}
            <path
              d="M 0 360 Q 720 -140 1440 360"
              stroke="url(#earth-permanent-gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              filter="url(#corona-inner-halo)"
              mask="url(#scroll-sweep-mask)"
            />

            {/* LAYER 3: The Crisp Vector Line (Corners at 0,360 & 1440,360, sweeps from left to right on scroll) */}
            <path
              d="M 0 360 Q 720 -140 1440 360"
              stroke="url(#earth-permanent-gradient)"
              strokeWidth="2.8"
              strokeLinecap="round"
              mask="url(#scroll-sweep-mask)"
            />

            {/* LAYER 4: Solid Planet Body (Zero vertical cutoff artifact, clean black below) */}
            <path
              d="M 0 360 Q 720 -140 1440 360 L 1440 400 L 0 400 Z"
              fill="#07090E"
            />
          </svg>
        </div>
        {/* 4. The 5-Column Minimalist Invariant Row */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 lg:divide-x divide-white/10 border-y border-white/10 mt-6 bg-[#07090E]/80 backdrop-blur-md">
          <div className="p-6 flex flex-col justify-between">
            <Lock className="h-4 w-4 text-slate-400 mb-4" />
            <div>
              <h4 className="font-heading text-sm font-bold text-white mb-1">It seals itself.</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                PRDs, quotes, and approvals hashed automatically.
              </p>
            </div>
          </div>

          <div className="p-6 flex flex-col justify-between">
            <Globe2 className="h-4 w-4 text-slate-400 mb-4" />
            <div>
              <h4 className="font-heading text-sm font-bold text-white mb-1">Both workspaces talk.</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Client and agency in continuous mathematical sync.
              </p>
            </div>
          </div>

          <div className="p-6 flex flex-col justify-between">
            <Shield className="h-4 w-4 text-slate-400 mb-4" />
            <div>
              <h4 className="font-heading text-sm font-bold text-white mb-1">Guards your strategy.</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Budgets, internal notes, and ceilings stay confidential.
              </p>
            </div>
          </div>

          <div className="p-6 flex flex-col justify-between">
            <GitBranch className="h-4 w-4 text-slate-400 mb-4" />
            <div>
              <h4 className="font-heading text-sm font-bold text-white mb-1">Changes don&apos;t break past.</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Scope additions fork into follow-on milestones.
              </p>
            </div>
          </div>

          <div className="p-6 flex flex-col justify-between col-span-2 sm:col-span-1">
            <Headphones className="h-4 w-4 text-slate-400 mb-4" />
            <div>
              <h4 className="font-heading text-sm font-bold text-white mb-1">Zero blind retries.</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Timeouts safely enter bounded reconciliation.
              </p>
            </div>
          </div>
        </div>

        {/* ==============================================================
            5. THE SIGNALS SHOWCASE (EXACT HTML ENGINE REPLICATION)
           ============================================================== */}
        <div className="mt-32 lg:mt-48 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Rock-Solid Static Headline + Smooth Tabs */}
          <div className="lg:col-span-5 flex flex-col justify-between min-h-[460px]">
            <div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-[4px] bg-[#142238] text-[#539bf5] text-[13px] font-medium tracking-tight mb-6">
                Signals
              </span>

              <h3 className="font-heading text-4xl sm:text-5xl lg:text-[54px] font-bold text-white leading-[1.08] tracking-[-0.03em]">
                All of the signals, <br />
                none of the noise. <br />
                <span className="text-[#868a91] font-normal">Ready to act on.</span>
              </h3>

              <div className="mt-8">
                <a
                  href="#spec"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[7px] text-[14px] font-medium text-[#e4e4e7] bg-white/[0.02] border border-[#262629] hover:bg-white/[0.07] hover:border-[#3a3a3f] transition group"
                >
                  <span>See more</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#a1a1aa] transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>

            {/* The 3 Tabs at Bottom with Smooth Height Transition & Glowing Progress */}
            <div className="mt-14 space-y-2 max-w-[440px] w-full">
              {showcaseTabs.map((tab, idx) => {
                const isActive = activeTab === idx;
                return (
                  <div
                    key={tab.id}
                    onClick={() => switchTab(idx)}
                    className="relative py-4 cursor-pointer group select-none"
                  >
                    {/* Tab Title */}
                    <h4
                      className={`text-[19px] font-medium tracking-[-0.015em] transition-colors duration-300 ${
                        isActive ? "text-white" : "text-[#686b72] group-hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </h4>

                    {/* Smooth Accordion Height Expansion */}
                    <div
                      className={`grid transition-all duration-500 ease-out ${
                        isActive
                          ? "grid-rows-[1fr] opacity-100 mt-2"
                          : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="text-[#8a8f98] text-[15px] leading-[1.5] pr-4 pb-2 font-sans">
                          {tab.description}
                        </p>
                      </div>
                    </div>

                    {/* Progress Track & Fill */}
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#1f1f22] overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-75"
                        style={{
                          width: isActive ? `${tabProgress}%` : "0%",
                          boxShadow: "0 0 8px rgba(255, 255, 255, 0.6)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: High-DPI Canvas with Exact Video Math */}
          <div className="lg:col-span-7 relative h-[540px] sm:h-[620px] w-full flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="w-full h-full block cursor-grab active:cursor-grabbing"
            />
          </div>

        </div>

      </div>
    </section>
  );
}