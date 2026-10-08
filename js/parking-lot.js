(() => {
  const lot = document.querySelector('.parking-lot__canvas');
  if (!lot) return;
  const fields = [...lot.querySelectorAll('.parking-lot__field')];
  const colors = ['#4b9ccf', '#f28147', '#8e689b', '#30b189', '#b8607e'];
  const groups = [...lot.querySelectorAll('.parking-lot__dots')];
  const svgNS = 'http://www.w3.org/2000/svg';

  fetch('data/laureates-full.json')
    .then((response) => {
      if (!response.ok) throw new Error('Laureate data could not load');
      return response.json();
    })
    .then((people) => {
      fields.forEach((field, index) => {
        const members = people.filter((person) => person.category === field.dataset.category);
        field.querySelector('.parking-lot__count').textContent = members.length;
        groups.forEach((group, layout) => {
          const columns = layout === 0 ? 4 : 7;
          const spacingX = layout === 0 ? 29 : 28;
          const spacingY = layout === 0 ? 29 : 22;
          const centerX = layout === 0 ? 187.5 + index * 205 : 322;
          const centerY = layout === 0 ? 143 : 125 + index * 130;
          members.forEach((person, personIndex) => {
            const row = Math.floor(personIndex / columns);
            const column = personIndex % columns;
            const rowCount = Math.min(columns, members.length - row * columns);
            const dot = document.createElementNS(svgNS, 'circle');
            dot.setAttribute('class', 'parking-lot__dot');
            dot.setAttribute('cx', centerX + (column - (rowCount - 1) / 2) * spacingX);
            dot.setAttribute('cy', centerY + row * spacingY);
            dot.setAttribute('r', layout === 0 ? 8 : 7);
            dot.setAttribute('fill', colors[index]);
            dot.dataset.personId = person.id;
            dot.dataset.memberIndex = personIndex;
            dot.dataset.categoryCount = members.length;
            group.append(dot);
          });
        });
      });
      dispatchEvent(new Event('parking-lot:ready'));
    })
    .catch((error) => console.error(error));
})();
