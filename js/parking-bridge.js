(() => {
  const intro = document.querySelector('.intro-scrolly');
  const canvas = intro?.querySelector('.parking-lot__canvas');
  if (!intro || !canvas) return;

  const stages = [...intro.querySelectorAll('[data-parking-step]')];
  const morphStage = stages.find((stage) => stage.dataset.parkingStep === 'morph');
  const categoryStages = stages.filter((stage) => !['context', 'morph'].includes(stage.dataset.parkingStep));
  const decadeChart = intro.querySelector('.decade-chart');
  const fieldStage = intro.querySelector('[data-decade-step="fields"]');
  const totalStage = intro.querySelector('[data-decade-step="totals"]');
  const ageStage = intro.querySelector('[data-story-step="age"]');
  const ageChart = intro.querySelector('.age-chart');
  const yearStage = () => intro.querySelector('[data-timeline-step="year"]');
  const shareStage = () => intro.querySelector('[data-timeline-step="share"]');
  const facultyStage = () => intro.querySelector('[data-timeline-step="faculty"]');
  const yearChart = intro.querySelector('.year-story');
  const facultyChart = intro.querySelector('.faculty-story');
  const overlay = document.createElement('div');
  overlay.className = 'parking-bridge';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.append(overlay);
  const axisBridge = document.createElement('div');
  axisBridge.className = 'parking-bridge__axis-line';

  const clamp = (value) => Math.max(0, Math.min(1, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t * t * (3 - 2 * t);
  const progress = (stage) => clamp((innerHeight * .85 - stage.getBoundingClientRect().top) / (innerHeight * .7));
  const morphProgress = () => clamp((innerHeight * .95 - morphStage.getBoundingClientRect().top) / (innerHeight * 1.15));
  let sources = null;
  let clones = new Map();
  let queued = false;

  function capture() {
    const portraits = [...intro.querySelectorAll('.intro-portrait')];
    if (!portraits.length) return false;
    sources = new Map();
    clones = new Map();
    overlay.replaceChildren();
    overlay.append(axisBridge);
    for (const [index, portrait] of portraits.entries()) {
      const rect = portrait.getBoundingClientRect();
      const id = portrait.dataset.personId;
      sources.set(id, {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
        size: rect.width,
        opacity: Number(getComputedStyle(portrait).opacity),
        category: portrait.dataset.category,
        index,
      });
      const clone = document.createElement('div');
      clone.className = 'parking-bridge__item';
      clone.dataset.personId = id;
      clone.style.backgroundColor = getComputedStyle(portrait).backgroundColor;
      const photo = document.createElement('img');
      photo.src = portrait.querySelector('img').src;
      photo.alt = '';
      clone.append(photo);
      overlay.append(clone);
      clones.set(id, clone);
    }
    return true;
  }

  function draw() {
    const morph = morphProgress();
    const figure = intro.querySelector('.intro-visual');
    if (morph <= 0 || figure.getBoundingClientRect().bottom <= 0) {
      intro.classList.remove('is-bridging');
      overlay.style.display = 'none';
      intro.classList.remove('is-faculty');
      canvas.querySelectorAll('.parking-lot__dot').forEach((dot) => { dot.style.opacity = 0; });
      canvas.querySelectorAll('.parking-lot__stripe, .parking-lot__stalls path').forEach((line) => {
        line.style.strokeDashoffset = 1;
        line.style.opacity = 0;
      });
      canvas.querySelectorAll('.parking-lot__field').forEach((field) => {
        field.style.setProperty('--field-opacity', 0);
      });
      if (decadeChart) decadeChart.style.opacity = 0;
      if (ageChart) ageChart.style.opacity = 0;
      if (yearChart) yearChart.style.opacity = 0;
      if (facultyChart) facultyChart.style.opacity = 0;
      canvas.style.opacity = 1;
      if (morph <= 0) sources = null;
      return;
    }
    if (!sources && !capture()) return;
    intro.classList.add('is-bridging');
    overlay.style.display = 'block';

    const mobile = innerWidth <= 700;
    const layout = mobile ? 'mobile' : 'desktop';
    const targetDots = [...canvas.querySelectorAll(`.parking-lot__svg--${layout} .parking-lot__dot`)];
    const targets = new Map(targetDots.map((dot) => [dot.dataset.personId, dot]));
    const categoryProgress = new Map(categoryStages.map((stage) => [stage.dataset.parkingStep, progress(stage)]));
    const shrinking = clamp((morph - .04) / .7);
    const gathering = clamp((morph - .18) / .77);
    const dotSize = mobile ? 14 : 16;
    const canvasRect = canvas.getBoundingClientRect();
    const fieldPhase = fieldStage ? ease(clamp((innerHeight * .88 - fieldStage.getBoundingClientRect().top) / (innerHeight * 1.08))) : 0;
    const totalPhase = totalStage ? ease(clamp((innerHeight * .86 - totalStage.getBoundingClientRect().top) / (innerHeight * .95))) : 0;
    const agePhase = ageStage ? ease(clamp((innerHeight * .88 - ageStage.getBoundingClientRect().top) / (innerHeight * .95))) : 0;
    const yearPhase = yearStage() ? ease(clamp((innerHeight * .88 - yearStage().getBoundingClientRect().top) / (innerHeight * 1.08))) : 0;
    const facultyPhase = facultyStage() ? ease(clamp((innerHeight * .88 - facultyStage().getBoundingClientRect().top) / (innerHeight * 1.05))) : 0;
    intro.classList.toggle('is-faculty', facultyPhase > .9);
    canvas.style.opacity = 1 - yearPhase;
    const stripe = canvas.querySelector(`.parking-lot__svg--${layout} .parking-lot__stripe`);
    const decadeAxis = decadeChart?.querySelector(`.decade-chart__svg--${layout} .decade-chart__axis`);
    if (stripe && decadeAxis && yearPhase > 0 && yearPhase < .995) {
      const from = stripe.getBoundingClientRect();
      const to = decadeAxis.getBoundingClientRect();
      axisBridge.style.display = 'block';
      axisBridge.style.left = `${mix(from.left, to.left, yearPhase)}px`;
      axisBridge.style.top = `${mix(from.top, to.top, yearPhase)}px`;
      axisBridge.style.width = `${mix(Math.max(from.width, 5), Math.max(to.width, 2.5), yearPhase)}px`;
      axisBridge.style.height = `${mix(Math.max(from.height, 5), Math.max(to.height, 2.5), yearPhase)}px`;
      const colorPhase = ease(clamp((yearPhase - .7) / .3));
      axisBridge.style.backgroundColor = `rgb(${Math.round(mix(208, 137, colorPhase))} ${Math.round(mix(177, 147, colorPhase))} ${Math.round(mix(89, 142, colorPhase))})`;
    } else axisBridge.style.display = 'none';
    if (decadeChart) {
      decadeChart.style.opacity = yearPhase;
      decadeChart.querySelectorAll('.decade-chart__heading, .decade-chart__count').forEach((label) => {
        label.style.opacity = (label.classList.contains('decade-chart__count') ? totalPhase : fieldPhase) * (1 - ease(clamp(agePhase / .38)));
      });
      decadeChart.querySelectorAll('.decade-chart__axis').forEach((line) => {
        line.style.strokeDashoffset = 1 - yearPhase;
        line.style.opacity = ease(clamp((yearPhase - .85) / .15));
      });
      decadeChart.querySelectorAll('.decade-chart__trend').forEach((line) => { line.style.strokeDashoffset = 1 - totalPhase; });
      decadeChart.querySelectorAll('.decade-chart__trend').forEach((line) => { line.style.opacity = 1 - ease(clamp(agePhase / .38)); });
    }
    const fieldDots = [...(decadeChart?.querySelectorAll(`.decade-chart__svg--${layout} .decade-chart__target--field`) || [])];
    const totalDots = [...(decadeChart?.querySelectorAll(`.decade-chart__svg--${layout} .decade-chart__target--total`) || [])];
    const fieldTargets = new Map(fieldDots.map((dot) => [dot.dataset.personId, dot]));
    const totalTargets = new Map(totalDots.map((dot) => [dot.dataset.personId, dot]));
    if (ageChart) {
      ageChart.style.opacity = agePhase * (1 - ease(clamp(facultyPhase / .45)));
      ageChart.querySelectorAll('.age-chart__heading, .age-chart__label, .age-chart__note, .age-chart__legend-line').forEach((label) => {
        label.style.opacity = ease(clamp((agePhase - .38) / .35));
      });
      ageChart.querySelectorAll('.age-chart__mean-line').forEach((line) => { line.style.strokeDashoffset = 1 - agePhase; });
    }
    intro.querySelectorAll('.intro-scrolly__step--age .intro-scrolly__box, .intro-scrolly__step--year .intro-scrolly__box').forEach((box) => {
      box.style.opacity = clamp((box.getBoundingClientRect().top - innerHeight * .31) / (innerHeight * .08));
    });
    const ageTargets = new Map([...(ageChart?.querySelectorAll(`.age-chart__svg--${layout} .age-chart__person`) || [])].map((target) => [target.dataset.personId, target]));
    ageTargets.forEach((target) => { target.style.opacity = .6 * (1 - ease(clamp(facultyPhase / .6))); });
    const yearTargets = new Map([...(yearChart?.querySelectorAll(`.year-story__svg--${layout} .year-story__dot`) || [])].map((target) => [target.dataset.personId, target]));
    const facultyTargets = new Map([...(facultyChart?.querySelectorAll(`.faculty-story__svg--${layout} .faculty-story__mark`) || [])].map((target) => [target.dataset.personId, target]));
    if (yearChart) {
      yearChart.style.opacity = yearPhase * (1 - fieldPhase);
      yearChart.style.pointerEvents = yearPhase > .98 && fieldPhase < .05 ? 'auto' : 'none';
      const shareActive = shareStage() &&
        shareStage().getBoundingClientRect().top < innerHeight * .58 && fieldPhase < .1;
      yearTargets.forEach((dot) => {
        const isFullRecent = dot.dataset.portion === '1' && Number(dot.dataset.year) >= 1990;
        dot.style.opacity = (shareActive && !isFullRecent ? .12 : 1);
      });
    }
    if (facultyChart) {
      facultyChart.style.opacity = facultyPhase;
      facultyChart.style.pointerEvents = facultyPhase > .95 ? 'auto' : 'none';
      facultyChart.querySelectorAll('.faculty-story__mark').forEach((mark) => { mark.style.opacity = ease(clamp((facultyPhase - .76) / .24)); });
    }
    decadeChart.style.pointerEvents = fieldPhase > .98 && agePhase < .05 ? 'auto' : 'none';
    ageChart.style.pointerEvents = agePhase > .98 && facultyPhase < .05 ? 'auto' : 'none';

    canvas.querySelectorAll('.parking-lot__stripe, .parking-lot__stalls path').forEach((line, index) => {
      const lineProgress = clamp((morph - .12 - (index % 7) * .035) / .56);
      line.style.strokeDashoffset = 1 - ease(lineProgress);
      line.style.opacity = lineProgress > 0 ? 1 - ease(clamp(yearPhase / .18)) : 0;
    });
    canvas.querySelectorAll('.parking-lot__dots').forEach((group) => { group.style.opacity = 1; });
    canvas.querySelectorAll('.parking-lot__field').forEach((field) => {
      field.style.setProperty('--field-opacity', clamp((morph - .42) / .38));
      field.style.opacity = 1 - ease(clamp(yearPhase / .18));
    });

    for (const [id, source] of sources) {
      const dot = targets.get(id);
      if (!dot) continue;
      const target = dot.getBoundingClientRect();
      const categoryFill = categoryProgress.get(source.category) || 0;
      const order = Number(dot.dataset.memberIndex);
      const count = Number(dot.dataset.categoryCount);
      const fill = ease(clamp((categoryFill - order / Math.max(1, count - 1) * .42) / .58));
      const queueSlot = (source.index * 17) % sources.size;
      const queueRow = Math.floor(queueSlot / 16);
      const queueColumn = queueSlot % 16;
      const rowCount = Math.min(16, sources.size - queueRow * 16);
      const queueX = innerWidth / 2 + (queueColumn - (rowCount - 1) / 2) * (mobile ? 18 : 30);
      const queueY = canvasRect.top - (mobile ? 105 : 135) + queueRow * (mobile ? 22 : 27);
      const motion = Math.sin(Math.PI * gathering);
      const wanderX = Math.sin(source.index * 29.17) * (mobile ? 5 : 9) * motion;
      const wanderY = Math.cos(source.index * 47.83) * (mobile ? 4 : 7) * motion;
      const centerX = mix(mix(source.x, queueX, gathering) + wanderX, target.x + target.width / 2, fill);
      const centerY = mix(mix(source.y, queueY, gathering) + wanderY, target.y + target.height / 2, fill) - Math.sin(fill * Math.PI) * 12;
      const size = mix(mix(source.size, dotSize, shrinking), target.width, fill);
      const clone = clones.get(id);
      clone.style.pointerEvents = fieldPhase > .98 && agePhase < .05 ? 'auto' : 'none';
      if (facultyPhase > 0 && ageTargets.has(id)) {
        const from = ageTargets.get(id).getBoundingClientRect();
        const to = facultyTargets.get(id)?.getBoundingClientRect();
        const position = ease(facultyPhase);
        const targetX = to ? to.x + to.width / 2 : from.x + from.width / 2;
        const targetY = to ? to.y + to.height / 2 : from.y + from.height / 2;
        const facultySize = to ? mix(from.width, to.width, position) : from.width;
        const x = mix(from.x + from.width / 2, targetX, position);
        const y = mix(from.y + from.height / 2, targetY, position);
        clone.style.width = `${facultySize}px`;
        clone.style.height = `${facultySize}px`;
        clone.style.transform = `translate3d(${x - facultySize / 2}px, ${y - facultySize / 2}px, 0)`;
        clone.style.opacity = to ? 1 - ease(clamp((facultyPhase - .78) / .22)) : 1 - facultyPhase;
        clone.style.setProperty('--photo-opacity', to ? ease(clamp((facultyPhase - .35) / .45)) : 0);
        dot.style.opacity = 0;
        continue;
      }
      if (agePhase > 0 && totalTargets.has(id) && ageTargets.has(id)) {
        const from = totalTargets.get(id).getBoundingClientRect();
        const to = ageTargets.get(id).getBoundingClientRect();
        const position = ease(agePhase);
        const ageSize = mix(from.width, to.width, position);
        const ageX = mix(from.x + from.width / 2, to.x + to.width / 2, position);
        const ageY = mix(from.y + from.height / 2, to.y + to.height / 2, position);
        clone.style.width = `${ageSize}px`;
        clone.style.height = `${ageSize}px`;
        clone.style.transform = `translate3d(${ageX - ageSize / 2}px, ${ageY - ageSize / 2}px, 0)`;
        clone.style.opacity = 1 - ease(clamp((agePhase - .8) / .2));
        clone.style.setProperty('--photo-opacity', 0);
        dot.style.opacity = 0;
        continue;
      }
      if (fieldPhase > 0 && fieldTargets.has(id) && totalTargets.has(id)) {
        const yearRect = yearTargets.get(id)?.getBoundingClientRect() || target;
        const fieldRect = fieldTargets.get(id).getBoundingClientRect();
        const totalRect = totalTargets.get(id).getBoundingClientRect();
        const fieldX = fieldRect.x + fieldRect.width / 2;
        const fieldY = fieldRect.y + fieldRect.height / 2;
        const totalX = totalRect.x + totalRect.width / 2;
        const totalY = totalRect.y + totalRect.height / 2;
        const decadeX = mix(mix(yearRect.x + yearRect.width / 2, fieldX, fieldPhase), totalX, totalPhase);
        const decadeY = mix(mix(yearRect.y + yearRect.height / 2, fieldY, fieldPhase), totalY, totalPhase);
        const decadeSize = mix(yearRect.width, mix(fieldRect.width, totalRect.width, totalPhase), fieldPhase);
        clone.style.width = `${decadeSize}px`;
        clone.style.height = `${decadeSize}px`;
        clone.style.transform = `translate3d(${decadeX - decadeSize / 2}px, ${decadeY - decadeSize / 2}px, 0)`;
        clone.style.opacity = 1;
        clone.style.setProperty('--photo-opacity', 0);
        dot.style.opacity = 0;
        continue;
      }
      if (yearPhase > 0 && yearTargets.has(id)) {
        const to = yearTargets.get(id).getBoundingClientRect();
        const position = ease(yearPhase);
        const yearSize = mix(target.width, to.width, position);
        const yearX = mix(target.x + target.width / 2, to.x + to.width / 2, position);
        const yearY = mix(target.y + target.height / 2, to.y + to.height / 2, position);
        clone.style.width = `${yearSize}px`;
        clone.style.height = `${yearSize}px`;
        clone.style.transform = `translate3d(${yearX - yearSize / 2}px, ${yearY - yearSize / 2}px, 0)`;
        clone.style.opacity = 1 - ease(clamp((yearPhase - .78) / .22));
        clone.style.setProperty('--photo-opacity', 0);
        dot.style.opacity = 0;
        continue;
      }
      clone.style.width = `${size}px`;
      clone.style.height = `${size}px`;
      clone.style.transform = `translate3d(${centerX - size / 2}px, ${centerY - size / 2}px, 0)`;
      clone.style.opacity = fill >= .999 ? 0 : mix(source.opacity, 1, clamp(morph / .35));
      clone.style.setProperty('--photo-opacity', 1 - clamp((morph - .05) / .55));
      dot.style.opacity = fill >= .999 ? 1 : 0;
    }
  }

  function queueDraw() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; draw(); });
  }
  addEventListener('scroll', queueDraw, { passive: true });
  addEventListener('resize', () => { sources = null; queueDraw(); });
  addEventListener('intro-portraits:ready', queueDraw);
  addEventListener('parking-lot:ready', queueDraw);
  addEventListener('decade-chart:ready', queueDraw);
  addEventListener('age-chart:ready', queueDraw);
  addEventListener('year-timeline:ready', queueDraw);
  queueDraw();
})();
