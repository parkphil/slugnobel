/* Biography content from the partner’s timeline. The visual itself is now
   the final layout of the same 63-person graphic, rather than a second widget. */
window.facultyProfiles = (() => {
  const dialog = document.querySelector("#faculty-timeline dialog");
  const content = dialog.querySelector(".detail");
  const people = window.nobelLayouts.faculty;
  let current = 0,
    opener = null;
  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function render(index) {
    current = index;
    const person = people[index],
      profile = person.facultyProfile;
    const image = el("img", null, "profile-photo");
    image.src = person.photo;
    image.alt = person.name;
    const body = el("div", null, "profile-body");
    const name = el("h2", person.name);
    name.id = "detail-name";
    body.append(
      el("p", `${person.year} · ${person.category}`, "profile-year"),
      name,
    );
    body.append(
      el("p", "Draft biography · verification pending", "verification"),
    );
    body.append(el("p", profile.blurb, "profile-biography"));
    if (profile.together)
      body.append(
        el(
          "p",
          `With ${profile.partners.join(" and ")}. ${profile.together}`,
          "profile-together",
        ),
      );
    const nav = el("div", null, "pager");
    const previous = el("button", "← Previous"),
      next = el("button", "Next →");
    previous.disabled = index === 0;
    next.disabled = index === people.length - 1;
    previous.addEventListener("click", () => render(index - 1));
    next.addEventListener("click", () => render(index + 1));
    nav.append(previous, next);
    body.append(nav);
    content.replaceChildren(image, body);
    dialog.scrollTop = 0;
  }
  function open(id, anchor) {
    const index = people.findIndex((person) => person.id === id);
    if (index < 0) return;
    opener = anchor;
    render(index);
    dialog.showModal();
  }
  dialog
    .querySelector(".close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    if (opener) opener.focus();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" && current < people.length - 1)
      render(current + 1);
    if (event.key === "ArrowLeft" && current > 0) render(current - 1);
  });
  return { open };
})();
