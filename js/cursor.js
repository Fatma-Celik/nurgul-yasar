/* Small stylish cursor-follower dot, shown only on fine pointers
   (mouse/trackpad). Uses window "mouseout with no relatedTarget" to
   detect the pointer truly leaving the viewport, instead of a
   document "mouseleave" listener — the latter can misfire when an
   element under the cursor is hidden via CSS (e.g. the theme-toggle's
   sun/moon icons swapping on click), which made the dot vanish on
   theme switches. */

(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (!canHover || prefersReduced) return;

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

  window.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget) {
      visible = false;
      dot.style.opacity = "0";
    }
  });

  function render() {
    current.x += (target.x - current.x) * 0.18;
    current.y += (target.y - current.y) * 0.18;
    dot.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
})();
