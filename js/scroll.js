/* A passage names its scene using data-scene. Transitions happen between boxes;
   each layout holds still while a box is being read. */
(() => {
  const steps = [...document.querySelectorAll(".step")];
  function update() {
    const focus = innerHeight * 0.18;
    const anchors = steps.map((step) => {
      const box = step.querySelector(".text-box").getBoundingClientRect();
      return { y: box.top + box.height / 2, scene: step.dataset.scene, step };
    });
    let first = anchors[0],
      second = anchors[0],
      amount = 0;
    if (focus >= anchors.at(-1).y) first = second = anchors.at(-1);
    else
      for (let i = 0; i < anchors.length - 1; i++) {
        const a = anchors[i],
          b = anchors[i + 1];
        if (focus >= a.y && focus < b.y) {
          const fraction = (focus - a.y) / (b.y - a.y);
          amount = Math.max(0, Math.min(1, (fraction - 0.58) / 0.25));
          first = a;
          second = b;
          break;
        }
      }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches)
      amount = amount < 0.5 ? 0 : 1;
    window.nobelGraphic.setScene(
      first.scene,
      second.scene,
      amount,
      first.step,
      second.step,
    );
  }
  let queued = false;
  addEventListener(
    "scroll",
    () => {
      if (!queued)
        requestAnimationFrame(() => {
          update();
          queued = false;
        });
      queued = true;
    },
    { passive: true },
  );
  addEventListener("resize", update);
  update();
})();
