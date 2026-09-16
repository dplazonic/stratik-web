import * as THREE from './assets/three.module.min.js';

const NX = 64, NZ = 48, WIDTH = 5.6, DEPTH = 4.4;
const formationDuration = 6, drillStart = 7.2, drillEnd = 14.2, duration = drillEnd;
const boreX = .55, boreZ = DEPTH / 2 - .035, boreRadius = .16, boreBottom = -1.32;
const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
const fold = (x, z) => Math.sin(x * .85 + z * .35) * .14 + Math.cos(z * 1.05 - x * .3) * .09;
const surface = (x, z) => 1.18 + .65 * Math.exp(-((x + .6) ** 2 / 3 + (z + .5) ** 2 / 2)) + fold(x, z);
const boundaries = [() => -1.5, (x, z) => -.6 + fold(x, z) * .7,
  (x, z) => .3 + fold(x, z), (x, z) => surface(x, z) - .17, surface];
const palettes = {
  dark: { layers: [0x8c7951, 0x647668, 0xa5ab8a, 0x365d46], line: 0xd7c596, contour: 0xb6cbb3 },
  light: { layers: [0x9e8d66, 0x778a7a, 0xb4b998, 0x476b4d], line: 0x655934, contour: 0xd5e0bb }
};

function layerGeometry(lower, upper) {
  const vertices = [];
  const triangle = (a, b, c) => vertices.push(...a, ...b, ...c);
  const point = (x, z, f) => [x, f(x, z), z];
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
    const x = (i / NX - .5) * WIDTH, z = (j / NZ - .5) * DEPTH;
    const xx = x + WIDTH / NX, zz = z + DEPTH / NZ;
    for (const f of [upper, lower]) {
      const a = point(x, z, f), b = point(xx, z, f), c = point(xx, zz, f), d = point(x, zz, f);
      if (f === upper) { triangle(a, c, b); triangle(a, d, c); }
      else { triangle(a, b, c); triangle(a, c, d); }
    }
  }
  const corners = [[-WIDTH/2, -DEPTH/2], [WIDTH/2, -DEPTH/2], [WIDTH/2, DEPTH/2], [-WIDTH/2, DEPTH/2]];
  for (let edge = 0; edge < 4; edge++) for (let i = 0; i < NX; i++) {
    const a = corners[edge], b = corners[(edge + 1) % 4];
    const at = t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const [x, z] = at(i / NX), [xx, zz] = at((i + 1) / NX);
    const p = point(x,z,lower), q = point(xx,zz,lower), r = point(xx,zz,upper), s = point(x,z,upper);
    triangle(p,r,q); triangle(p,s,r);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function perimeter(f) {
  const points = [];
  for (let edge = 0; edge < 4; edge++) for (let i = 0; i <= NX; i++) {
    const t = i / NX;
    const x = edge === 0 ? -WIDTH/2 + t*WIDTH : edge === 1 ? WIDTH/2 : edge === 2 ? WIDTH/2 - t*WIDTH : -WIDTH/2;
    const z = edge === 0 ? -DEPTH/2 : edge === 1 ? -DEPTH/2 + t*DEPTH : edge === 2 ? DEPTH/2 : DEPTH/2 - t*DEPTH;
    points.push(new THREE.Vector3(x, f(x,z), z));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

// Intersect the sampled surface triangles with horizontal planes for true contour lines.
function contours() {
  const positions = [];
  for (let level = .9; level < 2.15; level += .065) {
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
      const p = (ii, jj) => { const x = (ii/NX-.5)*WIDTH, z=(jj/NZ-.5)*DEPTH; return [x,surface(x,z),z]; };
      const a=p(i,j), b=p(i+1,j), c=p(i+1,j+1), d=p(i,j+1);
      for (const tri of [[a,b,c],[a,c,d]]) {
        const hits=[];
        for(let e=0;e<3;e++) {
          const u=tri[e],v=tri[(e+1)%3];
          if((u[1]<level)===(v[1]<level)) continue;
          const t=(level-u[1])/(v[1]-u[1]);
          hits.push([u[0]+t*(v[0]-u[0]),level+.008,u[2]+t*(v[2]-u[2])]);
        }
        if(hits.length===2) positions.push(...hits[0],...hits[1]);
      }
    }
  }
  return new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
}

// Open the bore at the exposed face so its depth is visible without X-ray rendering.
function boreCut(material, depth) {
  material.onBeforeCompile = shader => {
    shader.uniforms.boreDepth = depth;
    shader.vertexShader = 'varying vec3 borePosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nborePosition = position;');
    shader.fragmentShader = 'varying vec3 borePosition;\nuniform float boreDepth;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <clipping_planes_fragment>', `
      #include <clipping_planes_fragment>
      if (borePosition.y > boreDepth && distance(borePosition.xz, vec2(${boreX}, ${boreZ})) < ${boreRadius}) discard;
    `);
  };
  material.customProgramCacheKey = () => 'stratik-bore-section-v1';
}

function createBore(model) {
  const top = surface(boreX, boreZ);
  const dark = new THREE.MeshStandardMaterial({color:0x29332d,roughness:.75});
  const lining=new THREE.Mesh(new THREE.CylinderGeometry(boreRadius*.998,boreRadius*.998,1,48,1,true),new THREE.MeshStandardMaterial({color:0x25302a,roughness:1,side:THREE.BackSide}));
  model.add(lining);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(boreRadius,32),dark);
  floor.rotation.x=-Math.PI/2;model.add(floor);
  return {
    update(time) {
      const progress=smooth((time-drillStart)/(drillEnd-drillStart));
      const bottom=THREE.MathUtils.lerp(top,boreBottom,progress);
      lining.visible=floor.visible=progress>0;
      lining.position.set(boreX,(top+bottom)/2,boreZ);lining.scale.y=Math.max(.001,top-bottom);
      floor.position.set(boreX,bottom,boreZ);
      return progress>0?bottom:100;
    }
  };
}

export function createGeologyBlock(mount) {
  const figure = mount.closest('figure');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 701px)');
  const controls = figure.querySelector('.geology-controls');
  const pause = controls.querySelector('[data-geology-pause]');
  const replay = controls.querySelector('[data-geology-replay]');
  const scene = new THREE.Scene();
  const model = new THREE.Group();
  scene.add(model);
  const camera = new THREE.OrthographicCamera(-5,5,5,-5,.1,100);
  camera.position.set(8,6.5,9);
  camera.lookAt(0,.15,0);
  scene.add(new THREE.HemisphereLight(0xf7f4e5,0x455047,2));
  const key = new THREE.DirectionalLight(0xffffff,2.2);
  key.position.set(-3,8,5); scene.add(key);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({alpha:true,antialias:true}); }
  catch {
    // A static four-layer projection remains available on devices without WebGL.
    const canvas=document.createElement('canvas'); canvas.width=900; canvas.height=760; mount.append(canvas);
    const ctx=canvas.getContext('2d');
    const draw=()=>{
      const colors=palettes[document.documentElement.dataset.theme] || palettes.dark;
      ctx.clearRect(0,0,900,760);
      const project=(x,y,z)=>[450+x*79-z*54,360+(x+z)*29-y*85];
      const polygon=points=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...project(...p)):ctx.moveTo(...project(...p)));ctx.closePath();ctx.fill();};
      for(let layer=0;layer<4;layer++) {
        ctx.fillStyle='#'+colors.layers[layer].toString(16).padStart(6,'0');
        for(const face of [0,1]) {
          const points=[];
          for(const upper of [false,true])for(let i=0;i<=NX;i++){
            const t=(upper?NX-i:i)/NX;
            const x=face?WIDTH/2:(t-.5)*WIDTH,z=face?(t-.5)*DEPTH:DEPTH/2;
            points.push([x,boundaries[layer+Number(upper)](x,z),z]);
          }
          polygon(points);ctx.strokeStyle='#'+colors.line.toString(16).padStart(6,'0');ctx.stroke();
        }
      }
      const p=(i,j)=>{const x=(i/NX-.5)*WIDTH,z=(j/NZ-.5)*DEPTH;return[x,surface(x,z),z];};
      for(let i=0;i<NX;i++)for(let j=0;j<NZ;j++)polygon([p(i,j),p(i+1,j),p(i+1,j+1),p(i,j+1)]);
      const top=surface(boreX,boreZ), front=DEPTH/2;
      ctx.fillStyle='#25302a';
      polygon([[boreX-boreRadius,top,front],[boreX+boreRadius,top,front],[boreX+boreRadius,boreBottom,front],[boreX-boreRadius,boreBottom,front]]);
    };
    draw();document.addEventListener('stratik:theme',draw);
    mount.dataset.state='complete';mount.dataset.renderer='static';mount.dataset.layerCount='4';
    mount.dataset.boreDepth=String(surface(boreX,boreZ)-boreBottom);return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  mount.append(renderer.domElement);
  const edgeMaterial = new THREE.LineBasicMaterial({transparent:true,opacity:.7});
  const contourMaterial = new THREE.LineBasicMaterial({transparent:true,opacity:.42});
  const boreDepth={value:100};
  boreCut(edgeMaterial,boreDepth);boreCut(contourMaterial,boreDepth);
  const layers=[];
  for(let index=0;index<4;index++) {
    const group=new THREE.Group();
    const material=new THREE.MeshStandardMaterial({roughness:.93,metalness:0,side:THREE.DoubleSide});
    boreCut(material,boreDepth);
    group.add(new THREE.Mesh(layerGeometry(boundaries[index],boundaries[index+1]),material));
    group.add(new THREE.Line(perimeter(boundaries[index+1]),edgeMaterial));
    if(index===0) group.add(new THREE.Line(perimeter(boundaries[0]),edgeMaterial));
    const corners=[];
    for(const x of [-WIDTH/2,WIDTH/2])for(const z of [-DEPTH/2,DEPTH/2])corners.push(x,boundaries[index](x,z),z,x,boundaries[index+1](x,z),z);
    group.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(corners,3)),edgeMaterial));
    model.add(group);layers.push({group,material,anchor:boundaries[index](0,0)});
  }
  const contourLines=new THREE.LineSegments(contours(),contourMaterial);
  layers[3].group.add(contourLines);
  const bore=createBore(model);
  let elapsed=reduced.matches?duration:0, paused=false, visible=false, frame=0,last=0,request=0,lost=false;
  mount.dataset.layerCount='4';mount.dataset.renderer='three';
  function icon(name){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    for(const [key,value]of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.5','aria-hidden':'true'}))svg.setAttribute(key,value);
    for(const [tag,attrs]of window.STRATIK_ICONS[name]){const child=document.createElementNS(svg.namespaceURI,tag);for(const [key,value]of Object.entries(attrs))child.setAttribute(key,value);svg.append(child);}pause.replaceChildren(svg);
  }
  function syncControls(){
    controls.hidden=reduced.matches;
    const label=paused?'Nastavi animaciju':'Pauziraj animaciju';
    pause.setAttribute('aria-label',label);pause.title=label;icon(paused?'Play':'Pause');
  }
  function render(){
    layers.forEach(({group,anchor},index)=>{
      const progress=smooth((elapsed-index*1.3)/1.45);
      group.visible=progress>0;group.scale.y=Math.max(.001,progress);group.position.y=anchor*(1-progress);
    });
    contourMaterial.opacity=.42*smooth((elapsed-5)/.8);
    boreDepth.value=bore.update(elapsed);
    model.rotation.y=reduced.matches?0:Math.sin(Math.max(0,elapsed-duration)*.16)*.32;
    renderer.render(scene,camera);
    mount.dataset.state=elapsed>=duration?'complete':'forming';
    mount.dataset.phase=elapsed<formationDuration?'forming':elapsed<drillStart?'ready':elapsed<drillEnd?'drilling':'rotating';
    mount.dataset.boreDepth=String(Math.max(0,surface(boreX,boreZ)-boreDepth.value));
    mount.dataset.frame=String(++frame);
    mount.dataset.motion=paused||reduced.matches?'paused':'playing';
  }
  function tick(now){
    request=0;
    if(!last)last=now;
    if(now-last>=1000/30){elapsed+=Math.min((now-last)/1000,.08);last=now;render();}
    request=requestAnimationFrame(tick);
  }
  function schedule(){
    cancelAnimationFrame(request);request=0;last=0;
    if(visible&&desktop.matches&&!document.hidden&&!paused&&!reduced.matches&&!lost)request=requestAnimationFrame(tick);
  }
  function resize(){
    const {width,height}=mount.getBoundingClientRect();if(!width||!height)return;
    renderer.setSize(width,height,false);
    const aspect=width/height,half=Math.max(3.65,4.25/aspect);
    camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();render();
  }
  function theme(){
    const palette=palettes[document.documentElement.dataset.theme]||palettes.dark;
    layers.forEach(({material},i)=>material.color.setHex(palette.layers[i]));
    edgeMaterial.color.setHex(palette.line);contourMaterial.color.setHex(palette.contour);render();
  }
  pause.addEventListener('click',()=>{paused=!paused;syncControls();render();schedule();});
  replay.addEventListener('click',()=>{elapsed=0;paused=false;syncControls();render();schedule();});
  new ResizeObserver(resize).observe(mount);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();}).observe(figure);
  document.addEventListener('visibilitychange',schedule);
  document.addEventListener('stratik:theme',theme);
  desktop.addEventListener('change',()=>{resize();schedule();});
  reduced.addEventListener('change',()=>{if(reduced.matches)elapsed=duration;syncControls();render();schedule();});
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;schedule();});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;theme();resize();schedule();});
  syncControls();theme();resize();
}
