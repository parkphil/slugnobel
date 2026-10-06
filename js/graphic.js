/* Persistent SVG people, keyed by Nobel ID. Each scene changes only geometry,
   image visibility, and emphasis. Portraits and hover details share one record. */
window.nobelGraphic = (() => {
  const root = document.getElementById("nobel-clean-lines");
  const svg = root.querySelector(".nobel-svg");
  const ns = "http://www.w3.org/2000/svg";
  const { people, categories, colors, shortNames } = window.nobelLayouts;
  const layer = (name) => svg.querySelector("." + name);
  const el = (tag, attrs = {}, text = "") => {
    const node = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) =>
      node.setAttribute(key, value),
    );
    if (text) node.textContent = text;
    return node;
  };
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const defs = el("defs");
  svg.prepend(defs);
  const photoClip = el("clipPath", { id: "scene-photo-clip" });
  const photoMask = el("rect");
  photoClip.append(photoMask);
  defs.append(photoClip);
  const photoLayer = el("g", {
    class: "scene-photo",
    "clip-path": "url(#scene-photo-clip)",
  });
  const photoImage = el("image", {
    href: "assets/images/nobel-sign-landscape.jpg",
    preserveAspectRatio: "none",
  });
  photoLayer.append(photoImage);
  layer("lines").before(photoLayer);
  // Sample an unpainted patch from the supplied photograph using SVG viewBox.
  // The reference image itself stays unchanged; all paint is drawn as live SVG.
  const texture = el("pattern", {
    id: "parking-texture",
    width: 85,
    height: 85,
    patternUnits: "userSpaceOnUse",
  });
  const patch = el("svg", {
    width: 85,
    height: 85,
    viewBox: "15 220 85 85",
    overflow: "hidden",
  });
  patch.append(
    el("image", {
      href: "assets/images/parking-reference.png",
      width: 740,
      height: 370,
    }),
  );
  texture.append(patch);
  defs.append(texture);
  const pavement = el("rect", {
    class: "photographic-pavement",
    fill: "url(#parking-texture)",
  });
  photoLayer.after(pavement);
  const crossStripe = el("path", {
    class: "yellow-stripe",
    fill: "none",
    stroke: "#eab52b",
    "stroke-width": 6,
  });
  const signOutline = el("path", {
    class: "sign-outline",
    fill: "none",
    stroke: "#eeeee9",
    "stroke-width": 2,
  });
  layer("lines").append(crossStripe, signOutline);
  const borders = Array.from({ length: 6 }, () => {
    const path = el("path", { class: "paint" });
    layer("lines").append(path);
    return path;
  });
  const labels = categories.map((category, i) => {
    const label = el("text", { class: "bay-label" }, shortNames[i]);
    layer("labels").append(label);
    return label;
  });
  const nodes = people.map((person) => {
    const anchor = el("a", {
      class: "person",
      href: "#",
      "data-person-id": person.id,
      "aria-label": `${person.name}, ${person.year}, ${person.category}`,
    });
    const clip = el("clipPath", { id: "portrait-" + person.id });
    const mask = el("circle", { r: 0 });
    clip.append(mask);
    defs.append(clip);
    const ring = el("circle", {
      class: "person-ring",
      stroke: person.color,
      fill: "white",
    });
    const image = el("image", {
      href: person.photo,
      preserveAspectRatio: "xMidYMid slice",
      "clip-path": `url(#portrait-${person.id})`,
      class: "person-photo",
    });
    const hit = el("circle", { class: "person-hit", fill: "transparent" });
    const name = el(
      "text",
      { class: "person-label" },
      person.name.split(" ").at(-1),
    );
    anchor.append(ring, image, hit, name);
    layer("marks").append(anchor);
    window.laureateDetails.bind(anchor, person);
    return { person, anchor, ring, image, mask, hit, name, state: null };
  });
  const stems = new Map();
  window.nobelLayouts.faculty.forEach((person) => {
    const path = el("path", {
      class: "timeline-stem",
      "data-person-id": person.id,
    });
    layer("stems").append(path);
    stems.set(person.id, path);
  });
  const legend = root.querySelector(".graphic-legend");
  categories.forEach((category, i) => {
    const label = document.createElement("span"),
      mark = document.createElement("i");
    mark.style.borderColor = colors[i];
    mark.style.background = colors[i];
    label.append(mark, shortNames[i]);
    legend.append(label);
  });

  let geometry,
    fromScene = "portraits",
    toScene = "portraits",
    fraction = 0;
  let fromStep = null,
    toStep = null,
    animation = 0;
  function resize() {
    const width = svg.clientWidth;
    const height = Math.max(380, svg.clientHeight);
    geometry = window.nobelLayouts.make(width, height);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    render();
  }
  function setScene(
    from,
    to = from,
    amount = 0,
    firstStep = null,
    secondStep = null,
  ) {
    fromScene = from;
    toScene = to;
    fraction = Math.max(0, Math.min(1, amount));
    fromStep = firstStep;
    toStep = secondStep;
    if (!animation)
      animation = requestAnimationFrame(() => {
        animation = 0;
        render();
      });
  }
  function weight(scene) {
    const t = smooth(fraction);
    return (fromScene === scene ? 1 - t : 0) + (toScene === scene ? t : 0);
  }
  function render() {
    if (!geometry) return;
    const { width, height, targets, photo, sign, frames, lot, mobile } =
      geometry;
    const t = smooth(fraction);
    const facultyWeight = weight("faculty"),
      portraitsWeight = weight("portraits");
    const frameWeight = weight("frames") + weight("categories");
    const focused = (fraction < 0.5 ? fromStep : toStep)?.dataset.highlight;
    nodes.forEach((node) => {
      const a = targets[fromScene].get(node.person.id),
        b = targets[toScene].get(node.person.id);
      const state = Object.fromEntries(
        ["x", "y", "r", "alpha", "portrait"].map((key) => [
          key,
          mix(a[key], b[key], t),
        ]),
      );
      if (focused && !focused.split(",").includes(node.person.category))
        state.alpha *= 0.2;
      node.state = state;
      node.anchor.setAttribute(
        "transform",
        `translate(${state.x.toFixed(2)} ${state.y.toFixed(2)})`,
      );
      node.anchor.style.opacity = state.alpha;
      node.anchor.style.visibility = state.alpha < 0.01 ? "hidden" : "visible";
      const radius = state.r;
      node.ring.setAttribute("r", radius);
      node.ring.setAttribute("stroke-width", mix(1.6, 2.4, state.portrait));
      node.ring.setAttribute("stroke", node.person.color);
      node.ring.setAttribute("fill", radius > 7 ? "#fff" : node.person.color);
      node.image.setAttribute("x", -radius * 0.84);
      node.image.setAttribute("y", -radius * 0.84);
      node.image.setAttribute("width", radius * 1.68);
      node.image.setAttribute("height", radius * 1.68);
      node.mask.setAttribute("r", radius * 0.84);
      node.image.style.opacity = state.portrait;
      node.hit.setAttribute("r", radius + (mobile ? 8 : 5));
      node.name.setAttribute("y", radius + 18);
      node.name.style.opacity =
        mobile || !node.person.facultyProfile ? 0 : facultyWeight;
      node.name.style.pointerEvents = "none";
    });
    for (const [name, value] of Object.entries({
      x: photo.x,
      y: photo.y,
      width: photo.width,
      height: photo.height,
    }))
      photoMask.setAttribute(name, value);
    for (const [name, value] of Object.entries({
      x: photo.x,
      y: photo.y,
      width: photo.width,
      height: photo.fullHeight,
    }))
      photoImage.setAttribute(name, value);
    const connecting = fromScene === "trace" && toScene === "frames";
    const blend = connecting
      ? smooth(Math.min(1, fraction / 0.3))
      : frameWeight;
    const inkMorph = connecting
      ? smooth(Math.max(0, Math.min(1, (fraction - 0.15) / 0.75)))
      : t;
    photoLayer.style.opacity = connecting
      ? 1 - blend
      : weight("photo") + weight("trace");
    for (const [k, v] of Object.entries({
      x: connecting ? mix(photo.x, lot.x, inkMorph) : lot.x,
      y: connecting ? mix(photo.y, lot.y, inkMorph) : lot.y,
      width: connecting ? mix(photo.width, lot.width, inkMorph) : lot.width,
      height: connecting ? mix(photo.height, lot.height, inkMorph) : lot.height,
    }))
      pavement.setAttribute(k, v);
    pavement.style.opacity = connecting ? blend : frameWeight;
    const stripeY = lot.y + lot.height * 0.74;
    crossStripe.setAttribute("d", `M${lot.x},${stripeY} H${lot.x + lot.width}`);
    crossStripe.style.opacity = frameWeight;
    const drawingLines = fromScene === "trace" && toScene === "frames";
    crossStripe.setAttribute("pathLength", 1);
    crossStripe.style.strokeDasharray = "1";
    crossStripe.style.strokeDashoffset = drawingLines
      ? 1 - Math.max(0, (fraction - 0.65) / 0.35)
      : 0;
    // The whole outline is traced once. During the morph, six contiguous
    // portions of that exact outline take over, so the stroke never restarts.
    signOutline.setAttribute(
      "d",
      "M" +
        polygon(sign)
          .map((p) => `${p.x},${p.y}`)
          .join(" L"),
    );
    signOutline.style.opacity = connecting ? 0 : weight("trace");
    signOutline.setAttribute("pathLength", 1);
    signOutline.style.strokeDasharray = "1";
    signOutline.style.strokeDashoffset =
      fromScene === "photo" && toScene === "trace" ? 1 - fraction : 0;
    borders.forEach((path, i) => {
      const a = borderFor(fromScene, i),
        b = borderFor(toScene, i);
      path.setAttribute(
        "d",
        "M" +
          a
            .map(
              (point, j) =>
                `${mix(point.x, b[j].x, inkMorph).toFixed(2)},${mix(point.y, b[j].y, inkMorph).toFixed(2)}`,
            )
            .join(" L"),
      );
      const traceWeight = weight("trace");
      path.style.opacity =
        frameWeight + weight("timeline") + (connecting ? traceWeight : 0);
      path.setAttribute("pathLength", 1);
      path.style.strokeDasharray = "1";
      path.style.strokeDashoffset = 0;
      path.setAttribute(
        "stroke",
        connecting || traceWeight > 0.5 || frameWeight > 0.5
          ? "#eeeee9"
          : "#aaa",
      );
      path.setAttribute(
        "stroke-width",
        connecting
          ? mix(2, mobile ? 3 : 5, inkMorph)
          : frameWeight > 0.5
            ? mobile
              ? 3
              : 5
            : traceWeight > 0.5
              ? 2
              : 1.2,
      );
      if (i < 5) {
        const frame = frames[i];
        labels[i].setAttribute("x", frame.x + frame.width / 2);
        labels[i].setAttribute("y", lot.y - 18);
        labels[i].textContent =
          shortNames[i] +
          (mobile
            ? ""
            : " · " +
              people.filter((person) => person.category === categories[i])
                .length);
        labels[i].style.opacity = frameWeight;
      }
    });
    root.querySelector(".graphic-legend").style.opacity =
      weight("photo") + weight("trace") > 0.9 ? 0 : 1;
    layer("opening").style.opacity = 0;
    drawAxes();
    geometry.stems.forEach((stem) => {
      const path = stems.get(stem.id),
        point = nodes.find((n) => n.person.id === stem.id).state;
      const endpoint = point.y + (stem.side === 0 ? point.r : -point.r);
      const bend = (endpoint + stem.ay) / 2;
      path.setAttribute(
        "d",
        `M${point.x},${endpoint} C${point.x},${bend} ${stem.ax},${bend} ${stem.ax},${stem.ay}`,
      );
      path.style.opacity = facultyWeight;
    });
    // Hover details follow their circle during a transition, and remain local to it.
    window.laureateDetails.place();
    root.dataset.scene = fraction < 0.5 ? fromScene : toScene;
  }
  function polygon(points) {
    return Array.from({ length: 81 }, (_, j) => {
      const segment = Math.min(3, Math.floor(j / 20)),
        t = (j - segment * 20) / 20;
      const a = points[segment],
        b = points[(segment + 1) % 4];
      return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) };
    });
  }
  function borderFor(scene, i) {
    if (scene === "photo" || scene === "trace") {
      const outline = polygon(geometry.sign);
      return Array.from({ length: 81 }, (_, j) => {
        const index = ((i + j / 80) / 6) * 80;
        const k = Math.min(79, Math.floor(index)),
          t = index - k;
        return {
          x: mix(outline[k].x, outline[k + 1].x, t),
          y: mix(outline[k].y, outline[k + 1].y, t),
        };
      });
    }
    if (scene === "frames" || scene === "categories") {
      const frame = geometry.frames[Math.min(i, 4)];
      const x = i === 5 ? frame.x + frame.width : frame.x;
      return Array.from({ length: 81 }, (_, j) => ({
        x,
        y: frame.y + (j / 80) * frame.height,
      }));
    }
    const { axis } = geometry;
    return Array.from({ length: 81 }, (_, j) => ({
      x: axis.left + ((i + j / 80) / 6) * (axis.right - axis.left),
      y: axis.y,
    }));
  }
  function drawAxes() {
    const axisLayer = layer("axis");
    axisLayer.replaceChildren();
    for (const scene of ["timeline", "faculty"]) {
      const opacity = weight(scene);
      if (opacity === 0) continue;
      const axis = scene === "timeline" ? geometry.axis : geometry.timelineAxis;
      const g = el("g", { opacity });
      g.append(
        el("line", {
          class: "year-axis",
          x1: axis.left,
          x2: axis.right,
          y1: axis.y,
          y2: axis.y,
        }),
      );
      for (let i = 0; i < 10; i++) {
        if (geometry.mobile && i % 3 !== 0) continue;
        const x = axis.left + (i / 10) * (axis.right - axis.left);
        g.append(
          el("text", { class: "year-label", x, y: axis.y + 22 }, 1930 + i * 10),
        );
      }
      if (scene === "timeline")
        g.append(
          el(
            "text",
            { class: "axis-title", x: geometry.width / 2, y: axis.y + 53 },
            "Year of Nobel Prize",
          ),
        );
      axisLayer.append(g);
    }
  }
  svg.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const box = svg.getBoundingClientRect();
    // account for SVG meet alignment, including any vertical letterboxing
    const scale = Math.min(
      box.width / geometry.width,
      box.height / geometry.height,
    );
    const x =
      (event.clientX - box.left - (box.width - geometry.width * scale) / 2) /
      scale;
    const y =
      (event.clientY - box.top - (box.height - geometry.height * scale) / 2) /
      scale;
    let best = null,
      distance = Infinity;
    nodes.forEach((node) => {
      if (node.state.alpha < 0.1) return;
      const d = Math.hypot(x - node.state.x, y - node.state.y);
      if (d < node.state.r + 8 && d < distance) {
        best = node;
        distance = d;
      }
    });
    nodes.forEach((node) =>
      node.anchor.classList.toggle("is-hovered", node === best),
    );
    if (best) window.laureateDetails.show(best.person, best.anchor);
    else window.laureateDetails.hide();
  });
  svg.addEventListener("pointerleave", () => {
    nodes.forEach((node) => node.anchor.classList.remove("is-hovered"));
  });
  addEventListener(
    "scroll",
    () => {
      nodes.forEach((node) => node.anchor.classList.remove("is-hovered"));
    },
    { passive: true },
  );
  new ResizeObserver(resize).observe(root);
  addEventListener("resize", resize);
  resize();
  return { setScene, nodes };
})();
