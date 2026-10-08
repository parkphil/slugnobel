(() => {
  const colors={Physics:'#4b9ccf',Chemistry:'#f28147',Economics:'#8e689b','Physiology or Medicine':'#30b189',Literature:'#b8607e'};
  const countryAnchors={US:[-100,39],CA:[-106,57],MX:[-102,24],GB:[-3,55],FR:[2,46],DE:[10,51],IT:[12,42],SE:[16,63],LT:[24,55],UA:[32,49],HU:[19,47],IL:[35,31],JO:[37,31],TW:[121,24]};
  // Campus anchors, not the location of individual discoveries or laboratory buildings.
  const institutions=[
    {name:'Max Planck · Leipzig',coordinate:[12.38,51.34],region:0,matches:a=>a.name.startsWith('Max Planck Institute for Evolutionary')},
    {name:'Max Planck · Garching',coordinate:[11.65,48.25],region:0,matches:a=>a.name.startsWith('Max Planck Institute for Extraterrestrial')},
    {name:'MIT',coordinate:[-71.09,42.36],region:1,matches:a=>a.name.startsWith('Massachusetts Institute of Technology')},
    {name:'Harvard Medical School / MGH',coordinate:[-71.06,42.36],region:1,matches:a=>/^(Harvard Medical School|Massachusetts General Hospital)/.test(a.name)},
    {name:'UC Berkeley',coordinate:[-122.2585,37.8719],matches:a=>a.name.startsWith('University of California, Berkeley,')},
    {name:'Stanford',coordinate:[-122.1697,37.4275],matches:a=>/^Stanford University(?:,| School of Medicine,)/.test(a.name)},
  ];
  institutions.forEach(i=>{if(i.region===undefined)i.region=2;});
  const svg=d3.select('#bay-map'),tooltip=document.querySelector('#map-tooltip'),dialog=document.querySelector('#map-profile');
  const clamp=t=>Math.max(0,Math.min(1,t)),ease=t=>t*t*(3-2*t),mix=(a,b,t)=>a+(b-a)*t;
  const text=(tag,value)=>{const el=document.createElement(tag);el.textContent=value;return el;};
  function tooltipPosition(event){tooltip.style.left=`${Math.max(12,Math.min(event.clientX+16,innerWidth-tooltip.offsetWidth-12))}px`;tooltip.style.top=`${Math.max(12,Math.min(event.clientY+16,innerHeight-tooltip.offsetHeight-12))}px`;}
  function preview(event,person){if(dialog.open)return;tooltip.replaceChildren(text('strong',person.name),text('span',`${person.year} · ${person.category}`),text('span',person.institution?.name||person.birthCountry));tooltip.hidden=false;tooltipPosition(event);}
  function profile(person,profiles){tooltip.hidden=true;const content=document.querySelector('#profile-content');content.replaceChildren();const img=document.createElement('img');img.src=person.photo;img.alt='';img.style.background=colors[person.category];content.append(img,text('h2',person.name));const meta=text('p',`${person.year} · ${person.category} · ${person.relationship}`);meta.className='meta';content.append(meta);for(const p of profiles.find(p=>p.name===person.name)?.paragraphs||[person.description||person.motivation])content.append(text('p',p));dialog.showModal();}
  document.querySelector('.profile-close').addEventListener('click',()=>dialog.close());
  Promise.all(['data/land-10m.json','data/map-ready.json','data/laureates-full.json','data/faculty-profiles.json','data/world-110m.json'].map(url=>fetch(url).then(response=>{if(!response.ok)throw new Error(`Could not load ${url}`);return response.json();}))).then(([land,map,full,profiles,worldMap])=>{
    const people=map.people.flatMap(person=>institutions.filter(i=>person.awardAffiliations.some(i.matches)).map(institution=>({...full.find(p=>p.id===person.id),...person,institution})));
    const projection=d3.geoNaturalEarth1().precision(.01).fitExtent([[75,40],[1125,615]],{type:'Sphere'});
    const heading=svg.append('text').attr('class','bay-heading').attr('x',74).attr('y',25);
    const geography=svg.append('g');
    const landFeature=topojson.feature(land,land.objects.land).features[0];
    const polygons=landFeature.geometry.coordinates.filter(polygon=>polygon[0].some(coordinate=>coordinate[1]>-60)).map(coordinates=>d3.geoArea({type:'Polygon',coordinates})>2*Math.PI?coordinates.map(ring=>[...ring].reverse()):coordinates);
    geography.selectAll('path').data(polygons.map(coordinates=>({type:'Polygon',coordinates}))).join('path').attr('class','bay-land').attr('d',d3.geoPath(projection).digits(5));
    geography.append('path').attr('d',d3.geoPath(projection).digits(5)(topojson.mesh(worldMap,worldMap.objects.countries,(a,b)=>a!==b))).attr('fill','none').attr('stroke','white').attr('stroke-width',.8).attr('vector-effect','non-scaling-stroke');
    const views=[{name:'Germany',center:[12,49.8],scale:12},{name:'Cambridge / Boston',center:[-71.075,42.36],scale:80},{name:'San Francisco Bay Area',center:[-122.30,37.65],scale:125}];
    const world=[600,320,1200];
    const cameras=views.map(v=>{const p=projection(v.center);return [p[0],p[1],1200/v.scale];});
    const detail=svg.append('text').attr('class','bay-total').attr('x',74).attr('y',47);
    const note=svg.append('text').attr('class','bay-total').attr('x',74).attr('y',625).text('Source: Nobel Prize award records · Location anchors are approximate');
    const ruler=svg.append('g');
    const rulerLine=ruler.append('path').attr('fill','none').attr('stroke','#546971').attr('stroke-width',1);
    const rulerText=ruler.append('text').attr('class','bay-total').attr('x',1030).attr('y',605);
    const annotations=svg.append('g');
    const sf=annotations.append('text').attr('class','bay-place').text('San Francisco');
    const oakland=annotations.append('text').attr('class','bay-place').text('Oakland');
    const water=annotations.append('text').attr('class','bay-water-label').text('San Francisco Bay');
    const markerLayer=svg.append('g');
    institutions.forEach(institution=>{
      institution.members=people.filter(p=>p.institution===institution).sort((a,b)=>a.year-b.year);
      institution.marker=markerLayer.append('g');
      institution.column=institution.marker.append('g').attr('class','bay-column').attr('role','button').attr('aria-label',`${institution.name}: ${institution.members.length} laureates`);
      institution.front=institution.column.append('path').attr('class','bay-column-front');
      institution.side=institution.column.append('path').attr('class','bay-column-side');
      institution.cap=institution.column.append('path').attr('class','bay-column-cap');
      institution.column.on('pointerenter',event=>{if(dialog.open)return;tooltip.replaceChildren(text('strong',institution.name),text('span',`${institution.members.length} laureates affiliated at the time of the award`),...institution.members.map(p=>text('span',`${p.year} · ${p.name}`)));tooltip.hidden=false;tooltipPosition(event);}).on('pointermove',tooltipPosition).on('pointerleave',()=>{tooltip.hidden=true;});
      institution.anchor=institution.marker.append('circle').attr('class','bay-anchor').attr('r',4);
      institution.card=institution.marker.append('g');
      institution.card.append('text').attr('class','bay-label').attr('y',0).text(institution.name);
      const years=d3.extent(institution.members,p=>p.year);
      institution.card.append('text').attr('class','bay-total').attr('y',19).text(`${institution.members.length} laureate${institution.members.length===1?'':'s'} · ${years[0]===years[1]?years[0]:years.join('–')}`);
    });
    const counters={};
    const dots=svg.append('g').selectAll('circle').data(people).join('circle').attr('class','bay-dot').attr('data-person-id',p=>p.id).attr('r',8).attr('fill',p=>colors[p.category]).attr('role','button').attr('aria-label',p=>`${p.name}, ${p.year}. Open profile`)
      .on('pointerenter',preview).on('pointermove',tooltipPosition).on('pointerleave',()=>{tooltip.hidden=true;}).on('focus',function(event,p){const rect=this.getBoundingClientRect();preview({clientX:rect.right,clientY:rect.top},p);}).on('blur',()=>{tooltip.hidden=true;}).on('click',(_,p)=>profile(p,profiles)).on('keydown',(event,p)=>{if(['Enter',' '].includes(event.key)){event.preventDefault();profile(p,profiles);}});
    people.forEach(person=>{const anchor=projection(countryAnchors[person.birthCountryCode]);const slot=counters[person.birthCountryCode]||0;counters[person.birthCountryCode]=slot+1;person.origin=[anchor[0]+(slot%10)*17-65,anchor[1]+Math.floor(slot/10)*17+20];});
    let queued=false;
    function draw(){
      const t=clamp(scrollY/(document.querySelector('.bay-scroll').offsetHeight-innerHeight));
      const segment=Math.min(2,Math.floor(t*3)),local=clamp(t*3-segment);
      // Pull back before travelling, then approach the next region. All markers share the camera.
      let frame;
      if(segment===0)frame=d3.interpolateZoom(world,cameras[0])(ease(clamp(local/.55)));
      else if(local<.22)frame=d3.interpolateZoom(cameras[segment-1],world)(ease(local/.22));
      else frame=d3.interpolateZoom(world,cameras[segment])(ease(clamp((local-.22)/.38)));
      const sprout=ease(clamp((local-.65)/.2))*(segment===2?1:1-ease(clamp((local-.92)/.08)));
      const [cx,cy,width]=frame,scale=1200/width;
      const tilt=1-.14*sprout;
      geography.attr('transform',`translate(600,320) scale(${scale},${scale*tilt}) translate(${-cx},${-cy})`);
      const screen=coordinate=>{const [x,y]=projection(coordinate);return [600+(x-cx)*scale,320+(y-cy)*scale*tilt];};
      heading.text(local<.6?'Non-Berkeley Affiliation at the time of the award':views[segment].name).raise();
      detail.text(`${segment+1} / 3 · Column height: laureates affiliated at the time of the award`).raise();note.raise();
      const km=[100,5,10][segment],center=views[segment].center;
      const p1=projection(center),p2=projection([center[0]+km/(111.32*Math.cos(center[1]*Math.PI/180)),center[1]]);
      const rulerWidth=Math.abs(p2[0]-p1[0])*scale;
      ruler.attr('opacity',sprout).raise();rulerLine.attr('d',`M1030,611v5h${rulerWidth}v-5`);rulerText.text(`${km} km`);
      annotations.attr('opacity',segment===2?sprout:0);
      const [sx,sy]=screen([-122.4194,37.7749]);sf.attr('x',sx-95).attr('y',sy+15);
      const [ox,oy]=screen([-122.2711,37.8044]);oakland.attr('x',ox+12).attr('y',oy+10);
      const [wx,wy]=screen([-122.29,37.7]);water.attr('x',wx-110).attr('y',wy);
      institutions.forEach(institution=>{
        const [x,y]=screen(institution.coordinate);
        institution.position=[x,y];
        institution.marker.attr('opacity',institution.region===segment?sprout:0);
        const height=institution.members.length*7*sprout;
        institution.height=height;
        institution.column.attr('transform',`translate(${x},${y})`).attr('pointer-events',institution.region===segment&&sprout>.99?'all':'none');
        institution.front.attr('d',`M-10,0H10V${-height}H-10Z`);
        institution.side.attr('d',`M10,0L17,-6V${-height-6}L10,${-height}Z`);
        institution.cap.attr('d',`M-10,${-height}L-3,${-height-6}H17L10,${-height}Z`);
        institution.anchor.attr('cx',x).attr('cy',y);
        const side=institution.name==='MIT'?-220:14;
        institution.card.attr('transform',`translate(${x+side+12},${y-height-18})`);
      });
      dots.each(function(person){
        let x=0,y=0,opacity=0;
        if(person.institution&&person.institution.region===segment){const institution=person.institution,[ax,ay]=institution.position,slot=institution.members.indexOf(person),n=institution.members.length,angle=2*Math.PI*slot/n;const radius=n>10?65:28;x=ax+Math.cos(angle)*radius;y=ay+Math.sin(angle)*radius*.45+28;opacity=sprout;}
        const interactive=opacity>.99;
        d3.select(this).attr('cx',x).attr('cy',y).attr('opacity',opacity).attr('pointer-events',interactive?'all':'none').attr('tabindex',interactive?0:-1);
      });
    }
    function queue(){tooltip.hidden=true;if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;draw();});}
    addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);draw();
  }).catch(error=>{const el=document.querySelector('#bay-error');el.hidden=false;el.textContent=error.message;console.error(error);});
})();
