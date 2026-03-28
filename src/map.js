const W=800,H=800,CX=400,CY=400;
const C={bg:'#0c0b0a',waste:'#1a1714',wasteD:'#2e2922',wall:'#4a4236',wallS:'#6b6158',
  s0:'#2d4d36',s0s:'#4a7c59',s0f:'rgba(74,124,89,0.15)',s0f2:'rgba(74,124,89,0.25)',
  s1:'#2d4d72',s1s:'#4a7cb5',s1f:'rgba(74,124,181,0.15)',s1f2:'rgba(74,124,181,0.25)',
  s2:'#72602d',s2s:'#b5944a',s2f:'rgba(181,148,74,0.15)',s2f2:'rgba(181,148,74,0.25)',
  s3:'#723828',s3s:'#b55a3a',s3f:'rgba(181,90,58,0.15)',s3f2:'rgba(181,90,58,0.25)',
  gorge:'#3d2418',gorgeS:'#b55a3a',river:'rgba(59,109,154,0.3)',riverS:'#3b6d9a',
  gate:'#a53030',passage:'#4a4236',text:'#e8e0d4',textM:'#6b6158',textS:'#a69c8e',
  accent:'#c4956a',bunker:'#6b5aa5',trade:'#b5944a',outpost:'#a53030',underground:'#8a7cc8',
  bldg:'rgba(160,148,130,0.12)',bldgS:'rgba(160,148,130,0.25)',tree:'rgba(74,124,89,0.3)',treeS:'#4a7c59'};
let layers={underground:true,trade:true,security:true},showDetails=false,currentView='overview',show3d=false;

function polar(cx,cy,r,d){const a=(d-90)*Math.PI/180;return[cx+r*Math.cos(a),cy+r*Math.sin(a)];}
function sectorArc(cx,cy,ri,ro,sd,ed){const si=polar(cx,cy,ri,sd),ei=polar(cx,cy,ri,ed),so=polar(cx,cy,ro,sd),eo=polar(cx,cy,ro,ed),lg=(ed-sd)>180?1:0;return`M${so[0]} ${so[1]} A${ro} ${ro} 0 ${lg} 1 ${eo[0]} ${eo[1]} L${ei[0]} ${ei[1]} A${ri} ${ri} 0 ${lg} 0 ${si[0]} ${si[1]} Z`;}

// ─── Drawing helpers ───
function bldg(x,y,w,h,opts={}){
  const f=opts.fill||C.bldg,s=opts.stroke||C.bldgS,sw=opts.sw||0.4,rx=opts.rx||1;
  return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" stroke="${s}" stroke-width="${sw}"/>`;
}
function landmark(x,y,w,h,opts={}){
  const f=opts.fill||'rgba(196,149,106,0.15)',s=opts.stroke||C.accent;
  return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${opts.rx||2}" fill="${f}" stroke="${s}" stroke-width="${opts.sw||0.6}"/>`;
}
function label(x,y,text,opts={}){
  const sz=opts.size||6.5,c=opts.color||C.textS,anc=opts.anchor||'middle',fw=opts.bold?'500':'400',ff=opts.serif?'Cinzel,serif':'Barlow,sans-serif',op=opts.opacity||1;
  return`<text x="${x}" y="${y}" text-anchor="${anc}" font-size="${sz}" fill="${c}" font-family="${ff}" font-weight="${fw}" opacity="${op}">${text}</text>`;
}
function marker(x,y,text,c=C.accent){
  return`<circle cx="${x}" cy="${y}" r="3" fill="${c}" opacity="0.8"/><circle cx="${x}" cy="${y}" r="5.5" fill="none" stroke="${c}" stroke-width="0.4" opacity="0.4"/>`+label(x,y-8,text,{color:c,size:6.5,bold:true});
}
function tree(x,y,r=3){return`<circle cx="${x}" cy="${y}" r="${r}" fill="${C.tree}" stroke="${C.treeS}" stroke-width="0.3" opacity="0.6"/>`;}
function stall(x,y,w=6,h=4){return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="0.5" fill="rgba(181,148,74,0.2)" stroke="${C.s2s}" stroke-width="0.3"/>`;}
function backBtn(svg){return svg+`<g cursor="pointer" onclick="zoomSector('overview')"><rect x="16" y="14" width="70" height="22" rx="3" fill="rgba(196,149,106,0.1)" stroke="${C.accent}" stroke-width="0.5"/><text x="51" y="28" text-anchor="middle" font-size="8" fill="${C.accent}" font-family="Cinzel,serif">← Overview</text></g>`;}
function titleBar(svg,name,sub,c){return svg+label(400,24,name,{color:c,size:16,bold:true,serif:true})+label(400,40,sub,{color:C.textM,size:9});}
function toggle3dBtn(svg,sec){return svg+`<g cursor="pointer" onclick="toggle3D('${sec}')"><rect x="630" y="14" width="55" height="22" rx="3" fill="rgba(196,149,106,0.1)" stroke="${C.accent}" stroke-width="0.5"/><text x="657" y="28" text-anchor="middle" font-size="8" fill="${C.accent}" font-family="Cinzel,serif">3D View</text></g>`;}

// ─── Procedural building clusters ───
function buildingCluster(x,y,w,h,density,opts={}){
  let s='';const pad=3,rows=Math.floor(h/(8+pad)),cols=Math.floor(w/(10+pad));
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    if(Math.random()>density)continue;
    const bx=x+c*(10+pad)+(Math.random()*3-1.5),by=y+r*(8+pad)+(Math.random()*2-1);
    const bw=6+Math.random()*6,bh=5+Math.random()*4;
    s+=bldg(bx,by,bw,bh,opts);
  }
  return s;
}
function organicStreets(x,y,w,h,count,c=C.s3s){
  let s='';for(let i=0;i<count;i++){
    const x1=x+Math.random()*w,y1=y+Math.random()*h,x2=x1+(Math.random()*80-40),y2=y1+(Math.random()*80-40);
    const cx1=x1+(x2-x1)*0.3+Math.random()*20-10,cy1=y1+(y2-y1)*0.3+Math.random()*20-10;
    s+=`<path d="M${x1} ${y1} Q${cx1} ${cy1} ${x2} ${y2}" fill="none" stroke="${c}" stroke-width="${0.3+Math.random()*0.4}" opacity="${0.1+Math.random()*0.1}"/>`;
  }
  return s;
}

// ═══════════════════════════════════════════
// OVERVIEW MAP
// ═══════════════════════════════════════════
function renderOverview(){
  const R0=95,gap=14,rI=R0+gap+18,rO=310,wallR=rO+14;
  const gateA=[90,210,330],passA=[30,150,270];
  const secs=[
    {start:300,end:60,f:C.s1f,f2:C.s1f2,s:C.s1s,label:'Sector I',sub:'Eastern Quarter',key:'s1'},
    {start:60,end:180,f:C.s2f,f2:C.s2f2,s:C.s2s,label:'Sector II',sub:'Northern Quarter',key:'s2'},
    {start:180,end:300,f:C.s3f,f2:C.s3f2,s:C.s3s,label:'Sector III',sub:'Western Quarter',key:'s3'},
  ];
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%"><defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round"/></marker><radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${C.accent}" stop-opacity="0.08"/><stop offset="100%" stop-color="${C.accent}" stop-opacity="0"/></radialGradient></defs>`;
  s+=`<rect width="${W}" height="${H}" fill="${C.waste}" rx="4"/><circle cx="${CX}" cy="${CY}" r="${wallR+80}" fill="url(#glow)"/>`;
  // Wasteland
  [[45,62],[752,88],[738,510],[55,695],[405,770],[125,375],[680,710],[710,245],[180,55],[620,42],[770,380],[35,480],[590,760]].forEach(([x,y])=>{if(Math.hypot(x-CX,y-CY)>wallR+25)s+=`<circle cx="${x}" cy="${y}" r="${1+Math.random()}" fill="${C.wasteD}" opacity="0.25"/>`;});
  // Trade
  if(layers.trade){[[60,50,'Ashfall Camp'],[740,80,'Iron Ridge'],[750,500,'Dusthaven'],[50,700,'Boneyard Post'],[400,775,'Crater Town'],[130,370,'Mirage Well'],[685,715,'Scorch End'],[705,240,'Radwind Stn']].forEach(([sx,sy,n])=>{const a=Math.atan2(sy-CY,sx-CX)*180/Math.PI+90,wp=polar(CX,CY,wallR+8,a);s+=`<line x1="${wp[0]}" y1="${wp[1]}" x2="${sx}" y2="${sy}" stroke="${C.trade}" stroke-width="0.8" stroke-dasharray="4 4" opacity="0.4"/><rect x="${sx-3}" y="${sy-3}" width="6" height="6" rx="1" fill="${C.trade}" opacity="0.7"/>`+label(sx,sy-7,n,{size:7});});}
  // Wall
  s+=`<circle cx="${CX}" cy="${CY}" r="${wallR}" fill="none" stroke="${C.wall}" stroke-width="3" opacity="0.6"/><circle cx="${CX}" cy="${CY}" r="${wallR-2}" fill="none" stroke="${C.wall}" stroke-width="0.5" opacity="0.2"/>`;
  // Gorge, rivers
  s+=`<path d="${sectorArc(CX,CY,rO-40,rO+8,195,285)}" fill="${C.gorge}" stroke="${C.gorgeS}" stroke-width="0.8" opacity="0.5"/>`;
  [`M${CX-30} ${CY-rO+20} Q${CX-80} ${CY-100} ${CX-160} ${CY+60} Q${CX-200} ${CY+140} ${CX-wallR-40} ${CY+180}`,`M${CX+100} ${CY-rO+40} Q${CX+140} ${CY-60} ${CX+80} ${CY+100} Q${CX+40} ${CY+200} ${CX-20} ${CY+wallR+30}`].forEach(d=>{s+=`<path d="${d}" fill="none" stroke="${C.river}" stroke-width="8" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${C.riverS}" stroke-width="0.8" stroke-linecap="round" opacity="0.3"/>`;});
  // Sectors
  secs.forEach(sec=>{s+=`<path d="${sectorArc(CX,CY,rI,rO,sec.start+3,sec.end-3)}" fill="${sec.f}" stroke="${sec.s}" stroke-width="0.8" cursor="pointer" onclick="zoomSector('${sec.key}')" onmouseover="this.setAttribute('fill','${sec.f2}')" onmouseout="this.setAttribute('fill','${sec.f}')"/>`;const mid=(sec.start+sec.end)/2+(sec.start>sec.end?180:0),[lx,ly]=polar(CX,CY,(rI+rO)/2,mid);s+=label(lx,ly-5,sec.label,{color:sec.s,size:11,bold:true,serif:true})+label(lx,ly+9,sec.sub,{color:sec.s,size:8,opacity:0.7});});
  // Detail landmarks on overview
  if(showDetails){const[s1x,s1y]=polar(CX,CY,(rI+rO)/2,0),[s2x,s2y]=polar(CX,CY,(rI+rO)/2,120),[s3x,s3y]=polar(CX,CY,(rI+rO)/2,240);s+=marker(CX,CY-20,"Kage's Hill",C.s0s)+marker(s1x-15,s1y-10,"Senju",C.s1s)+marker(s1x+20,s1y+12,"Uzumaki",C.s1s)+marker(s2x,s2y-8,"Command Hall",C.s2s)+marker(s2x-30,s2y+15,"Hyūga",C.s2s)+marker(s2x+30,s2y+15,"Uchiha",C.s2s)+marker(s3x+10,s3y-15,"Cmd Hall",C.s3s)+marker(s3x-5,s3y+8,"Plaza",C.s3s);}
  // S3 labels
  const[cs3x,cs3y]=polar(CX,CY,rO-20,240),[mw3x,mw3y]=polar(CX,CY,(rI+rO)/2,240);
  s+=label(cs3x,cs3y-20,"Cliffside Row",{color:C.s3s,size:7,bold:true})+label(mw3x,mw3y+20,"Mid-Warrens",{color:C.s3s,size:7});
  if(layers.underground){const[dw3x,dw3y]=polar(CX,CY,rI+28,240);s+=`<rect x="${dw3x-26}" y="${dw3y+4}" width="52" height="14" rx="2" fill="${C.underground}" opacity="0.15" stroke="${C.underground}" stroke-width="0.5"/>`+label(dw3x,dw3y+14,"Deep Warrens",{color:C.underground,size:7});}
  // Passages, junctions
  passA.forEach(a=>{const ps=polar(CX,CY,rI-2,a),pe=polar(CX,CY,rO+2,a);s+=`<line x1="${ps[0]}" y1="${ps[1]}" x2="${pe[0]}" y2="${pe[1]}" stroke="${C.passage}" stroke-width="6" opacity="0.35"/>`;if(layers.security){const[ox,oy]=polar(CX,CY,(rI+rO)/2,a);s+=`<rect x="${ox-2.5}" y="${oy-2.5}" width="5" height="5" rx="1" fill="${C.outpost}" opacity="0.6"/>`;}});
  const jR=R0+gap+30;passA.forEach(pA=>{gateA.filter(g=>{let d=Math.abs(g-pA);if(d>180)d=360-d;return d<=120;}).forEach(gA=>{const[jx,jy]=polar(CX,CY,jR,pA),[gx,gy]=polar(CX,CY,R0+2,gA);s+=`<line x1="${jx}" y1="${jy}" x2="${gx}" y2="${gy}" stroke="${C.passage}" stroke-width="2.5" opacity="0.25"/>`;});});
  s+=`<circle cx="${CX}" cy="${CY}" r="${R0+gap/2+5}" fill="none" stroke="${C.wall}" stroke-width="0.5" stroke-dasharray="3 3" opacity="0.2"/>`;
  // S0
  s+=`<circle cx="${CX}" cy="${CY}" r="${R0}" fill="${C.s0f}" stroke="${C.s0s}" stroke-width="1.2" cursor="pointer" onclick="zoomSector('s0')" onmouseover="this.setAttribute('fill','${C.s0f2}')" onmouseout="this.setAttribute('fill','${C.s0f}')"/>`+label(CX,CY-5,"Sector Zero",{color:C.s0s,size:12,bold:true,serif:true})+label(CX,CY+9,"Central Core",{color:C.s0s,size:8,opacity:0.7});
  gateA.forEach(a=>{const[gx,gy]=polar(CX,CY,R0,a);s+=`<rect x="${gx-5}" y="${gy-3}" width="10" height="6" rx="1.5" fill="${C.gate}" transform="rotate(${a},${gx},${gy})"/>`;});
  if(layers.underground){[20,100,220].forEach(a=>{const[bx,by]=polar(CX,CY,(rI+rO)/2+30,a);s+=`<rect x="${bx-9}" y="${by-5}" width="18" height="10" rx="2" fill="none" stroke="${C.bunker}" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.5"/>`+label(bx,by+3,"BNK",{color:C.bunker,size:6,opacity:0.7});});s+=`<circle cx="${CX}" cy="${CY}" r="${(rI+rO)/2}" fill="none" stroke="${C.underground}" stroke-width="0.5" stroke-dasharray="6 8" opacity="0.2"/>`;}
  if(layers.security){for(let a=0;a<360;a+=30){const[ox,oy]=polar(CX,CY,wallR,a);s+=`<circle cx="${ox}" cy="${oy}" r="2.5" fill="${C.outpost}" opacity="0.4"/>`;}}
  [{a:350,r:rO-50,l:'Northern hills'},{a:70,r:rO-60,l:'Eastern ridge'},{a:130,r:rI+40,l:'Valley floor'}].forEach(h=>{const[hx,hy]=polar(CX,CY,h.r,h.a);s+=label(hx,hy,h.l,{size:7,opacity:0.5,color:C.textM});});
  [{a:0,l:'N'},{a:90,l:'E'},{a:180,l:'S'},{a:270,l:'W'}].forEach(c=>{const[cx,cy]=polar(CX,CY,wallR+18,c.a);s+=label(cx,cy+3,c.l,{size:9,bold:true,color:C.textM,serif:true});});
  s+=label(CX,24,"TENSEISHI",{color:C.text,size:14,bold:true,serif:true})+label(CX,38,"Fortified Metropolis · ~100-120km radius",{size:8,color:C.textM})+label(CX,H-14,"THE GREAT WASTELAND",{size:8,color:C.textM,opacity:0.5});
  s+=`<line x1="30" y1="${H-32}" x2="130" y2="${H-32}" stroke="${C.textM}" stroke-width="0.8"/><text x="80" y="${H-36}" text-anchor="middle" font-size="7" fill="${C.textM}" font-family="Barlow,sans-serif">~30km</text>`;
  s+=label(CX,H-2,"Click any sector to zoom in",{size:6.5,opacity:0.5,color:C.textM});
  s+='</svg>';return s;
}

// ═══════════════════════════════════════════
// SECTOR ZERO — Concentric rings with buildings
// ═══════════════════════════════════════════
function renderSectorZero(){
  const W=700,H=700,cx=350,cy=350,R=300,rM=200,rI=100;
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%"><rect width="${W}" height="${H}" fill="${C.waste}" rx="4"/>`;
  // Rings
  s+=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${C.s0f}" stroke="${C.s0s}" stroke-width="1"/>`;
  s+=`<circle cx="${cx}" cy="${cy}" r="${rM}" fill="rgba(74,124,89,0.22)" stroke="${C.s0s}" stroke-width="0.5" stroke-dasharray="4 3"/>`;
  s+=`<circle cx="${cx}" cy="${cy}" r="${rI}" fill="rgba(74,124,89,0.32)" stroke="${C.s0s}" stroke-width="0.5" stroke-dasharray="4 3"/>`;
  // Outer ring — industrial buildings (dense, rectangular blocks)
  for(let a=0;a<360;a+=12){const[bx,by]=polar(cx,cy,R-35,a);s+=bldg(bx-8,by-5,16,10,{fill:'rgba(74,124,89,0.1)',stroke:C.s0s,sw:0.3});}
  for(let a=6;a<360;a+=15){const[bx,by]=polar(cx,cy,R-60,a);s+=bldg(bx-6,by-4,12,8,{fill:'rgba(74,124,89,0.08)',stroke:C.s0s,sw:0.2});}
  // Stadium
  s+=`<ellipse cx="${cx+180}" cy="${cy-60}" rx="25" ry="15" fill="rgba(74,124,89,0.12)" stroke="${C.s0s}" stroke-width="0.5"/>`;
  s+=marker(cx+180,cy-60,"Stadium",C.textS);
  // Toven factories
  s+=landmark(cx-210,cy+15,40,25)+marker(cx-190,cy+28,"Toven Factory",C.s2s);
  s+=landmark(cx+150,cy+105,35,22)+label(cx+167,cy+120,"Toven Factory",{color:C.s2s,size:5.5});
  s+=landmark(cx-15,cy+195,50,30)+marker(cx+10,cy+210,"Toven Inc HQ",C.s2s);
  s+=label(cx-180,cy-100,"Oil processing",{color:C.textM,size:5.5});
  s+=bldg(cx-195,cy-95,30,18,{fill:'rgba(181,148,74,0.1)',stroke:C.s2s,sw:0.3});
  // Middle ring — elite estates (larger buildings with gardens)
  for(let a=0;a<360;a+=20){const[bx,by]=polar(cx,cy,rM-30,a);s+=bldg(bx-10,by-7,20,14,{fill:'rgba(74,124,89,0.08)',stroke:C.s0s,sw:0.3});s+=tree(bx+12,by-2,2.5);s+=tree(bx-12,by+3,2);}
  s+=label(cx,cy-rM+15,"Elite Residential",{color:C.s0s,size:8,serif:true,opacity:0.6});
  s+=label(cx,cy-R+15,"Industrial / Commercial",{color:C.s0s,size:8,serif:true,opacity:0.6});
  // Inner ring — government buildings
  s+=landmark(cx-55,cy+20,45,30,{fill:'rgba(74,124,89,0.15)',stroke:C.s0s})+marker(cx-33,cy+35,"Military Command",C.s0s);
  s+=landmark(cx+30,cy+15,40,28,{fill:'rgba(74,124,89,0.15)',stroke:C.s0s})+marker(cx+50,cy+30,"Council Chambers",C.s0s);
  s+=bldg(cx-45,cy-55,30,20,{fill:'rgba(106,90,165,0.12)',stroke:C.underground,sw:0.5})+label(cx-30,cy-42,"ANBU HQ",{color:C.underground,size:5.5,bold:true});
  s+=bldg(cx+40,cy-50,35,22,{fill:'rgba(106,90,165,0.1)',stroke:C.underground,sw:0.5})+marker(cx+57,cy-38,"Archives",C.underground);
  s+=label(cx,cy-rI+15,"Government Core",{color:C.s0s,size:8,serif:true,opacity:0.6});
  // Kage's hill
  s+=`<circle cx="${cx}" cy="${cy-10}" r="22" fill="rgba(196,149,106,0.12)" stroke="${C.accent}" stroke-width="0.8"/>`;
  s+=landmark(cx-12,cy-20,24,18,{fill:'rgba(196,149,106,0.2)',stroke:C.accent,sw:0.8})+marker(cx,cy-10,"Kage's Compound",C.accent);
  // Gates
  [{a:90,l:'Gate 1'},{a:210,l:'Gate 2'},{a:330,l:'Gate 3'}].forEach(g=>{const[gx,gy]=polar(cx,cy,R,g.a),[lx,ly]=polar(cx,cy,R+16,g.a);s+=`<rect x="${gx-8}" y="${gy-4}" width="16" height="8" rx="2" fill="${C.gate}" transform="rotate(${g.a},${gx},${gy})"/>`+label(lx,ly+3,g.l,{color:C.gate,size:7,bold:true});});
  s=titleBar(s,"Sector Zero","The Central Core · 60km diameter",C.s0s);
  s=backBtn(s);s=toggle3dBtn(s,'s0');
  s+='</svg>';return s;
}

// ═══════════════════════════════════════════
// SECTOR ONE — Flat, wide boulevards, garden estates
// ═══════════════════════════════════════════
function renderSectorOne(){
  const W=700,H=600;
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%"><rect width="${W}" height="${H}" fill="${C.waste}" rx="4"/>`;
  s+=`<rect x="40" y="60" width="620" height="480" rx="6" fill="${C.s1f}" stroke="${C.s1s}" stroke-width="0.8"/>`;
  // Wide boulevards — clean grid
  for(let y=130;y<520;y+=65)s+=`<line x1="60" y1="${y}" x2="640" y2="${y}" stroke="${C.s1s}" stroke-width="0.8" opacity="0.12"/>`;
  for(let x=140;x<640;x+=100)s+=`<line x1="${x}" y1="80" x2="${x}" y2="520" stroke="${C.s1s}" stroke-width="0.8" opacity="0.12"/>`;
  // Tree-lined avenues
  for(let y=130;y<520;y+=65){for(let x=70;x<640;x+=30)s+=tree(x,y-4,1.8);}
  for(let x=140;x<640;x+=100){for(let y=85;y<520;y+=25)s+=tree(x-4,y,1.5);}
  // Senju Estate — large compound with gardens
  s+=`<rect x="70" y="100" width="200" height="160" rx="4" fill="rgba(74,124,181,0.1)" stroke="${C.s1s}" stroke-width="0.6"/>`;
  s+=landmark(90,115,60,40)+landmark(160,115,50,35)+bldg(95,170,45,25)+bldg(155,175,40,20);
  for(let i=0;i<8;i++)s+=tree(85+i*22,210,3);
  for(let i=0;i<6;i++)s+=tree(250,110+i*25,2.5);
  s+=marker(150,135,"Senju Estate",C.s1s);s+=label(130,240,"Private dojos & gardens",{color:C.s1s,size:5.5});
  // Uzumaki Compound
  s+=`<rect x="420" y="110" width="180" height="130" rx="4" fill="rgba(74,124,181,0.1)" stroke="${C.s1s}" stroke-width="0.6"/>`;
  s+=landmark(435,125,55,35)+landmark(505,125,45,30)+bldg(440,175,50,25)+bldg(510,180,40,20);
  for(let i=0;i<5;i++)s+=tree(430+i*30,215,2.5);
  s+=marker(500,145,"Uzumaki Compound",C.s1s);s+=label(480,205,"Commander's base",{color:C.accent,size:5.5,bold:true});
  // Training grounds
  s+=`<rect x="290" y="300" width="150" height="110" rx="4" fill="rgba(196,149,106,0.08)" stroke="${C.accent}" stroke-width="0.5"/>`;
  s+=bldg(300,315,40,30)+bldg(350,310,50,35)+bldg(310,360,35,25)+bldg(360,355,40,30);
  s+=marker(365,330,"Elite Training",C.accent);
  // Commercial district — neat rows of shops
  s+=`<rect x="70" y="320" width="190" height="140" rx="4" fill="rgba(74,124,181,0.07)" stroke="${C.s1s}" stroke-width="0.4"/>`;
  for(let r=0;r<4;r++)for(let c=0;c<6;c++)s+=bldg(80+c*28,335+r*30,22,18,{fill:'rgba(74,124,181,0.1)',stroke:C.s1s,sw:0.3});
  s+=marker(165,345,"Commercial District",C.s1s);s+=label(165,445,"Fine dining · Artisan shops",{color:C.textM,size:5.5});
  // Minor estates scattered
  s+=bldg(490,300,35,25)+bldg(540,310,30,22)+bldg(500,345,28,20)+bldg(550,350,32,24);
  for(let i=0;i<4;i++)s+=tree(500+i*20,380,2);
  s+=label(530,340,"Minor clan estates",{color:C.textM,size:5.5});
  s+=label(560,420,"Garden walkways",{color:C.textM,size:5.5});
  for(let i=0;i<10;i++)s+=tree(480+i*18,410,2.5);
  // Gate
  s+=`<rect x="340" y="530" width="20" height="10" rx="2" fill="${C.gate}"/>`+label(350,555,"Sector Gate (East)",{color:C.gate,size:7});
  s=titleBar(s,"Sector I — Ivi","The Eastern Quarter · Flat terrain, wide boulevards",C.s1s);
  s=backBtn(s);s=toggle3dBtn(s,'s1');
  s+='</svg>';return s;
}

// ═══════════════════════════════════════════
// SECTOR TWO — Dense urban core, bazaar, clan estates
// ═══════════════════════════════════════════
function renderSectorTwo(){
  const W=700,H=660;
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%"><rect width="${W}" height="${H}" fill="${C.waste}" rx="4"/>`;
  s+=`<rect x="40" y="60" width="620" height="540" rx="6" fill="${C.s2f}" stroke="${C.s2s}" stroke-width="0.8"/>`;
  // Dense urban core circle
  s+=`<circle cx="350" cy="280" r="130" fill="rgba(181,148,74,0.1)" stroke="${C.s2s}" stroke-width="0.5" stroke-dasharray="4 3"/>`;
  s+=label(350,170,"Dense urban core",{color:C.s2s,size:7,opacity:0.5});
  // Dense building cluster in core
  s+=buildingCluster(250,200,200,150,0.7,{fill:'rgba(181,148,74,0.1)',stroke:C.s2s,sw:0.3});
  // Organic streets in core
  s+=organicStreets(240,190,220,180,25,C.s2s);
  // Command Hall (prominent)
  s+=landmark(325,255,50,40,{fill:'rgba(196,149,106,0.18)',stroke:C.accent,sw:0.8})+marker(350,275,"Twins' Command Hall",C.accent);
  // Bazaar stalls around command
  for(let i=0;i<8;i++)s+=stall(280+i*12,310);
  for(let i=0;i<6;i++)s+=stall(300+i*12,325);
  for(let i=0;i<7;i++)s+=stall(285+i*14,340);
  s+=marker(340,330,"Central Bazaar",C.s2s);
  // Barracks
  s+=bldg(410,220,45,20)+bldg(410,245,40,18)+marker(432,235,"Barracks",C.s2s);
  // Hyūga Estate (outer, left)
  s+=`<rect x="65" y="400" width="175" height="140" rx="4" fill="rgba(181,148,74,0.08)" stroke="${C.s2s}" stroke-width="0.5"/>`;
  s+=landmark(80,415,50,35)+landmark(140,420,45,30)+bldg(85,465,40,25)+bldg(140,460,50,30);
  s+=bldg(85,500,35,20)+bldg(135,500,40,22);
  for(let i=0;i<5;i++)s+=tree(200,410+i*25,2);
  s+=marker(145,435,"Hyūga Estate",C.s2s);s+=label(125,520,"Training dojos",{color:C.s2s,size:5.5});
  // Uchiha Estate (outer, right)
  s+=`<rect x="460" y="390" width="165" height="140" rx="4" fill="rgba(181,148,74,0.08)" stroke="${C.s2s}" stroke-width="0.5"/>`;
  s+=landmark(475,405,45,32)+landmark(530,410,40,28)+bldg(480,450,38,22)+bldg(535,448,42,25);
  s+=bldg(480,485,50,25)+bldg(540,485,35,22);
  for(let i=0;i<4;i++)s+=tree(455,400+i*30,2);
  s+=marker(530,425,"Uchiha Estate",C.s2s);s+=label(520,500,"Ancestral halls",{color:C.s2s,size:5.5});
  // Residential scatter (outskirts)
  s+=buildingCluster(80,150,150,100,0.3,{fill:'rgba(181,148,74,0.06)',stroke:C.s2s,sw:0.2});
  s+=buildingCluster(500,160,130,100,0.3,{fill:'rgba(181,148,74,0.06)',stroke:C.s2s,sw:0.2});
  s+=buildingCluster(250,450,160,80,0.25,{fill:'rgba(181,148,74,0.05)',stroke:C.s2s,sw:0.2});
  s+=label(150,200,"Residential",{color:C.textM,size:5.5})+label(550,210,"Residential",{color:C.textM,size:5.5});
  s+=label(350,555,"← quieter outskirts →",{color:C.textM,size:7,opacity:0.5});
  // Gate
  s+=`<rect x="340" y="590" width="20" height="10" rx="2" fill="${C.gate}"/>`+label(350,615,"Sector Gate (North)",{color:C.gate,size:7});
  s=titleBar(s,"Sector II — Firen","The Northern Quarter · Dense core, quiet outskirts",C.s2s);
  s=backBtn(s);s=toggle3dBtn(s,'s2');
  s+='</svg>';return s;
}

// ═══════════════════════════════════════════
// SECTOR THREE — Gorge, cliff, three layers, chaotic streets
// ═══════════════════════════════════════════
function renderSectorThree(){
  const W=750,H=720;
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%"><rect width="${W}" height="${H}" fill="${C.waste}" rx="4"/>`;
  s+=`<rect x="40" y="55" width="670" height="600" rx="6" fill="${C.s3f}" stroke="${C.s3s}" stroke-width="0.8"/>`;
  // ── GORGE ──
  s+=`<rect x="40" y="55" width="65" height="600" rx="3" fill="${C.gorge}" opacity="0.85"/>`;
  for(let y=65;y<645;y+=6){const xo=Math.sin(y*0.12)*6;s+=`<line x1="44" y1="${y}" x2="${100+xo}" y2="${y+2}" stroke="${C.gorgeS}" stroke-width="0.35" opacity="${0.12+Math.random()*0.15}"/>`;};
  s+=`<line x1="60" y1="60" x2="63" y2="650" stroke="${C.gorgeS}" stroke-width="0.4" opacity="0.12"/>`;
  s+=`<line x1="82" y1="65" x2="79" y2="645" stroke="${C.gorgeS}" stroke-width="0.3" opacity="0.1"/>`;
  if(layers.underground){[[72,180],[68,350],[78,510]].forEach(([x,y])=>s+=`<ellipse cx="${x}" cy="${y}" rx="7" ry="4" fill="${C.underground}" opacity="0.2" stroke="${C.underground}" stroke-width="0.5"/>`);}
  s+=label(43,380,"Ancient Gorge",{color:C.gorgeS,size:7,bold:true,serif:true,opacity:0.7})+`<text transform="rotate(-90,43,380)"/>`;
  // Rotated gorge text
  s+=`<text x="43" y="380" text-anchor="middle" font-size="7" fill="${C.gorgeS}" font-family="Cinzel,serif" font-weight="500" transform="rotate(-90,43,380)" opacity="0.7">Ancient Gorge</text>`;

  // ── CLIFFSIDE ROW ──
  s+=`<rect x="110" y="60" width="85" height="590" rx="3" fill="rgba(181,90,58,0.16)" stroke="${C.s3s}" stroke-width="0.5"/>`;
  s+=label(152,78,"Cliffside Row",{color:C.s3s,size:7.5,bold:true,serif:true,opacity:0.7});
  // Commander's Hall — largest cliffside building
  s+=landmark(115,100,75,45,{fill:'rgba(196,149,106,0.2)',stroke:C.accent,sw:0.8,rx:3})+marker(152,122,"Commander's Hall",C.accent);
  // Barracks — long narrow buildings
  s+=bldg(118,165,65,14,{fill:'rgba(181,90,58,0.12)',stroke:C.s3s})+bldg(120,184,60,14)+bldg(118,203,65,12);
  s+=label(152,175,"Barracks",{color:C.s3s,size:5.5});
  // Craftsmen workshops — smaller clustered buildings
  s+=bldg(120,240,28,16)+bldg(155,240,30,16)+bldg(120,262,25,14)+bldg(152,262,32,14)+bldg(122,282,55,18);
  s+=label(152,253,"Craftsmen",{color:C.s3s,size:5.5});
  // More cliffside structures down the strip
  s+=bldg(118,320,60,18)+bldg(122,345,50,15)+bldg(118,370,65,16)+bldg(120,395,55,18);
  s+=bldg(118,430,60,16)+bldg(122,455,48,14)+bldg(118,480,65,18)+bldg(120,510,55,16);
  s+=bldg(118,540,60,18)+bldg(122,565,50,15)+bldg(118,590,55,16)+bldg(120,615,60,14);

  // ── CLAN COMPOUNDS at cliff base ──
  s+=`<rect x="200" y="95" width="95" height="80" rx="3" fill="rgba(181,90,58,0.08)" stroke="${C.s3s}" stroke-width="0.4" stroke-dasharray="2 2"/>`;
  s+=bldg(208,105,35,25)+bldg(250,108,30,22)+bldg(210,140,28,20)+bldg(248,138,35,22);
  s+=label(248,90,"Clan compounds",{color:C.s3s,size:6,bold:true});

  // ── MID-WARRENS — chaotic organic streets and dense buildings ──
  s+=organicStreets(200,190,480,420,60,C.s3s);
  // Dense building clusters — varying density
  s+=buildingCluster(210,195,220,150,0.6,{fill:'rgba(181,90,58,0.08)',stroke:C.s3s,sw:0.25});
  s+=buildingCluster(440,195,210,140,0.5,{fill:'rgba(181,90,58,0.07)',stroke:C.s3s,sw:0.25});
  s+=buildingCluster(210,380,200,130,0.55,{fill:'rgba(181,90,58,0.07)',stroke:C.s3s,sw:0.25});
  s+=buildingCluster(430,360,210,140,0.45,{fill:'rgba(181,90,58,0.06)',stroke:C.s3s,sw:0.2});
  s+=buildingCluster(250,520,350,100,0.4,{fill:'rgba(181,90,58,0.06)',stroke:C.s3s,sw:0.2});

  s+=label(420,195,"Mid-Warrens",{color:C.s3s,size:8,serif:true,opacity:0.5});

  // Central Plaza — open space amid chaos
  s+=`<rect x="360" y="310" width="80" height="65" rx="3" fill="rgba(196,149,106,0.1)" stroke="${C.accent}" stroke-width="0.6"/>`;
  s+=marker(400,342,"Central Plaza",C.accent);

  // Street Markets
  for(let r=0;r<3;r++)for(let c=0;c<5;c++)s+=stall(260+c*14,250+r*12,10,6);
  s+=marker(310,265,"Street Markets",C.s3s);s+=label(310,290,"Food · Weapons · Goods",{color:C.textM,size:5});

  // Blacksmith alleys
  s+=bldg(220,405,22,16,{fill:'rgba(181,90,58,0.15)',stroke:C.s3s,sw:0.5})+bldg(248,405,20,16,{fill:'rgba(181,90,58,0.15)',stroke:C.s3s,sw:0.5})+bldg(222,428,25,14,{fill:'rgba(181,90,58,0.12)',stroke:C.s3s,sw:0.4})+bldg(252,428,22,14,{fill:'rgba(181,90,58,0.12)',stroke:C.s3s,sw:0.4});
  s+=marker(250,415,"Blacksmith Alleys",C.s3s);

  // Tea-houses & gambling dens
  s+=landmark(500,280,30,22,{fill:'rgba(181,90,58,0.12)',stroke:C.s3s,sw:0.5})+landmark(540,285,25,20,{fill:'rgba(181,90,58,0.1)',stroke:C.s3s,sw:0.4});
  s+=landmark(510,310,28,18,{fill:'rgba(181,90,58,0.1)',stroke:C.s3s,sw:0.4});
  s+=marker(525,295,"Tea-Houses",C.s3s)+label(535,330,"Gambling dens",{color:C.textM,size:5.5});

  // Deep Warrens access points
  if(layers.underground){
    [[260,470],[400,500],[340,560],[520,440],[230,340],[480,370],[310,450]].forEach(([x,y])=>{
      s+=`<circle cx="${x}" cy="${y}" r="4.5" fill="none" stroke="${C.underground}" stroke-width="0.8" stroke-dasharray="2 1.5" opacity="0.5"/><circle cx="${x}" cy="${y}" r="1.5" fill="${C.underground}" opacity="0.4"/>`;
    });
    s+=label(400,580,"◌ = Deep Warrens access points",{color:C.underground,size:6.5,opacity:0.6});
  }

  // Gate
  s+=`<rect x="390" y="645" width="20" height="10" rx="2" fill="${C.gate}"/>`+label(400,670,"Sector Gate (West)",{color:C.gate,size:7});
  s=titleBar(s,"Sector III — X","The Western Quarter · Built against the ancient gorge",C.s3s);
  s=backBtn(s);s=toggle3dBtn(s,'s3');
  s+='</svg>';return s;
}

// ═══════════════════════════════════════════
// RENDER DISPATCH
// ═══════════════════════════════════════════
function render(){
  if(show3d){render3D();return;}
  let svg;
  switch(currentView){
    case 's0':svg=renderSectorZero();break;
    case 's1':svg=renderSectorOne();break;
    case 's2':svg=renderSectorTwo();break;
    case 's3':svg=renderSectorThree();break;
    default:svg=renderOverview();
  }
  document.getElementById('map-container').innerHTML=svg;
  const c=document.getElementById('map-container');
  if(currentView==='overview')c.style.aspectRatio='1/1';
  else if(currentView==='s1')c.style.aspectRatio='700/600';
  else if(currentView==='s2')c.style.aspectRatio='700/660';
  else if(currentView==='s3')c.style.aspectRatio='750/720';
  else c.style.aspectRatio='1/1';
}

window.setLayer=function(n){if(n==='all')layers={underground:true,trade:true,security:true};else layers[n]=!layers[n];document.querySelectorAll('.map-btn').forEach(b=>b.classList.remove('active'));if(layers.underground&&layers.trade&&layers.security)document.getElementById('btn-all').classList.add('active');else['underground','trade','security'].forEach(l=>{if(layers[l])document.getElementById('btn-'+l)?.classList.add('active');});render();};
window.toggleDetails=function(){showDetails=!showDetails;const b=document.getElementById('btn-details');if(b)b.classList.toggle('active',showDetails);render();};
window.zoomSector=function(k){show3d=false;currentView=k==='overview'?'overview':k;render();const oc=document.getElementById('overview-controls');if(oc)oc.style.display=currentView==='overview'?'flex':'none';};
window.toggle3D=function(sec){show3d=!show3d;if(show3d)init3D(sec);else render();};

// ═══════════════════════════════════════════
// THREE.JS 3D VIEW
// ═══════════════════════════════════════════
let threeLoaded=false,scene,camera,renderer,controls,animId;
function loadThree(cb){
  if(threeLoaded){cb();return;}
  const s1=document.createElement('script');s1.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  s1.onload=()=>{
    const s2=document.createElement('script');
    s2.src='https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
    s2.onload=()=>{threeLoaded=true;cb();};
    document.head.appendChild(s2);
  };
  document.head.appendChild(s1);
}

function init3D(sec){
  loadThree(()=>{
    const container=document.getElementById('map-container');
    container.style.aspectRatio='4/3';
    container.innerHTML='<div id="three-canvas" style="width:100%;height:100%;position:relative;"></div>';
    const el=document.getElementById('three-canvas');
    const w=el.clientWidth,h=el.clientHeight||500;

    if(renderer){renderer.dispose();cancelAnimationFrame(animId);}
    scene=new THREE.Scene();
    scene.background=new THREE.Color(0x0c0b0a);
    scene.fog=new THREE.Fog(0x0c0b0a,200,500);
    camera=new THREE.PerspectiveCamera(50,w/h,0.1,1000);
    renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(w,h);renderer.setPixelRatio(window.devicePixelRatio);
    el.appendChild(renderer.domElement);
    controls=new THREE.OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;controls.dampingFactor=0.08;controls.maxPolarAngle=Math.PI/2.2;

    // Lighting
    scene.add(new THREE.AmbientLight(0xc4956a,0.4));
    const dl=new THREE.DirectionalLight(0xffe8cc,0.8);dl.position.set(50,80,30);scene.add(dl);
    const dl2=new THREE.DirectionalLight(0x6688aa,0.3);dl2.position.set(-30,40,-20);scene.add(dl2);

    // Ground
    const gnd=new THREE.Mesh(new THREE.PlaneGeometry(300,300),new THREE.MeshLambertMaterial({color:0x1a1714}));
    gnd.rotation.x=-Math.PI/2;gnd.position.y=-0.1;scene.add(gnd);

    // Build sector-specific 3D
    if(sec==='s0')build3D_S0();
    else if(sec==='s1')build3D_S1();
    else if(sec==='s2')build3D_S2();
    else if(sec==='s3')build3D_S3();

    camera.position.set(80,90,80);controls.target.set(0,5,0);controls.update();

    // Back button overlay
    const btn=document.createElement('div');
    btn.innerHTML='<button onclick="toggle3D()" style="font-family:Cinzel,serif;font-size:11px;padding:5px 14px;background:rgba(12,11,10,0.8);color:#c4956a;border:1px solid #4a4236;border-radius:4px;cursor:pointer;margin:4px">← 2D Map</button>';
    btn.style.cssText='position:absolute;top:8px;left:8px;z-index:10;';
    el.appendChild(btn);

    // Label
    const lbl=document.createElement('div');
    lbl.style.cssText='position:absolute;bottom:8px;left:50%;transform:translateX(-50%);font-family:Barlow,sans-serif;font-size:11px;color:#6b6158;';
    lbl.textContent='Drag to rotate · Scroll to zoom';
    el.appendChild(lbl);

    function animate(){animId=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);}
    animate();

    window.addEventListener('resize',()=>{const nw=el.clientWidth,nh=el.clientHeight||500;camera.aspect=nw/nh;camera.updateProjectionMatrix();renderer.setSize(nw,nh);});
  });
}

function box(w,h,d,color,x=0,y=0,z=0){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color}));
  m.position.set(x,y+h/2,z);scene.add(m);return m;
}
function cyl(r,h,color,x=0,y=0,z=0,seg=16){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),new THREE.MeshLambertMaterial({color}));
  m.position.set(x,y+h/2,z);scene.add(m);return m;
}

function build3D_S0(){
  // Ground rings
  const ringMat=c=>new THREE.MeshLambertMaterial({color:c,transparent:true,opacity:0.3});
  const r1=new THREE.Mesh(new THREE.RingGeometry(0,60,48),ringMat(0x4a7c59));r1.rotation.x=-Math.PI/2;r1.position.y=0.05;scene.add(r1);
  const r2=new THREE.Mesh(new THREE.RingGeometry(20,40,48),ringMat(0x3a6b48));r2.rotation.x=-Math.PI/2;r2.position.y=0.1;scene.add(r2);
  const r3=new THREE.Mesh(new THREE.RingGeometry(0,20,48),ringMat(0x2d5a3a));r3.rotation.x=-Math.PI/2;r3.position.y=0.15;scene.add(r3);
  // Kage hill
  cyl(5,4,0xc4956a,0,0,0);box(4,6,4,0xb5844a,0,4,0);
  // Government buildings
  box(6,5,4,0x4a7c59,-10,0,5);box(5,4,5,0x4a7c59,10,0,5);box(4,3,3,0x6b5aa5,-8,0,-8);box(5,3,4,0x6b5aa5,9,0,-9);
  // Residential ring buildings
  for(let a=0;a<360;a+=25){const rad=a*Math.PI/180;const x=Math.cos(rad)*30,z=Math.sin(rad)*30;box(3+Math.random()*2,2+Math.random()*3,3+Math.random()*2,0x3d6d45,x,0,z);}
  // Industrial ring
  for(let a=0;a<360;a+=15){const rad=a*Math.PI/180;const x=Math.cos(rad)*50,z=Math.sin(rad)*50;box(4+Math.random()*3,3+Math.random()*2,4+Math.random()*2,0x2d5d35,x,0,z);}
  // Toven factories (larger)
  box(8,5,6,0x72602d,-42,0,5);box(7,4,5,0x72602d,35,0,25);box(10,4,7,0x72602d,0,0,45);
  // Gates
  [0,120,240].forEach(a=>{const rad=a*Math.PI/180;box(3,4,6,0xa53030,Math.cos(rad)*60,0,Math.sin(rad)*60);});
  // Wall
  const wallGeo=new THREE.TorusGeometry(60,0.8,4,64);const wallMat=new THREE.MeshLambertMaterial({color:0x4a4236});const wall=new THREE.Mesh(wallGeo,wallMat);wall.rotation.x=Math.PI/2;wall.position.y=1;scene.add(wall);
}

function build3D_S1(){
  // Flat terrain with grid streets
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(120,100),new THREE.MeshLambertMaterial({color:0x182a3a,transparent:true,opacity:0.3}));gnd.rotation.x=-Math.PI/2;gnd.position.y=0.02;scene.add(gnd);
  // Street grid lines
  for(let x=-50;x<=50;x+=20){const g=new THREE.Mesh(new THREE.PlaneGeometry(0.3,100),new THREE.MeshLambertMaterial({color:0x2d4d72,transparent:true,opacity:0.3}));g.rotation.x=-Math.PI/2;g.position.set(x,0.03,0);scene.add(g);}
  for(let z=-40;z<=40;z+=18){const g=new THREE.Mesh(new THREE.PlaneGeometry(120,0.3),new THREE.MeshLambertMaterial({color:0x2d4d72,transparent:true,opacity:0.3}));g.rotation.x=-Math.PI/2;g.position.set(0,0.03,z);scene.add(g);}
  // Senju estate
  box(18,6,14,0x3d6d8a,-30,0,-20);box(8,4,6,0x2d5d7a,-22,0,-10);box(6,3,5,0x2d5d7a,-38,0,-12);
  // Trees around Senju
  for(let i=0;i<8;i++)cyl(1,3,0x3a6a4a,-40+i*3,0,-28,6);
  // Uzumaki compound
  box(14,5,12,0x3d6d8a,30,0,-18);box(7,4,5,0x2d5d7a,38,0,-8);
  // Training grounds
  box(10,3,8,0x8a6844,5,0,10);box(8,4,6,0x7a5834,12,0,18);
  // Commercial district — rows of shops
  for(let r=0;r<3;r++)for(let c=0;c<5;c++)box(3,2+Math.random(),2.5,0x2d5d7a,-35+c*6,0,15+r*5);
  // Minor estates
  box(6,3,5,0x2d5d7a,35,0,20);box(5,2.5,4,0x2d5d7a,42,0,28);
  // Trees scattered
  for(let i=0;i<20;i++){const x=-50+Math.random()*100,z=-40+Math.random()*80;cyl(0.8,2+Math.random()*2,0x3a6a4a,x,0,z,6);}
}

function build3D_S2(){
  // Ground
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(120,110),new THREE.MeshLambertMaterial({color:0x2a2418,transparent:true,opacity:0.3}));gnd.rotation.x=-Math.PI/2;gnd.position.y=0.02;scene.add(gnd);
  // Dense core buildings
  for(let i=0;i<40;i++){const x=-20+Math.random()*40,z=-20+Math.random()*40;const h=2+Math.random()*4;box(2+Math.random()*3,h,2+Math.random()*3,0x72602d,x,0,z);}
  // Command hall (prominent center)
  box(8,6,6,0xc4956a,0,0,0);
  // Bazaar stalls
  for(let i=0;i<15;i++){const a=Math.random()*Math.PI*2,r=12+Math.random()*5;box(1.5,1,1,0x8a7020,Math.cos(a)*r,0,Math.sin(a)*r);}
  // Barracks
  box(8,3,4,0x72602d,15,0,-12);box(7,3,3,0x72602d,15,0,-8);
  // Hyuga estate
  box(14,5,12,0x8a7020,-40,0,25);box(7,3,6,0x72602d,-35,0,35);box(6,3,5,0x72602d,-45,0,35);
  // Uchiha estate
  box(12,5,10,0x8a7020,40,0,22);box(6,3,5,0x72602d,45,0,32);box(5,3,4,0x72602d,35,0,30);
  // Outskirts residential
  for(let i=0;i<20;i++){const x=-50+Math.random()*100,z=Math.random()>0.5?35+Math.random()*15:-30-Math.random()*15;box(2+Math.random()*2,1.5+Math.random()*2,2+Math.random()*2,0x5a4e2d,x,0,z);}
}

function build3D_S3(){
  // Gorge wall — tall cliff on one side
  box(8,40,100,0x3d2418,-55,0,0);
  // Cliff texture — ledges
  for(let z=-45;z<45;z+=8){box(2,0.5,5,0x5a3a20,-50,10+Math.random()*15,z);}
  // Cliffside Row — buildings along the cliff at elevation
  box(10,5,6,0xc4956a,-42,12,- 30);// Commander's Hall
  for(let z=-20;z<40;z+=8){box(5+Math.random()*3,3+Math.random()*2,4,0x723828,-42,10+Math.random()*3,z);}
  // Mid-Warrens — dense chaotic ground-level buildings
  for(let i=0;i<60;i++){const x=-25+Math.random()*70,z=-40+Math.random()*80;const h=1.5+Math.random()*3;box(2+Math.random()*3,h,2+Math.random()*3,0x4a2818,x,0,z);}
  // Central Plaza — open area
  const plaza=new THREE.Mesh(new THREE.PlaneGeometry(12,10),new THREE.MeshLambertMaterial({color:0xc4956a,transparent:true,opacity:0.15}));plaza.rotation.x=-Math.PI/2;plaza.position.set(10,0.05,5);scene.add(plaza);
  // Market stalls
  for(let i=0;i<10;i++)box(1.5,1,1,0x8a5a3a,-10+Math.random()*15,0,-20+Math.random()*10);
  // Tea houses (slightly larger)
  box(5,3,4,0x5a3020,30,0,-15);box(4,2.5,3.5,0x5a3020,35,0,-10);
  // Deep Warrens — holes in the ground
  if(layers.underground){
    [[5,0,-25],[15,0,20],[-5,0,30],[25,0,-10],[0,0,0]].forEach(([x,y,z])=>{
      const hole=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,0.3,8),new THREE.MeshLambertMaterial({color:0x8a7cc8,transparent:true,opacity:0.5}));
      hole.position.set(x,0.1,z);scene.add(hole);
    });
  }
  // Clan compounds at cliff base
  box(6,3,5,0x5a3828,-35,0,-35);box(5,2.5,4,0x5a3828,-30,0,-30);

  camera.position.set(60,50,60);controls.target.set(-10,8,0);
}

function render3D(){
  const container=document.getElementById('map-container');
  container.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:400px;color:'+C.textM+'">Loading 3D view...</div>';
  init3D(currentView);
}

render();
