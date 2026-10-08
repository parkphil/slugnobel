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
    // These four received their prizes before joining Berkeley's faculty.
    const joinedAfterAward = new Set(['John Howard Northrop', 'Wendell Stanley', 'Charles Townes', 'Eric Betzig']);
    const faculty = people.filter((person) => person.relationship === 'Faculty' && !joinedAfterAward.has(person.name));
    const svg = node('svg', {
      class: `faculty-story__svg faculty-story__svg--${mobile ? 'mobile' : 'desktop'}`,
      viewBox: '0 0 780 800',
      role: 'group', 'aria-label': 'Berkeley faculty Nobel laureates; select a portrait for the full description',
    });
    const defs = node('defs');
    svg.append(defs);
    svg.append(node('text', { class: 'faculty-story__heading', x: 24, y: 26 }, 'Berkeley faculty and emeriti · 24'));
    [300, 190, 80].forEach((radius) => svg.append(node('circle', { class: 'faculty-story__guide', cx: 390, cy: 390, r: radius })));
    svg.append(node('text', { class: 'faculty-story__hint', x: 390, y: 783, 'text-anchor': 'middle' }, 'Select a portrait to read their profile.'));
    svg.setAttribute('aria-label','24 laureates who were Berkeley faculty or emeriti at the time of their award; select a portrait for the full description');
    faculty.forEach((person, index) => {
      const ring = index < 12 ? 0 : index < 20 ? 1 : 2;
      const slot = index - [0, 12, 20][ring];
      const count = [12, 8, 4][ring];
      const angle = -Math.PI / 2 + slot * Math.PI * 2 / count + [0, Math.PI / 8, Math.PI / 4][ring];
      const centerX = 390;
      const centerY = 390;
      const radiusX = [300, 190, 80][ring];
      const radiusY = radiusX;
      const x = centerX + Math.cos(angle) * radiusX;
      const y = centerY + Math.sin(angle) * radiusY;
      const clipId = `faculty-clip-${mobile ? 'm' : 'd'}-${person.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
      const radius = 46;
      const clip = node('clipPath', { id: clipId });
      clip.append(node('circle', { cx: 0, cy: 0, r: radius - 5 }));
      defs.append(clip);
      const mark = node('g', { class: 'faculty-story__mark', 'data-year': person.year, transform: `translate(${x} ${y})` });
      mark.dataset.orbitAngle = angle;
      mark.dataset.orbitCenterX = centerX;
      mark.dataset.orbitCenterY = centerY;
      mark.dataset.orbitRadiusX = radiusX;
      mark.dataset.orbitRadiusY = radiusY;
      mark.dataset.orbitDirection = ring === 1 ? -1 : 1;
      interactive(mark, person);
      mark.append(node('circle', { class: 'faculty-story__ring', cx: 0, cy: 0, r: radius, fill: colors[person.category] }));
      mark.append(node('image', { x: -radius + 5, y: -radius + 5, width: (radius - 5) * 2, height: (radius - 5) * 2, href: person.photo, 'clip-path': `url(#${clipId})`, preserveAspectRatio: 'xMidYMid slice' }));
      svg.append(mark);
    });
    facultyFigure.append(svg);
  }
  let orbitTime = 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let previousFrame = 0;
  let lastOrbitDraw = 0;
  function animateOrbit(time) {
    const active = facultyFigure.dataset.orbitReady === 'true' &&
      !document.hidden && !reducedMotion.matches && !document.querySelector('#intro-profile[open]') && !facultyFigure.querySelector('.faculty-story__mark:hover, .faculty-story__mark:focus');
    if (active && previousFrame) orbitTime += Math.min(time - previousFrame, 100);
    if (active && time - lastOrbitDraw > 32) {
      const orbitAngle = Math.sin(orbitTime / 6000) * .10;
      facultyFigure.querySelectorAll('.faculty-story__mark').forEach((mark) => {
        const angle = Number(mark.dataset.orbitAngle) + orbitAngle * Number(mark.dataset.orbitDirection);
        const x = Number(mark.dataset.orbitCenterX) + Math.cos(angle) * Number(mark.dataset.orbitRadiusX);
        const y = Number(mark.dataset.orbitCenterY) + Math.sin(angle) * Number(mark.dataset.orbitRadiusY);
        mark.setAttribute('transform', `translate(${x} ${y})`);
      });
      lastOrbitDraw = time;
    }
    previousFrame = time;
    requestAnimationFrame(animateOrbit);
  }
  requestAnimationFrame(animateOrbit);
  fetch('data/laureates-full.json')
    .then((response) => { if (!response.ok) throw new Error('Laureate data could not load'); return response.json(); })
    .then((people) => {
      people.sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));
      renderYear(people, false);
      renderYear(people, true);
      renderFaculty(people, false);
      renderFaculty(people, true);
      const firstDecade = steps.querySelector('[data-decade-step="fields"]');
      const yearStep = step('year', 'Year of award');
      const yearBox = document.createElement('div');
      yearBox.className = 'intro-scrolly__box intro-scrolly__box--story';
      const yearCopy = document.createElement('p');
      yearCopy.textContent = 'Laureates received their Nobel Prizes between 1934 and 2025.';
      yearBox.append(yearCopy);
      yearStep.append(yearBox);
      steps.insertBefore(yearStep, firstDecade);
      steps.append(step('faculty', 'Faculty laureates'));
      dispatchEvent(new Event('year-timeline:ready'));
    })
    .catch((error) => console.error(error));
})();
