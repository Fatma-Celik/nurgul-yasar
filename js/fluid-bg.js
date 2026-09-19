/* Mouse-reactive "fluid" gradient background for the hero section.
   Lightweight canvas metaball-style blobs (no WebGL) tuned to the
   forest/avocado green palette, with ambient idle drift so it stays
   alive even without pointer input. */

(function () {
  const canvas = document.getElementById("fluid-canvas");
  if (!canvas) return;

  const host = canvas.closest("section") || canvas.parentElement;
  const ctx = canvas.getContext("2d", { alpha: true });
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const PALETTE = [
    { r: 85, g: 188, b: 3 },   // avocado
    { r: 155, g: 191, b: 10 }, // limerick
    { r: 0, g: 125, b: 16 },   // forest
    { r: 38, g: 89, b: 2 },    // lincoln green
  ];

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  const pointer = { x: 0, y: 0, active: false, lastMove: 0 };
  const follower = { x: 0, y: 0 };

  function resize() {
    const rect = host.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (pointer.x === 0 && pointer.y === 0) {
      pointer.x = width / 2;
      pointer.y = height / 2.4;
      follower.x = pointer.x;
      follower.y = pointer.y;
    }
  }

  function onPointerMove(clientX, clientY) {
    const rect = host.getBoundingClientRect();
    if (clientY < rect.top || clientY > rect.bottom) {
      pointer.active = false;
      return;
    }
    pointer.x = clientX - rect.left;
    pointer.y = clientY - rect.top;
    pointer.active = true;
    pointer.lastMove = performance.now();
  }

  window.addEventListener("mousemove", (e) => onPointerMove(e.clientX, e.clientY), { passive: true });
  window.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches && e.touches[0]) onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: true }
  );
  window.addEventListener("resize", resize);

  const ambient = PALETTE.map((color, i) => ({
    color,
    baseX: 0.2 + i * 0.22,
    baseY: 0.3 + (i % 2) * 0.35,
    radius: 140 + i * 30,
    speed: 0.00025 + i * 0.00007,
    offset: i * 120,
  }));

  function drawBlob(x, y, radius, color, alpha) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function render(time) {
    if (!width || !height) {
      requestAnimationFrame(render);
      return;
    }

    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0, 0, 0, 0.055)";
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "lighter";

    ambient.forEach((blob) => {
      const t = time * blob.speed + blob.offset;
      const x = (blob.baseX + Math.sin(t) * 0.12) * width;
      const y = (blob.baseY + Math.cos(t * 0.8) * 0.14) * height;
      drawBlob(x, y, blob.radius, blob.color, 0.11);
    });

    const idleFor = performance.now() - pointer.lastMove;
    const pointerAlpha = pointer.active && idleFor < 3000 ? 0.24 : 0.08;

    follower.x += (pointer.x - follower.x) * 0.06;
    follower.y += (pointer.y - follower.y) * 0.06;

    drawBlob(follower.x, follower.y, 220, PALETTE[1], pointerAlpha);
    drawBlob(follower.x, follower.y, 120, PALETTE[0], pointerAlpha * 0.85);

    requestAnimationFrame(render);
  }

  resize();

  if (prefersReduced) {
    ctx.globalCompositeOperation = "lighter";
    ambient.forEach((blob) => {
      drawBlob(blob.baseX * width, blob.baseY * height, blob.radius, blob.color, 0.14);
    });
  } else {
    requestAnimationFrame(render);
  }

  window.addEventListener("orientationchange", resize);
})();
