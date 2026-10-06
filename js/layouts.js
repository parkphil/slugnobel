/* Layouts return positions for the same 63 IDs. No scene creates new people. */
window.nobelLayouts = (() => {
  const categories = [
    "Physics",
    "Chemistry",
    "Economics",
    "Physiology or Medicine",
    "Literature",
  ];
  const colors = ["#50798e", "#c29246", "#9783a1", "#6f9484", "#b16f72"];
  const shortNames = [
    "Physics",
    "Chemistry",
    "Economics",
    "Medicine",
    "Literature",
  ];
  const key = (name) =>
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const profiles = window.timelineData.flatMap((group) =>
    group.people.map((person) => ({
      ...person,
      year: group.year,
      category: group.category,
      together: group.together,
      partners: group.people.filter((p) => p !== person).map((p) => p.name),
    })),
  );
  const profileMap = new Map(profiles.map((p) => [key(p.name), p]));
  const people = window.laureates.map((person) => {
    const facultyProfile = profileMap.get(key(person.name));
    return {
      ...person,
      // Use the partner's tighter portrait crop for the existing 23 profiles.
      photo: facultyProfile?.photo || person.photo,
      facultyProfile,
      color: colors[categories.indexOf(person.category)],
    };
  });
  const faculty = people
    .filter((p) => p.facultyProfile)
    .sort((a, b) => a.year - b.year);
  function make(width, height) {
    const mobile = width < 650;
    const dotRadius = mobile ? 4.5 : 5.5;
    const all = [...people].sort(
      (a, b) => a.year - b.year || a.name.localeCompare(b.name),
    );
    const groups = categories.map((category) =>
      all.filter((person) => person.category === category),
    );
    const targets = Object.fromEntries(
      [
        "portraits",
        "photo",
        "trace",
        "frames",
        "categories",
        "timeline",
        "faculty",
      ].map((scene) => [scene, new Map()]),
    );
    const position = (
      person,
      x,
      y,
      r = dotRadius,
      alpha = 1,
      portrait = 0,
    ) => ({ id: person.id, x, y, r, alpha, portrait });

    // The introduction is one complete portrait grid, with a separate reading
    // zone above it. Portraits are never selected or omitted in this scene.
    const columns = mobile ? 7 : 9;
    const rows = Math.ceil(all.length / columns);
    const availableHeight = height * 0.57;
    const pitch = Math.min(
      mobile ? 41 : 64,
      (width * 0.88) / columns,
      availableHeight / rows,
    );
    const radius = Math.max(9, (pitch - (mobile ? 7 : 12)) / 2);
    const left = width / 2 - ((columns - 1) * pitch) / 2;
    const top = height * 0.35 + (availableHeight - (rows - 1) * pitch) / 2;
    all.forEach((person, i) =>
      targets.portraits.set(
        person.id,
        position(
          person,
          left + (i % columns) * pitch,
          top + Math.floor(i / columns) * pitch,
          radius,
          1,
          1,
        ),
      ),
    );

    // The landscape photograph is contained, never cropped or stretched.
    const photoWidth = Math.min(width * 0.92, 980, (height * 0.5 * 1180) / 842);
    const photoHeight = (photoWidth * 842) / 1180;
    const photo = {
      x: (width - photoWidth) / 2,
      y: height * 0.34,
      width: photoWidth,
      height: photoHeight,
      fullHeight: photoHeight,
    };
    const sign = [
      [0.158, 0.293],
      [0.499, 0.263],
      [0.485, 0.846],
      [0.138, 0.846],
    ].map(([x, y]) => ({
      x: photo.x + x * photo.width,
      y: photo.y + y * photo.height,
    }));
    // A photographic pavement texture with open painted dividers and a yellow
    // cross-stripe. The five fields occupy the spaces between six dividers.
    const lotWidth = Math.min(width * 0.91, 1000),
      lotHeight = Math.min(height * 0.42, lotWidth * 0.5);
    const lot = {
      x: (width - lotWidth) / 2,
      y: height * 0.38,
      width: lotWidth,
      height: lotHeight,
    };
    const inset = lotWidth * 0.05,
      bayWidth = (lotWidth - inset * 2) / 5;
    const frames = categories.map((_, i) => ({
      x: lot.x + inset + i * bayWidth,
      y: lot.y + lot.height * 0.09,
      width: bayWidth,
      height: lot.height * 0.83,
    }));
    // Keep the same people visible as a compact contact strip during the photo
    // and outline scenes. They later move directly from this strip into bays.
    const stripCols = mobile ? 21 : 32;
    const stripPitch = Math.min(mobile ? 14 : 19, (width * 0.84) / stripCols);
    const stripTop = Math.max(
      photo.y + photo.height + 24,
      lot.y + lot.height + 30,
    );
    all.forEach((person, i) => {
      const x =
        width / 2 + ((i % stripCols) - (stripCols - 1) / 2) * stripPitch;
      const y = stripTop + Math.floor(i / stripCols) * stripPitch;
      const held = position(person, x, y, mobile ? 3.8 : 7, 1, mobile ? 0 : 1);
      targets.photo.set(person.id, held);
      targets.trace.set(person.id, held);
      targets.frames.set(person.id, held);
    });
    groups.forEach((group, field) =>
      group.forEach((person, i) => {
        const frame = frames[field],
          cols = mobile ? 3 : 4;
        const gap = Math.min(mobile ? 16 : 21, frame.width / (cols + 1));
        targets.categories.set(
          person.id,
          position(
            person,
            frame.x + frame.width / 2 + ((i % cols) - (cols - 1) / 2) * gap,
            frame.y +
              frame.height * 0.4 +
              (Math.floor(i / cols) -
                (Math.ceil(group.length / cols) - 1) / 2) *
                gap,
          ),
        );
      }),
    );

    // All 63 move directly from bays to an exact-year timeline. Collision
    // stacking keeps neighboring years readable without shifting their dates.
    const axis = {
      left: width * 0.065,
      right: width * 0.935,
      y: height * 0.79,
    };
    const yearX = (year) =>
      axis.left + ((year - 1930) / 100) * (axis.right - axis.left);
    const laneEnds = [];
    all.forEach((person) => {
      const x = yearX(person.year);
      let lane = laneEnds.findIndex((end) => x - end >= dotRadius * 2 + 3);
      if (lane < 0) lane = laneEnds.length;
      laneEnds[lane] = x;
      targets.timeline.set(
        person.id,
        position(person, x, axis.y - 16 - lane * (dotRadius * 2 + 4)),
      );
    });

    // The partner’s 23 faculty biographies expand from that same year axis.
    const timelineAxis = { ...axis, y: height * 0.65 };
    const stems = [];
    faculty.forEach((person, i) => {
      const side = i % 2;
      const list = faculty.filter((_, index) => index % 2 === side);
      const slot = Math.floor(i / 2);
      const tiers = mobile ? 2 : 1;
      const tier = slot % tiers;
      const columns = Math.ceil(list.length / tiers);
      const x =
        axis.left +
        ((Math.floor(slot / tiers) + 0.5) / columns) * (axis.right - axis.left);
      const y = height * (side === 0 ? 0.49 - tier * 0.13 : 0.82 + tier * 0.12);
      const r = mobile
        ? Math.min(23, (axis.right - axis.left) / columns / 2 - 5)
        : Math.min(32, width / 29);
      targets.faculty.set(person.id, position(person, x, y, r, 1, 1));
      stems.push({
        id: person.id,
        ax: yearX(person.year),
        ay: timelineAxis.y,
        side,
      });
    });
    all
      .filter((person) => !person.facultyProfile)
      .forEach((person) => {
        const original = targets.timeline.get(person.id);
        targets.faculty.set(person.id, {
          ...original,
          y: original.y + timelineAxis.y - axis.y,
          r: 3,
          alpha: 0.18,
        });
      });
    return {
      width,
      height,
      mobile,
      targets,
      photo,
      sign,
      frames,
      lot,
      axis,
      timelineAxis,
      stems,
    };
  }
  return { people, faculty, categories, colors, shortNames, make };
})();
