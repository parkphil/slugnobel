/* Shared inline historical notes, including dynamically opened profiles. */
(() => {
  const info =
        "Founded by Ernest Lawrence in 1931 as the Radiation Laboratory, or “Rad Lab.” The lab was named after Lawrence in 1959, and, in 1995, finally renamed to its current title, Lawrence Berkeley National Laboratory, a U.S. Department of Energy lab managed by University of California.";
  const pattern = /Lawrence Berkeley National Lab(?:oratory)?|Lawrence Radiation Laboratory|Radiation Lab(?:oratory)?|Rad Lab|Berkeley Lab/g;

  const notes = [
    { pattern, info, className: "lab-mention" },
    {
      pattern: /\bManhattan Project\b/gi,
      info: "The Manhattan Project was the United States’ World War II program to develop the first atomic bombs. Berkeley researchers contributed through uranium-isotope separation and work at Los Alamos, where J. Robert Oppenheimer directed the laboratory.",
      className: "manhattan-mention",
    },
  ];

  function markMentions(root, { pattern, info, className }) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.parentElement?.closest(".lab-mention, .manhattan-mention, script, style, svg")
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT,
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const text = node.nodeValue;
      pattern.lastIndex = 0;
      if (!pattern.test(text)) return;
      const fragment = document.createDocumentFragment();
      let last = 0;
      text.replace(pattern, (match, index) => {
        const mark = document.createElement("mark");
        mark.className = className;
        mark.textContent = match;
        mark.dataset.info = info;
        mark.tabIndex = 0;
        fragment.append(text.slice(last, index), mark);
        last = index + match.length;
      });
      fragment.append(text.slice(last));
      node.replaceWith(fragment);
    });
  }

  // Apply the same notes to article text, profile popups and map tooltips.
  function markHistoricalMentions(root) {
    notes.forEach((note) => markMentions(root, note));
  }

  window.markHistoricalMentions = markHistoricalMentions;
  document.querySelectorAll("main .prose, .intro-scrolly__steps").forEach(markHistoricalMentions);
})();
