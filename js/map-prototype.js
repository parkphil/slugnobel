(() => {
  const colors = { Physics: '#4b9ccf', Chemistry: '#f28147', Economics: '#8e689b', 'Physiology or Medicine': '#30b189', Literature: '#b8607e' };
  // Display anchors identify countries, not inferred birthplace coordinates.
  const groups = {
    US: { code: '840', name: 'United States', anchor: [-100, 39], label: [130, 240], cols: 10 },
    CA: { code: '124', name: 'Canada', anchor: [-106, 57], label: [260, 110] },
    MX: { code: '484', name: 'Mexico', anchor: [-102, 24], label: [275, 390] },
    GB: { code: '826', name: 'United Kingdom', anchor: [-3, 55], label: [470, 90] },
    FR: { code: '250', name: 'France', anchor: [2, 46], label: [455, 195] },
    DE: { code: '276', name: 'Germany', anchor: [10, 51], label: [455, 250] },
    IT: { code: '380', name: 'Italy', anchor: [12, 42], label: [455, 305] },
    SE: { code: '752', name: 'Sweden', anchor: [16, 63], label: [660, 70] },
    LT: { code: '440', name: 'Lithuania', anchor: [24, 55], label: [775, 105] },
    UA: { code: '804', name: 'Ukraine', anchor: [32, 49], label: [815, 165] },
    HU: { code: '348', name: 'Hungary', anchor: [19, 47], label: [800, 225] },
    IL: { code: '376', name: 'Israel', anchor: [35, 31], label: [720, 360] },
    JO: { code: '400', name: 'Jordan', anchor: [37, 31], label: [810, 395] },
    TW: { code: '158', name: 'Taiwan', anchor: [121, 24], label: [1040, 325] },
  };
  const svg = d3.select('#birth-map');
  const projection = d3.geoNaturalEarth1().fitExtent([[75, 40], [1125, 615]], { type: 'Sphere' });
  const path = d3.geoPath(projection);
  const tooltip = document.querySelector('#map-tooltip');
  const dialog = document.querySelector('#map-profile');
  const legend = document.querySelector('.map-legend');
  for (const [category, color] of Object.entries(colors)) {
    const label = document.createElement('span'); const dot = document.createElement('i'); dot.style.background = color;
    label.append(dot, category === 'Physiology or Medicine' ? 'Medicine' : category); legend?.append(label);
  }
  function positionTooltip(event) {
    tooltip.style.left = `${Math.max(12, Math.min(event.clientX + 16, innerWidth - tooltip.offsetWidth - 12))}px`;
    tooltip.style.top = `${Math.max(12, Math.min(event.clientY + 16, innerHeight - tooltip.offsetHeight - 12))}px`;
  }
  function text(tag, value) { const el = document.createElement(tag); el.textContent = value; return el; }
  function preview(event, person) {
    tooltip.replaceChildren(text('strong', person.name), text('span', `${person.year} · ${person.category}`), text('span', `${person.relationship} · Born in ${person.birthCountry}`));
    const description = person.description || person.motivation;
    if (description) tooltip.append(text('p', description.length > 220 ? `${description.slice(0,217)}…` : description));
    tooltip.hidden = false; positionTooltip(event);
  }
  function draw(world, people, profiles) {
    const countries = topojson.feature(world, world.objects.countries).features.filter(country => country.id !== '010');
    svg.append('g').selectAll('path').data(countries).join('path').attr('class', country => `map-country${Object.values(groups).some(group => group.code === country.id) ? ' is-represented' : ''}`).attr('d', path);
    svg.append('path').datum(topojson.merge(world, world.objects.countries.geometries.filter(country => country.id !== '010'))).attr('class','map-coast').attr('d',path);
    svg.append('path').datum(topojson.mesh(world, world.objects.countries, (a,b)=>a!==b && a.id!=='010' && b.id!=='010')).attr('class','map-boundaries').attr('d',path);
    const offsets = { US: [-180, 65], CA: [-85, -25], MX: [-30, 100], GB: [-130, -30], FR: [-140, 35], DE: [-25, -40], IT: [-110, 80], SE: [15, -30], LT: [65, -15], UA: [110, 25], HU: [80, 70], IL: [-60, 95], JO: [65, 125], TW: [35, 25] };
    const connectors = svg.append('g'); const labels = svg.append('g'); const dots = svg.append('g');
    Object.entries(groups).forEach(([code, group]) => {
      const members = people.filter(person => person.birthCountryCode === code).sort((a,b) => a.year - b.year);
      const [ax,ay] = projection(group.anchor);
      const [dx,dy] = offsets[code];
      const x = ax + dx; const y = ay + dy; const cols = group.cols || members.length;
      connectors.append('path').attr('class','map-connector').attr('d', `M${ax},${ay} L${x},${y+18}`);
      connectors.append('circle').attr('class','map-anchor').attr('cx',ax).attr('cy',ay).attr('r',2);
      const label = labels.append('text').attr('class','map-country-label').attr('x',x).attr('y',y);
      label.append('tspan').text(group.name); label.append('tspan').attr('class','map-count').attr('dx',8).text(members.length);
      members.forEach((person,index) => {
        dots.append('circle').datum(person).attr('class','map-dot').attr('data-person-id',person.id)
          .attr('cx',x + (index % cols) * 17).attr('cy',y + 18 + Math.floor(index / cols) * 17).attr('r',6.5).attr('fill',colors[person.category])
          .attr('tabindex',0).attr('role','button').attr('aria-label', `${person.name}, ${person.year}, born in ${person.birthCountry}. Open profile`)
          .on('pointerenter',preview).on('pointermove',positionTooltip).on('pointerleave',()=>{tooltip.hidden=true;})
          .on('focus',function(event,p){const rect=this.getBoundingClientRect();preview({clientX:rect.right,clientY:rect.top},p);})
          .on('blur',()=>{tooltip.hidden=true;}).on('click',(_,p)=>open(p,profiles)).on('keydown',(event,p)=>{if(['Enter',' '].includes(event.key)){event.preventDefault();open(p,profiles);}});
      });
    });
    function animate() {
      tooltip.hidden = true;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      svg.selectAll('.map-country').attr('opacity',0).transition().delay(1800).duration(1100).attr('opacity',1);
      svg.selectAll('.map-boundaries').style('stroke','#aab9bd').transition('border-color').delay(2600).duration(600).style('stroke','#fff');
      svg.selectAll('.map-coast, .map-boundaries, .map-connector').interrupt().each(function(){const length=this.getTotalLength();d3.select(this).attr('stroke-dasharray',`${length} ${length}`).attr('stroke-dashoffset',length).transition().delay(this.classList.contains('map-connector')?1800:0).duration(this.classList.contains('map-connector')?900:2600).ease(d3.easeCubicInOut).attr('stroke-dashoffset',0);});
      labels.attr('opacity',0).transition().delay(2300).duration(700).attr('opacity',1);
      connectors.selectAll('circle').attr('opacity',0).transition().delay(2400).duration(600).attr('opacity',1);
      dots.selectAll('circle').interrupt().attr('opacity',0).attr('pointer-events','none').transition().delay((_,index)=>2600+index*12).duration(600).attr('opacity',1).on('end',function(){this.removeAttribute('pointer-events');});
    }
    animate();
  }
  function open(person,profiles) {
    tooltip.hidden=true;const content=document.querySelector('#profile-content');content.replaceChildren();
    const img=document.createElement('img');img.src=person.photo;img.alt='';img.style.background=colors[person.category];
    content.append(img,text('h2',person.name));const meta=text('p',`${person.year} · ${person.category} · ${person.relationship}`);meta.className='meta';content.append(meta);
    const profile=profiles.find(p=>p.name===person.name);
    for(const paragraph of profile?.paragraphs || [person.description || person.motivation]) content.append(text('p',paragraph));
    dialog.showModal();
  }
  document.querySelector('.profile-close').addEventListener('click',()=>dialog.close());
  Promise.all(['data/world-110m.json','data/map-ready.json','data/laureates-full.json','data/faculty-profiles.json'].map(url=>fetch(url).then(response=>{if(!response.ok)throw new Error(`Could not load ${url}`);return response.json();})))
    .then(([world,map,full,profiles])=>draw(world,map.people.map(person=>({...full.find(p=>p.id===person.id),...person})),profiles))
    .catch(error=>{const el=document.querySelector('#map-error');el.hidden=false;el.textContent=error.message;console.error(error);});
})();
