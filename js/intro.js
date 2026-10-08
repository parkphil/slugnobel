(() => {
  const grid = document.getElementById('intro-portrait-grid');
  const key = document.querySelector('.intro-visual__key');
  const focusSteps = [...document.querySelectorAll('.intro-scrolly__step[data-focus]')];
  const dialog = document.getElementById('intro-profile');
  const content = dialog.querySelector('.intro-profile__content');
  const tooltip = document.getElementById('laureate-tooltip');
  const colors = {
    Physics: '#4b9ccf',
    Chemistry: '#f28147',
    Economics: '#8e689b',
    'Physiology or Medicine': '#30b189',
    Literature: '#b8607e',
  };
  const labels = {
    'Physiology or Medicine': 'Medicine',
  };
  let selectedCategory = null;
  let activeFocus = 'all';
  let currentPeople = [];
  let biographies = new Map();
  const normalize = (name) => name.normalize('NFKD').toLowerCase().replace(/[^a-z]/g, '');
  const emphasize = (category) => {
    grid.querySelectorAll('.intro-portrait').forEach((portrait) => {
      const relationshipMatch = activeFocus === 'all' || (activeFocus === 'Women' ? portrait.dataset.gender === 'female' : portrait.dataset.relationship === activeFocus);
      const categoryMatch = !category || portrait.dataset.category === category;
      portrait.classList.toggle('is-dimmed', !(relationshipMatch && categoryMatch));
    });
    key.querySelectorAll('.intro-visual__key-item').forEach((item) => {
      item.setAttribute('aria-pressed', String(item.dataset.category === selectedCategory));
    });
  };
  function updateFocus() {
    const heading=document.querySelector('.intro-visual__heading');
    const firstBox=focusSteps[1]?.querySelector('.intro-scrolly__box');
    if(heading&&firstBox){const progress=Math.max(0,Math.min(1,(innerHeight-firstBox.getBoundingClientRect().top)/(innerHeight*.22)));heading.style.opacity=1-progress;}
    let relationship = 'all';
    for (const step of focusSteps.slice(1)) {
      const element = step.querySelector('.intro-scrolly__box') || step;
      const box = element.getBoundingClientRect();
      if (box.top < innerHeight * .66) relationship = step.dataset.focus;
    }
    if (relationship === activeFocus) return;
    activeFocus = relationship;
    selectedCategory = null;
    emphasize(null);
  }
  let focusQueued = false;
  addEventListener('scroll', () => {
    if (focusQueued) return;
    focusQueued = true;
    requestAnimationFrame(() => { focusQueued = false; updateFocus(); });
  }, { passive: true });
  addEventListener('resize', updateFocus);
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const sourceLink = (person) => {
    const link = make('a', 'intro-profile__link', 'Nobel Prize record ↗');
    link.href = person.nobelUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  };
  // Descriptions in laureates-full.json come from Berkeley Inspire's Nobel page.
  const inspireCitation = () => {
    const note = make('p', 'intro-profile__source', 'From ');
    const link = make('a', null, 'Berkeley Inspire');
    link.href = 'https://inspire.berkeley.edu/get-inspired/nobels/';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    note.append(link);
    return note;
  };
  function openProfile(person) {
    content.replaceChildren();
    content.style.setProperty('--category-color', colors[person.category]);
    const head = make('div', 'intro-profile__head');
    const body = make('div', 'intro-profile__body');
    const photo = make('img');
    photo.src = person.photo;
    photo.alt = '';
    const title = make('div');
    title.append(
      make('p', 'intro-profile__kicker', `${person.year} · ${person.category}`),
      make('h3', null, person.name),
    );
    title.querySelector('h3').id = 'intro-profile-name';
    head.append(photo);
    body.append(title);
    content.append(head, body);
    body.append(make('p', 'intro-profile__meta', `${person.relationship}${person.credentials ? ` · ${person.credentials}` : ''}`));
    const hasBiography = person.relationship === 'Faculty' && biographies.has(normalize(person.name));
    const fromInspire = !hasBiography && Boolean(person.description);
    const paragraphs = hasBiography
      ? biographies.get(normalize(person.name))
      : [person.description || person.motivation];
    paragraphs.forEach((paragraph) => body.append(make('p', 'intro-profile__description', paragraph)));
    if (fromInspire) body.append(inspireCitation());
    window.markLabMentions?.(body);
    if (person.nobelUrl) body.append(sourceLink(person));
    dialog.showModal();
  }
  function preview(person) {
    const description = person.relationship === 'Faculty' && biographies.has(normalize(person.name))
      ? biographies.get(normalize(person.name)).join(' ')
      : person.description || person.motivation || '';
    const sentences = description.match(/[^.!?]+[.!?]+/g) || [description];
    return sentences.slice(0, 2).join(' ').trim().slice(0, 260);
  }
  function moveTooltip(x, y) {
    const width = tooltip.offsetWidth || 340;
    const height = tooltip.offsetHeight || 160;
    tooltip.style.left = `${Math.min(x + 16, innerWidth - width - 12)}px`;
    tooltip.style.top = `${Math.max(12, Math.min(y + 16, innerHeight - height - 12))}px`;
  }
  function showTooltip(target, x, y) {
    const person = currentPeople.find((candidate) => candidate.id === target?.dataset.personId);
    if (!person || dialog.open) return;
    tooltip.replaceChildren();
    const title = make('strong', 'laureate-tooltip__name', person.name);
    const meta = make('span', 'laureate-tooltip__meta', `${person.year} · ${person.category}`);
    const description = make('p', 'laureate-tooltip__description', preview(person));
    tooltip.append(title, meta, description);
    if(target.dataset.affiliations)tooltip.append(make('p','laureate-tooltip__meta',target.dataset.affiliations));
    tooltip.hidden = false;
    moveTooltip(x, y);
  }
  const selector = '.intro-portrait, .parking-lot__dot, .age-chart__person, .year-story__dot, .faculty-story__mark, .parking-bridge__item, .map-story__dot';
  const interactiveTarget = (target) => {
    const dot = target?.closest?.(selector);
    if (!dot) return null;
    for (let node = dot; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) < .05) return null;
    }
    return getComputedStyle(dot).pointerEvents === 'none' ? null : dot;
  };
  let hoveredDot = null;
  document.addEventListener('pointerover', (event) => {
    const target = interactiveTarget(event.target);
    if (target) { hoveredDot = target; showTooltip(target, event.clientX, event.clientY); }
  });
  document.addEventListener('pointermove', (event) => {
    const target = interactiveTarget(event.target);
    if (!target) { hoveredDot = null; tooltip.hidden = true; return; }
    if (target !== hoveredDot) { hoveredDot = target; showTooltip(target, event.clientX, event.clientY); }
    else if (!tooltip.hidden) moveTooltip(event.clientX, event.clientY);
  });
  document.addEventListener('pointerout', (event) => {
    if (interactiveTarget(event.target) && interactiveTarget(event.relatedTarget) !== hoveredDot) {
      hoveredDot = null;
      tooltip.hidden = true;
    }
  });
  addEventListener('scroll', () => { hoveredDot = null; tooltip.hidden = true; }, { passive: true });
  document.addEventListener('focusin', (event) => {
    const target = interactiveTarget(event.target);
    if (target) { const rect = target.getBoundingClientRect(); showTooltip(target, rect.right, rect.top); }
  });
  document.addEventListener('focusout', () => { tooltip.hidden = true; });
  document.addEventListener('click', (event) => {
    const target = interactiveTarget(event.target);
    if (!target || target.matches('.intro-portrait, .year-story__dot, .faculty-story__mark')) return;
    const person = currentPeople.find((candidate) => candidate.id === target.dataset.personId);
    if (person) openProfile(person);
  });
  dialog.querySelector('.intro-profile__close').addEventListener('click', () => dialog.close());
  addEventListener('open-laureate-profile', (event) => {
    const person = currentPeople.find((candidate) => candidate.id === event.detail?.id);
    if (person) openProfile(person);
  });
  Promise.all([
    fetch('data/laureates-full.json').then((response) => { if (!response.ok) throw new Error('Laureate data could not load'); return response.json(); }),
    fetch('data/faculty-profiles.json').then((response) => { if (!response.ok) throw new Error('Faculty descriptions could not load'); return response.json(); }),
  ])
    .then(([people, facultyProfiles]) => {
      biographies = new Map(facultyProfiles.map((profile) => [normalize(profile.name), profile.paragraphs]));
      currentPeople = people;
      people.sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));
      for (const step of focusSteps.slice(1)) {
        const count = people.filter((person) => step.dataset.focus === 'all' || (step.dataset.focus === 'Women' ? person.gender === 'female' : person.relationship === step.dataset.focus)).length;
        const countLabel=step.querySelector('[data-focus-count]');
        if(countLabel)countLabel.textContent = `${count} of ${people.length}`;
      }
      for (const [category, color] of Object.entries(colors)) {
        const item = make('button', 'intro-visual__key-item');
        item.type = 'button';
        item.dataset.category = category;
        item.setAttribute('aria-pressed', 'false');
        item.style.setProperty('--category-color', color);
        item.append(make('i', 'intro-visual__key-dot'), make('span', null, labels[category] || category));
        item.addEventListener('pointerenter', () => emphasize(category));
        item.addEventListener('pointerleave', () => emphasize(selectedCategory));
        item.addEventListener('focus', () => emphasize(category));
        item.addEventListener('blur', () => emphasize(selectedCategory));
        item.addEventListener('click', () => {
          selectedCategory = selectedCategory === category ? null : category;
          emphasize(selectedCategory);
        });
        key.append(item);
      }
      for (const person of people) {
        const button = make('button', 'intro-portrait');
        button.type = 'button';
        button.dataset.category = person.category;
        button.dataset.personId = person.id;
        button.dataset.relationship = person.relationship;
        button.dataset.gender = person.gender;
        button.dataset.year = person.year;
        button.style.setProperty('--category-color', colors[person.category]);
        button.setAttribute('aria-label', `${person.name}, ${person.year}, ${person.category}. Open profile`);
        const image = make('img');
        image.src = person.photo;
        image.alt = '';
        image.loading = 'lazy';
        button.append(image);
        button.addEventListener('click', () => openProfile(person));
        grid.append(button);
      }
      activeFocus = '';
      updateFocus();
      dispatchEvent(new Event('intro-portraits:ready'));
    })
    .catch((error) => {
      grid.textContent = 'The portraits could not load.';
      console.error(error);
    });
})();
