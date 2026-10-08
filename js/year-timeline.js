(() => {
  const intro = document.querySelector('.intro-scrolly');
  const steps = intro?.querySelector('.intro-scrolly__steps');
  const yearFigure = intro?.querySelector('.year-story');
  const facultyFigure = intro?.querySelector('.faculty-story');
  if (!steps || !yearFigure || !facultyFigure) return;
  const ns = 'http://www.w3.org/2000/svg';
  const colors = {
    Physics: '#4b9ccf', Chemistry: '#f28147', Economics: '#8e689b',
    'Physiology or Medicine': '#30b189', Literature: '#b8607e',
  };
  const node = (tag, attrs = {}, value) => {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, val]) => el.setAttribute(key, val));
    if (value != null) el.textContent = value;
    return el;
  };
  const step = (name, label) => {
    const section = document.createElement('section');
    section.className = 'intro-scrolly__step intro-scrolly__step--year';
    section.dataset.timelineStep = name;
    section.setAttribute('aria-label', label);
    if (name !== 'faculty') {
      const box = document.createElement('div');
      box.className = 'intro-scrolly__box intro-scrolly__box--story';
      const text = document.createElement('p');
      text.textContent = '[Writing]';
      box.append(text);
      section.append(box);
    }
    return section;
  };
  const open = (person) => dispatchEvent(new CustomEvent('open-laureate-profile', { detail: { id: person.id } }));
  const interactive = (element, person) => {
    element.dataset.personId = person.id;
    element.setAttribute('tabindex', '0');
    element.setAttribute('role', 'button');
    element.setAttribute('aria-label', `${person.name}, ${person.year}, ${person.category}. Open profile`);
    element.addEventListener('click', () => open(person));
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(person); }
    });
  };
  function renderYear(people, mobile) {
    const svg = node('svg', {
      class: `year-story__svg year-story__svg--${mobile ? 'mobile' : 'desktop'}`,
      viewBox: mobile ? '0 0 500 770' : '0 0 1200 520',
      role: 'img', 'aria-label': 'Berkeley Nobel laureates by year, one dot per person',
    });
    svg.append(node('text', { class: 'year-story__heading', x: mobile ? 20 : 74, y: mobile ? 25 : 38 }, 'Year of award'));
    const bins = new Map();
    people.forEach((person) => {
      const decade = Math.floor(person.year / 10) * 10;
      const bin = mobile ? decade : Math.floor((person.year - 1930) / 3);
      const index = bins.get(bin) || 0;
      bins.set(bin, index + 1);
      const x = mobile ? 184 + index * 20 : 96 + (person.year - 1930) * 1008 / 90;
      const y = mobile ? 80 + (decade - 1930) / 10 * 59 : 333 - index * 19;
      const dot = node('circle', { class: 'year-story__dot', cx: x, cy: y, r: 8, fill: colors[person.category], 'data-portion': person.portion, 'data-year': person.year });
      interactive(dot, person);
      svg.append(dot);
    });
    yearFigure.append(svg);
  }
  function renderFaculty(people, mobile) {
    const faculty = people.filter((person) => person.relationship === 'Faculty');
    const svg = node('svg', {
      class: `faculty-story__svg faculty-story__svg--${mobile ? 'mobile' : 'desktop'}`,
      viewBox: mobile ? '0 0 500 770' : '0 0 1200 520',
      role: 'img', 'aria-label': 'Berkeley faculty Nobel laureates; select a portrait for the full description',
    });
    const defs = node('defs');
    svg.append(defs);
    svg.append(node('text', { class: 'faculty-story__heading', x: mobile ? 20 : 74, y: mobile ? 25 : 22 }, 'Berkeley faculty laureates'));
    faculty.forEach((person, index) => {
      const row = mobile ? Math.floor(index / 4) : Math.floor(index / 7);
      const column = mobile ? index % 4 : index % 7;
      const x = mobile ? 218 + column * 69 : 135 + column * 155;
      const y = mobile ? 87 + row * 99 : [80, 205, 415, 535][row];
      const anchor = mobile ? { x: 165, y: 80 + (Math.floor(person.year / 10) * 10 - 1930) / 10 * 59 } : { x: 96 + (person.year - 1930) * 1008 / 90, y: 356 };
      const endY = y + (mobile ? 0 : y < 356 ? 40 : -40);
      const stem = node('path', { class: 'faculty-story__stem', d: mobile
        ? `M${anchor.x} ${anchor.y} Q${(anchor.x + x) / 2} ${anchor.y} ${x - 24} ${y}`
        : `M${anchor.x} ${anchor.y} Q${anchor.x} ${(anchor.y + endY) / 2} ${x} ${endY}` });
      svg.append(stem);
      const clipId = `faculty-clip-${mobile ? 'm' : 'd'}-${person.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
      const radius = mobile ? 20 : 45;
      const clip = node('clipPath', { id: clipId });
      clip.append(node('circle', { cx: x, cy: y, r: radius - 5 }));
      defs.append(clip);
      const mark = node('g', { class: 'faculty-story__mark', 'data-year': person.year });
      interactive(mark, person);
      mark.addEventListener('pointerenter', () => stem.classList.add('is-active'));
      mark.addEventListener('pointerleave', () => stem.classList.remove('is-active'));
      mark.addEventListener('focus', () => stem.classList.add('is-active'));
      mark.addEventListener('blur', () => stem.classList.remove('is-active'));
      mark.append(node('circle', { class: 'faculty-story__ring', cx: x, cy: y, r: radius, fill: colors[person.category] }));
      mark.append(node('image', { x: x - radius + 5, y: y - radius + 5, width: (radius - 5) * 2, height: (radius - 5) * 2, href: person.photo, 'clip-path': `url(#${clipId})`, preserveAspectRatio: 'xMidYMid slice' }));
      svg.append(mark);
      svg.append(node('text', { class: 'faculty-story__name', x, y: y + radius + (mobile ? 16 : 20) }, person.name.split(' ').at(-1)));
    });
    facultyFigure.append(svg);
  }
  fetch('data/laureates-full.json')
    .then((response) => { if (!response.ok) throw new Error('Laureate data could not load'); return response.json(); })
    .then((people) => {
      people.sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));
      renderYear(people, false);
      renderYear(people, true);
      renderFaculty(people, false);
      renderFaculty(people, true);
      const firstDecade = steps.querySelector('[data-decade-step="fields"]');
      steps.insertBefore(step('year', 'Year of award'), firstDecade);
      steps.insertBefore(step('share', 'Prize share by year'), firstDecade);
      steps.append(step('faculty', 'Faculty laureates'));
      dispatchEvent(new Event('year-timeline:ready'));
    })
    .catch((error) => console.error(error));
})();
