(() => {
 const colors={Physics:'#4b9ccf',Chemistry:'#f28147',Economics:'#8e689b','Physiology or Medicine':'#30b189',Literature:'#b8607e'};
 const host=document.querySelector('.portrait-circle'),status=document.querySelector('.gallery__status'),dialog=document.querySelector('.full-profile');
 const svgNode=(tag,attrs={})=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n;};
 dialog.querySelector('.full-profile__close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
 Promise.all(['data/laureates-full.json','data/faculty-profiles.json'].map(url=>fetch(url).then(r=>{if(!r.ok)throw Error('Could not load profiles');return r.json();}))).then(([people,profiles])=>{
  const byName=new Map(people.map(p=>[p.name,p]));
  profiles.sort((a,b)=>byName.get(a.name).year-byName.get(b.name).year||a.name.localeCompare(b.name));
  const svg=svgNode('svg',{viewBox:'0 0 780 760',role:'group','aria-label':'24 Berkeley faculty and emeriti; select a portrait to read a profile'}),defs=svgNode('defs');svg.append(defs);host.append(svg);
  const rings=[{count:12,radius:300,start:0},{count:8,radius:190,start:12},{count:4,radius:80,start:20}],marks=[];
  rings.forEach((ring,ri)=>{
   svg.append(svgNode('circle',{cx:390,cy:380,r:ring.radius,class:'portrait-circle__guide'}));
   for(let slot=0;slot<ring.count;slot++){
    const profile=profiles[ring.start+slot],person=byName.get(profile.name),angle=-Math.PI/2+slot*2*Math.PI/ring.count+(ri===1?Math.PI/8:ri===2?Math.PI/4:0),radius=46;
    const clip=svgNode('clipPath',{id:`portrait-${person.id}`});clip.append(svgNode('circle',{r:radius-5}));defs.append(clip);
    const mark=svgNode('g',{class:'portrait-circle__mark',role:'button',tabindex:0,'aria-label':`${person.name}, ${person.category}, ${person.year}. Read profile`});
    mark.append(svgNode('circle',{r:radius,fill:colors[person.category]}),svgNode('image',{x:-radius+5,y:-radius+5,width:(radius-5)*2,height:(radius-5)*2,href:person.photo,'clip-path':`url(#portrait-${person.id})`,preserveAspectRatio:'xMidYMid slice'}),svgNode('circle',{r:radius+4,class:'portrait-circle__outline'}));
    const label=svgNode('text',{y:radius+23,class:'portrait-circle__label'});label.textContent=person.name;mark.append(label);
    const open=()=>{dialog.style.setProperty('--field',colors[person.category]);const image=dialog.querySelector('img');image.src=person.photo;image.alt=person.name;dialog.querySelector('h2').textContent=person.name;dialog.querySelector('.full-profile__meta').textContent=`${person.category} · ${person.year}`;dialog.querySelector('.full-profile__body').replaceChildren(...profile.paragraphs.map(copy=>{const p=document.createElement('p');p.textContent=copy;return p;}));dialog.showModal();};
    mark.addEventListener('click',open);mark.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open();}});
    marks.push({mark,angle,ring:ri,radius:ring.radius});svg.append(mark);
   }
  });
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let time=0,last=0;
  function draw(now){const paused=!!svg.querySelector(':hover.portrait-circle__mark,:focus.portrait-circle__mark')||dialog.open||document.hidden;if(last&&!paused&&!reduced.matches)time+=Math.min(now-last,50);last=now;marks.forEach(({mark,angle,ring,radius})=>{const drift=Math.sin(time/6000)*.10*(ring===1?-1:1);const a=angle+drift;mark.setAttribute('transform',`translate(${390+Math.cos(a)*radius} ${380+Math.sin(a)*radius})`);});requestAnimationFrame(draw);}
  requestAnimationFrame(draw);status.hidden=true;
 }).catch(error=>status.textContent=error.message);
})();
