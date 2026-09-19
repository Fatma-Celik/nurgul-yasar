/* Site-wide animated "galaxy" background: a parallax starfield plus a
   few small orbiting atom/planet systems, drawn on a single fixed
   canvas so it stays behind every page and section, not just the hero.
   Colors and blend mode flip with the light/dark theme. */

(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const canvas = document.createElement("canvas");
  canvas.className = "galaxy-canvas";
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d", { alpha: true });

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function isDarkTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  let colors = getColors();

  function getColors() {
    return isDarkTheme()
      ? {
          star: [244, 243, 248],
          nucleus: { r: 155, g: 191, b: 10 },
          electron: { r: 85, g: 188, b: 3 },
          orbitLine: "rgba(155, 191, 10, 0.25)",
        }
      : {
          star: [38, 89, 2],
          nucleus: { r: 0, g: 125, b: 16 },
          electron: { r: 85, g: 188, b: 3 },
          orbitLine: "rgba(0, 125, 16, 0.2)",
        };
  }

  window.addEventListener("themechange", () => {
    colors = getColors();
  });

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const STAR_COUNT = 130;
  const stars = Array.from({ length: STAR_COUNT }, () => {
    const depth = Math.random();
    return {
      x: Math.random(),
      y: Math.random(),
      depth,
      radius: 0.5 + depth * 1.6,
      baseAlpha: 0.25 + depth * 0.6,
      twinkleSpeed: 0.0006 + Math.random() * 0.0014,
      twinkleOffset: Math.random() * Math.PI * 2,
      parallax: 0.02 + depth * 0.05,
    };
  });

  const orbitSystems = [
    { x: 0.12, y: 0.22, r1: 26, r2: 42, speed1: 0.0006, speed2: -0.0004, tilt: 0.35 },
    { x: 0.86, y: 0.18, r1: 22, r2: 0, speed1: -0.0008, speed2: 0, tilt: 0.5 },
    { x: 0.08, y: 0.78, r1: 20, r2: 34, speed1: 0.0009, speed2: 0.0005, tilt: 0.2 },
    { x: 0.92, y: 0.72, r1: 30, r2: 0, speed1: 0.0005, speed2: 0, tilt: 0.6 },
  ];

  const pointer = { x: 0.5, y: 0.5 };
  const pointerEased = { x: 0.5, y: 0.5 };

  window.addEventListener(
    "mousemove",
    (e) => {
      pointer.x = e.clientX / window.innerWidth;
      pointer.y = e.clientY / window.innerHeight;
    },
    { passive: true }
  );

  window.addEventListener("resize", resize);

  function drawOrbit(system, time) {
    const cx = system.x * width;
    const cy = system.y * height;

    ctx.strokeStyle = colors.orbitLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, system.r1, system.r1 * (1 - system.tilt), 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = `rgba(${colors.nucleus.r}, ${colors.nucleus.g}, ${colors.nucleus.b}, 0.85)`;
    ctx.beginPath();
    ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
    ctx.fill();

    const angle1 = time * system.speed1;
    const ex1 = cx + Math.cos(angle1) * system.r1;
    const ey1 = cy + Math.sin(angle1) * system.r1 * (1 - system.tilt);
    ctx.fillStyle = `rgba(${colors.electron.r}, ${colors.electron.g}, ${colors.electron.b}, 0.95)`;
    ctx.beginPath();
    ctx.arc(ex1, ey1, 2.6, 0, Math.PI * 2);
    ctx.fill();

    if (system.r2) {
      ctx.strokeStyle = colors.orbitLine;
      ctx.beginPath();
      ctx.ellipse(cx, cy, system.r2, system.r2 * (1 - system.tilt * 0.6), Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();

      const angle2 = time * system.speed2;
      const ex2 = cx + Math.cos(angle2 + 1.2) * system.r2;
      const ey2 = cy + Math.sin(angle2 + 1.2) * system.r2 * (1 - system.tilt * 0.6);
      ctx.fillStyle = `rgba(${colors.electron.r}, ${colors.electron.g}, ${colors.electron.b}, 0.8)`;
      ctx.beginPath();
      ctx.arc(ex2, ey2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function render(time) {
    if (!width || !height) {
      requestAnimationFrame(render);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    pointerEased.x += (pointer.x - pointerEased.x) * 0.03;
    pointerEased.y += (pointer.y - pointerEased.y) * 0.03;
    const px = (pointerEased.x - 0.5) * 2;
    const py = (pointerEased.y - 0.5) * 2;

    stars.forEach((star) => {
      const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
      const alpha = star.baseAlpha * (0.55 + 0.45 * twinkle);
      const offsetX = px * star.parallax * 60;
      const offsetY = py * star.parallax * 60;
      const x = star.x * width + offsetX;
      const y = star.y * height + offsetY;

      ctx.fillStyle = `rgba(${colors.star[0]}, ${colors.star[1]}, ${colors.star[2]}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    orbitSystems.forEach((system) => drawOrbit(system, time));

    requestAnimationFrame(render);
  }

  resize();

  if (prefersReduced) {
    stars.forEach((star) => {
      ctx.fillStyle = `rgba(${colors.star[0]}, ${colors.star[1]}, ${colors.star[2]}, ${star.baseAlpha})`;
      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    orbitSystems.forEach((system) => drawOrbit(system, 0));
  } else {
    requestAnimationFrame(render);
  }
})();
