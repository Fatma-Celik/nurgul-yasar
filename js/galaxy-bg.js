/* Site-wide animated "galaxy" background: one large circular disc with
   slow-moving particles drifting inside it (like the reference spiral
   galaxy photo), plus a sparse ambient starfield. Rendered on a single
   fixed canvas so it stays behind every page and section. Also drives a
   small stylish cursor-follower dot. Colors/blend mode flip with theme. */

(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const canvas = document.createElement("canvas");
  canvas.className = "galaxy-canvas";
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d", { alpha: true });

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let disc = { cx: 0, cy: 0, r: 0 };

  function isDarkTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  let colors = getColors();

  function getColors() {
    return isDarkTheme()
      ? {
          core: "155, 191, 10",
          mid: "0, 125, 16",
          dot: [244, 243, 248],
          star: [244, 243, 248],
        }
      : {
          core: "85, 188, 3",
          mid: "38, 89, 2",
          dot: [12, 60, 5],
          star: [38, 89, 2],
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

    disc.cx = width * 0.8;
    disc.cy = height * 0.3;
    disc.r = Math.max(160, Math.min(Math.min(width, height) * 0.42, 460));
  }

  const PARTICLE_COUNT = 110;
  const particles = Array.from({ length: PARTICLE_COUNT }, () => {
    const radiusFactor = Math.pow(Math.random(), 0.65);
    return {
      radiusFactor,
      angle: Math.random() * Math.PI * 2,
      speed: (0.00016 + Math.random() * 0.00012) * (1.4 - radiusFactor * 0.7),
      size: 0.6 + Math.random() * 1.8,
      alpha: 0.35 + Math.random() * 0.55,
      squash: 0.62 + Math.random() * 0.1,
      tilt: -0.35,
    };
  });

  const STAR_COUNT = 46;
  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    radius: 0.5 + Math.random() * 1.2,
    baseAlpha: 0.15 + Math.random() * 0.35,
    twinkleSpeed: 0.0006 + Math.random() * 0.0012,
    twinkleOffset: Math.random() * Math.PI * 2,
  }));

  window.addEventListener("resize", resize);

  function drawDisc(time) {
    const { cx, cy, r } = disc;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    glow.addColorStop(0, `rgba(${colors.core}, 0.32)`);
    glow.addColorStop(0.45, `rgba(${colors.mid}, 0.16)`);
    glow.addColorStop(1, `rgba(${colors.mid}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    particles.forEach((p) => {
      const angle = p.angle + time * p.speed;
      const radius = p.radiusFactor * r;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius * p.squash;

      ctx.fillStyle = `rgba(${colors.dot[0]}, ${colors.dot[1]}, ${colors.dot[2]}, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = `rgba(${colors.core}, 0.12)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.995, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function render(time) {
    if (!width || !height) {
      requestAnimationFrame(render);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    stars.forEach((star) => {
      const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
      const alpha = star.baseAlpha * (0.5 + 0.5 * twinkle);
      ctx.fillStyle = `rgba(${colors.star[0]}, ${colors.star[1]}, ${colors.star[2]}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    drawDisc(time);

    requestAnimationFrame(render);
  }

  resize();

  if (prefersReduced) {
    drawDisc(0);
  } else {
    requestAnimationFrame(render);
  }

  /* ---- Stylish cursor-follower dot ---- */

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (canHover && !prefersReduced) {
    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    document.body.appendChild(dot);

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { x: target.x, y: target.y };
    let visible = false;

    window.addEventListener(
      "mousemove",
      (e) => {
        target.x = e.clientX;
        target.y = e.clientY;
        if (!visible) {
          visible = true;
          dot.style.opacity = "1";
        }
      },
      { passive: true }
    );

    document.addEventListener("mouseleave", () => {
      dot.style.opacity = "0";
    });

    function renderCursor() {
      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;
      dot.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);
  }
})();
