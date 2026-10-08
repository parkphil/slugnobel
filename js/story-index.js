/* Right-hand chapter index: tracks the current chapter and jumps to any chapter on click. */
(() => {
  const header = document.querySelector(".article-header");
  // Each section jumps to `selector`'s top plus `offset` viewport heights, so it lands where
  // that view has finished animating (offsets come from the phase math in parking-bridge.js).
  const chapters = [
    { label: "Introduction", selector: ".opening-text", offset: 0 },
    { label: "The Laureates", selector: ".intro-scrolly [data-focus]", offset: 0 },
    // Dots fully parked in their category bays.
    { label: "Prize Categories", selector: '[data-parking-step="fill"]', offset: -0.12 },
    // Dots lined up along the year axis (added by year-timeline.js after data loads).
    { label: "By the Decade", selector: '[data-timeline-step="year"]', offset: 0.22 },
    // World map fully drawn.
    { label: "Around the World", selector: '[data-story-step="birth-map"]', offset: 0.67 },
    // "Berkeley faculty and emeriti · 24" circle (added by year-timeline.js after data loads).
    { label: "24 Laureates", selector: '[data-timeline-step="faculty"]', offset: 0.2 },
    { label: "Conclusion", selector: ".closing-text", offset: 0 },
  ];
  // Page scroll position for a section; null until its step exists.
  const anchor = (chapter) => {
    const target = document.querySelector(chapter.selector);
    return target ? target.getBoundingClientRect().top + scrollY + chapter.offset * innerHeight : null;
  };

  const nav = document.createElement("nav");
  nav.className = "story-index";
  nav.setAttribute("aria-label", "Story sections");
  const list = document.createElement("ol");
  const track = document.createElement("span");
  track.className = "story-index__track";
  const fill = document.createElement("span");
  fill.className = "story-index__fill";
  list.append(track, fill);
  chapters.forEach((chapter) => {
    const item = document.createElement("li");
    const link = document.createElement("button");
    link.type = "button";
    link.className = "story-index__link";
    link.innerHTML = `<span class="story-index__label"></span><span class="story-index__dot"></span>`;
    link.querySelector(".story-index__label").textContent = chapter.label;
    link.setAttribute("aria-label", chapter.label);
    link.addEventListener("click", () => {
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const top = anchor(chapter);
      if (top === null) return;
      scrollTo({
        top: Math.ceil(top) + 1,
        behavior: reduce ? "auto" : "smooth",
      });
    });
    chapter.link = link;
    chapter.dot = link.querySelector(".story-index__dot");
    item.append(link);
    list.append(item);
  });
  nav.append(list);
  document.body.append(nav);

  // Vertical center of a dot, measured from the top of the list.
  const dotCenter = (chapter) => {
    const dot = chapter.dot.getBoundingClientRect();
    return dot.top + dot.height / 2 - list.getBoundingClientRect().top;
  };

  function update() {
    const middle = innerHeight / 2;
    nav.classList.toggle(
      "is-visible",
      !header || header.getBoundingClientRect().bottom < middle,
    );
    let active = 0;
    chapters.forEach((chapter, i) => {
      const top = anchor(chapter);
      if (top !== null && top <= scrollY + middle) active = i;
    });
    chapters.forEach((chapter, i) => {
      chapter.link.classList.toggle("is-active", i === active);
      chapter.link.classList.toggle("is-past", i < active);
      if (i === active) chapter.link.setAttribute("aria-current", "step");
      else chapter.link.removeAttribute("aria-current");
    });
    const start = dotCenter(chapters[0]);
    track.style.top = fill.style.top = `${start}px`;
    track.style.height = `${dotCenter(chapters.at(-1)) - start}px`;
    fill.style.height = `${dotCenter(chapters[active]) - start}px`;
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
  addEventListener("year-timeline:ready", update);
  update();
})();
