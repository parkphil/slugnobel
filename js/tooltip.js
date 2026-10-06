/* One portrait detail panel for every scene; mouse, keyboard, and touch. */
window.laureateDetails = (() => {
  const panel = document.getElementById("laureate-tooltip");
  let active = null,
    pinned = false,
    lastAnchor = null;
  const create = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  function hide(force = false) {
    if (pinned && !force) return;
    panel.hidden = true;
    active = null;
    pinned = false;
    lastAnchor = null;
  }
  function show(person, anchor, pin = false) {
    if (pinned && !pin && active !== person.id) return;
    if (active !== person.id || panel.hidden) {
      panel.replaceChildren();
      const head = create("div", null, "detail-head");
      const image = create("img");
      image.src = person.photo;
      image.alt = person.name;
      const text = create("div");
      text.append(
        create("strong", person.name),
        create("span", `${person.year} · ${person.category}`),
      );
      const close = create("button", "×", "detail-close");
      close.type = "button";
      close.setAttribute("aria-label", "Close laureate details");
      close.addEventListener("click", () => hide(true));
      head.append(image, text, close);
      panel.append(
        head,
        create(
          "p",
          person.motivation || "[Research description]",
          "detail-motivation",
        ),
      );
      panel.append(
        create(
          "p",
          [person.relationship, person.affiliationDetail]
            .filter(Boolean)
            .join(" · "),
          "detail-affiliation",
        ),
      );
      if (person.facultyProfile) {
        const button = create("button", "Read faculty profile", "profile-link");
        button.type = "button";
        button.addEventListener("click", () => {
          hide(true);
          window.facultyProfiles.open(person.id, anchor);
        });
        panel.append(button);
      }
      const source = create("a", "Nobel Prize source ↗", "source-link");
      source.href = person.nobelUrl;
      source.target = "_blank";
      source.rel = "noopener";
      panel.append(source);
      panel.style.setProperty("--tooltip-color", person.color);
      active = person.id;
    }
    panel.hidden = false;
    panel.classList.toggle("pinned", pin);
    pinned = pin;
    lastAnchor = anchor;
    place();
  }
  function place() {
    if (!lastAnchor || panel.hidden) return;
    const rect = lastAnchor.getBoundingClientRect();
    const width = panel.offsetWidth,
      height = panel.offsetHeight;
    let left = rect.right + 12,
      top = rect.top - 20;
    if (left + width > innerWidth - 12) left = rect.left - width - 12;
    panel.style.left =
      Math.max(12, Math.min(innerWidth - width - 12, left)) + "px";
    panel.style.top =
      Math.max(12, Math.min(innerHeight - height - 12, top)) + "px";
  }
  let timer;
  function bind(anchor, person) {
    anchor.addEventListener("pointerleave", () => {
      timer = setTimeout(() => hide(), 180);
    });
    anchor.addEventListener("focus", () => {
      // Native focus can scroll the document; place details after that scroll.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (document.activeElement === anchor) show(person, anchor);
        }),
      );
    });
    anchor.addEventListener("blur", (event) => {
      if (!panel.contains(event.relatedTarget)) hide();
    });
    anchor.addEventListener("click", (event) => {
      event.preventDefault();
      show(person, anchor, true);
    });
  }
  panel.addEventListener("pointerenter", () => clearTimeout(timer));
  panel.addEventListener("pointerleave", () => {
    timer = setTimeout(() => hide(), 180);
  });
  addEventListener("scroll", () => hide(true), { passive: true });
  addEventListener("resize", () => hide(true));
  addEventListener("keydown", (event) => {
    if (event.key === "Escape") hide(true);
  });
  document.addEventListener("pointerdown", (event) => {
    if (!panel.contains(event.target) && !event.target.closest(".person"))
      hide(true);
  });
  return { bind, hide, place, show };
})();
