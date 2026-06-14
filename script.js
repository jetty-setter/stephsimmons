
  /* ── Entry loading screen ────────────────────────────────── */
  (function () {
    const pre = document.getElementById('preloader');
    if (!pre) { document.body.classList.remove('loading'); return; }
    const num = document.getElementById('plNum');
    const bar = document.getElementById('plBar');
    const stat = document.getElementById('plStatus');

    const STEPS = [
      [0,  'Provisioning infrastructure'],
      [35, 'Establishing secure channel'],
      [65, 'Compiling systems'],
      [90, 'Deploying interface'],
      [100,'Systems online'],
    ];

    let fontsReady = false;
    const fr = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    fr.then(() => { fontsReady = true; });

    let p = 0;
    const tick = setInterval(() => {
      const cap = fontsReady ? 100 : 90;
      p += (cap - p) * 0.09 + 0.8;
      if (p > cap) p = cap;

      num.textContent = Math.floor(p);
      bar.style.width = p + '%';
      for (let i = STEPS.length - 1; i >= 0; i--) {
        if (p >= STEPS[i][0]) { if (stat.textContent !== STEPS[i][1]) stat.textContent = STEPS[i][1]; break; }
      }

      if (p >= 99.5 && fontsReady) {
        p = 100; num.textContent = 100; bar.style.width = '100%';
        clearInterval(tick); done();
      }
    }, 55);

    function done() {
      setTimeout(() => {
        pre.classList.add('done');
        document.body.classList.remove('loading');
        window.dispatchEvent(new Event('site:ready'));
        setTimeout(() => pre.remove(), 1000);
      }, 420);
    }
  })();

  /* ── Hero intro ──────────── */
  (function () {
    const showAll = () => {
      ['.hero-eyebrow', '.hero-desc', '.hero-stats', '.hero-status', '.dot', '.hero-name'].forEach(s => {
        const el = document.querySelector(s); if (el) { el.style.opacity = 1; el.style.visibility = 'visible'; }
      });
      const r = document.querySelector('.hero-rule'); if (r) r.style.transform = 'scaleX(1)';
    };
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!window.gsap || reduce) { showAll(); return; }

    function play() {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('.hero-eyebrow', { autoAlpha: 0, y: 24, duration: .8 }, 0)
        .from('.hero-word', { yPercent: 120, duration: 1.1, stagger: .12 }, .1)
        .from('.dot', { autoAlpha: 0, scale: 0, transformOrigin: 'center', duration: .5, ease: 'back.out(2)' }, 1.0)
        .from('.hero-rule', { scaleX: 0, transformOrigin: 'left', duration: 1, ease: 'power3.inOut' }, .8)
        .from('.hero-desc', { autoAlpha: 0, y: 34, duration: .9 }, .95)
        .from('.hero-stats', { autoAlpha: 0, y: 34, duration: .9 }, 1.05)
        .from('.hero-status', { autoAlpha: 0, y: 34, duration: .9 }, 1.15);
    }

    function forceShow() {
      gsap.set('.hero-word', { yPercent: 0, clearProps: 'transform' });
      gsap.set(['.hero-eyebrow', '.hero-desc', '.hero-stats', '.hero-status'], { autoAlpha: 1, y: 0 });
      gsap.set('.dot', { autoAlpha: 1, scale: 1 });
      gsap.set('.hero-rule', { scaleX: 1 });
    }
    let played = false;
    const go = () => { if (!played) { played = true; play(); setTimeout(forceShow, 4200); } };
    window.addEventListener('site:ready', go, { once: true });
    setTimeout(go, 3500); // safety
  })();

  /* ── Flowing nebula (Three.js) ────────────────── */
  (function () {
    const canvas = document.getElementById('neb');
    if (!canvas || !window.THREE) return;
    const THREE = window.THREE;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 4;

    const BX = 2.7, BY = 2.1, BZ = 1.5;
    function cw(s){ return ((Math.random()+Math.random()+Math.random()+Math.random())/4*2-1)*s; }

    const starTex = (function(){
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(32,32,0, 32,32,32);
      g.addColorStop(0,    'rgba(255,255,255,1)');
      g.addColorStop(0.25, 'rgba(255,255,255,0.85)');
      g.addColorStop(0.5,  'rgba(255,255,255,0.35)');
      g.addColorStop(1,    'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0,0,64,64);
      const tex = new THREE.CanvasTexture(c); tex.needsUpdate = true; return tex;
    })();

    function layer(count, color, size, opacity, blending) {
      const pos = new Float32Array(count*3), spd = new Float32Array(count);
      for (let i=0;i<count;i++){ pos[i*3]=cw(BX); pos[i*3+1]=cw(BY); pos[i*3+2]=cw(BZ); spd[i]=0.6+Math.random()*1.0; }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos,3));
      const m = new THREE.PointsMaterial({ color, size: size*1.7, sizeAttenuation:true, transparent:true, opacity, depthWrite:false, map: starTex, blending: blending||THREE.NormalBlending });
      const p = new THREE.Points(g,m); scene.add(p);
      return { pts:p, geo:g, mat:m, spd, count, baseOp:opacity, tw:Math.random()*6.28 };
    }
    const layers = [
      layer(1800, 0xeae8e3, 0.015, 0.9),
      layer(520,  0x9a9a9a, 0.021, 0.6),
      layer(340,  0xff5a3c, 0.030, 0.95, THREE.AdditiveBlending),
      layer(300,  0xa44dff, 0.028, 0.9,  THREE.AdditiveBlending),
      layer(40,   0xff5a3c, 0.085, 0.9,  THREE.AdditiveBlending),
      layer(20,   0xb14cff, 0.072, 0.85, THREE.AdditiveBlending),
    ];

    function flow(x,y,z,t,o){ const s=0.85;
      o[0]=Math.sin(y*s+t)+Math.cos(z*s*1.3-t*0.7);
      o[1]=Math.sin(z*s*1.1+t*0.8)+Math.cos(x*s*0.9+t);
      o[2]=(Math.sin(x*s*1.2-t)+Math.cos(y*s*1.05+t*0.6))*0.5;
    }
    function resize(){ const w=canvas.clientWidth||canvas.offsetWidth,h=canvas.clientHeight||canvas.offsetHeight; if(!w||!h)return; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
    resize(); window.addEventListener('resize', resize, {passive:true});

    let hasMouse=false, mwx=0, mwy=0;
    window.addEventListener('pointermove', e=>{ const r=canvas.getBoundingClientRect();
      if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){hasMouse=false;return;}
      hasMouse=true; mwx=((e.clientX-r.left)/r.width*2-1)*BX; mwy=-((e.clientY-r.top)/r.height*2-1)*BY;
    }, {passive:true});

    let scrollV=0, lastY=window.scrollY;
    let revealed = false;
    window.addEventListener('scroll', ()=>{
      scrollV=window.scrollY-lastY; lastY=window.scrollY;
      if (revealed) {
        const f = Math.min(1, window.scrollY / (window.innerHeight * 0.9));
        canvas.style.opacity = (0.95 - f * 0.62).toFixed(3); // dense in hero → faint below
      }
    }, {passive:true});

    const grp = new THREE.Group(); layers.forEach(L=>grp.add(L.pts)); scene.add(grp);
    const v=[0,0,0]; let t=0;
    function loop(){
      t+=0.004; scrollV*=0.9;
      const speed=0.006+Math.abs(scrollV)*0.0008;
      for(const L of layers){
        const a=L.geo.attributes.position.array;
        for(let i=0;i<L.count;i++){ const ix=i*3; let x=a[ix],y=a[ix+1],z=a[ix+2];
          flow(x,y,z,t,v); const sp=speed*L.spd[i]; x+=v[0]*sp; y+=v[1]*sp; z+=v[2]*sp;
          if(hasMouse){ const dx=x-mwx,dy=y-mwy,d2=dx*dx+dy*dy; if(d2<0.8){ const f=(0.8-d2)*0.06; x+=dx*f; y+=dy*f; } }
          if(x>BX)x-=BX*2; else if(x<-BX)x+=BX*2;
          if(y>BY)y-=BY*2; else if(y<-BY)y+=BY*2;
          if(z>BZ)z-=BZ*2; else if(z<-BZ)z+=BZ*2;
          a[ix]=x; a[ix+1]=y; a[ix+2]=z;
        }
        L.geo.attributes.position.needsUpdate=true;
        L.mat.opacity = L.baseOp * (0.78 + 0.22*Math.sin(t*1.6 + L.tw));
      }
      grp.rotation.z = lastY*0.0002 + t*0.05;
      grp.rotation.x = Math.sin(t*0.3)*0.04;
      grp.position.y = Math.sin(t*0.4)*0.05;
      renderer.render(scene,camera);
      requestAnimationFrame(loop);
    }
    loop();

    function reveal(){ resize();
      if(window.gsap){ gsap.set(canvas,{opacity:0.95});
        layers.forEach((L,i)=>gsap.fromTo(L.pts.scale,{x:.35,y:.35,z:.35},{x:1,y:1,z:1,duration:2.0+i*0.15,ease:'expo.out'}));
      } else { canvas.style.transition='opacity 1.2s'; canvas.style.opacity=0.95; }
      setTimeout(()=>{ revealed = true; }, 1200);
    }
    window.addEventListener('site:ready', reveal, {once:true});
    setTimeout(()=>{ if(parseFloat(getComputedStyle(canvas).opacity)<0.1) reveal(); }, 3500);
  })();

  /* ── Scroll-driven motion: progress rail ───────────────── */
  (function () {
    const orb  = null;
    const fill = document.getElementById('railFill');
    const dot  = document.getElementById('railDot');
    const pct  = document.getElementById('railPct');
    let ticking = false;
    function update() {
      const sy = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, sy / max) : 0;
      if (orb)  orb.style.transform = 'rotate(' + (sy * 0.12) + 'deg)';
      if (fill) fill.style.height = (p * 100) + '%';
      if (dot)  dot.style.top = (p * 100) + '%';
      if (pct)  { pct.style.top = (p * 100) + '%'; pct.textContent = String(Math.round(p * 100)).padStart(2, '0') + '%'; }
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  /* ── Page-wide scroll motion (GSAP ScrollTrigger) ──────── */
  (function () {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!window.gsap || !window.ScrollTrigger || reduce) {
      document.querySelectorAll('.up').forEach(el => { el.style.opacity = 1; });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const EO = 'expo.out';

    gsap.utils.toArray('.section-header').forEach(h => {
      const title = h.querySelector('.sh-title'),
            num   = h.querySelector('.sh-num'),
            count = h.querySelector('.sh-count');
      const tl = gsap.timeline({ scrollTrigger: { trigger: h, start: 'top 88%' } });
      if (title) tl.from(title, { y: 48, autoAlpha: 0, duration: .9, ease: EO }, 0);
      if (num)   tl.from(num,   { x: -14, autoAlpha: 0, duration: .6 }, .12);
      if (count) tl.from(count, { autoAlpha: 0, duration: .6 }, .2);
    });

    /* generic staggered reveals per section */
    function reveal(sel, items, opts) {
      const section = document.querySelector(sel);
      if (!section) return;
      const els = section.querySelectorAll(items);
      if (!els.length) return;
      gsap.from(els, Object.assign({
        y: 40, autoAlpha: 0, duration: .8, ease: EO, stagger: .08,
        scrollTrigger: { trigger: section, start: 'top 78%' }
      }, opts || {}));
    }
    reveal('#about', '.about-statement, .about-body p, .cert-row, .cap');

    const portrait = document.getElementById('portrait');
    if (portrait) ScrollTrigger.create({
      trigger: portrait, start: 'top 78%',
      onEnter: () => portrait.classList.add('lit'),
    });
    reveal('#skills', '.skill-col', { y: 30, stagger: .06 });
    reveal('#experience', '.exp-row', { x: -30, y: 0, stagger: .12 });
    reveal('#contact', '.contact-headline, .contact-body, .c-link', { stagger: .1 });

    gsap.utils.toArray('.sh-num').forEach(n => {
      gsap.to(n, { y: -40, ease: 'none',
        scrollTrigger: { trigger: n.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    function countUp(el) {
      const raw = el.textContent.trim();
      const m = raw.match(/^(\d+)(\D*)$/);
      if (!m) return;
      const target = +m[1], suffix = m[2];
      const o = { v: 0 };
      gsap.to(o, {
        v: target, duration: 1.4, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%' },
        onUpdate: () => { el.textContent = Math.round(o.v) + suffix; }
      });
    }
    document.querySelectorAll('.hstat-n, .num-val').forEach(countUp);

    (function () {
      const projects = document.querySelectorAll('.project');
      projects.forEach((p, i) => {
        const idx = p.querySelector('.project-index');
        if (idx) idx.textContent = String(i + 1).padStart(2, '0');
      });
      const next = document.getElementById('projectNextIndex');
      if (next) next.textContent = String(projects.length + 1).padStart(2, '0');
    })();

    /* Project showcase — reveal, parallax pan, cursor tilt + glare, detail callouts */
    gsap.utils.toArray('.project').forEach(p => {
      const mediaWrap = p.querySelector('.project-media');
      const browser = p.querySelector('.browser');
      const glare = p.querySelector('.browser-glare');
      const img = p.querySelector('.browser-shot img');
      const info = p.querySelectorAll('.project-index, .project-title, .project-kicker, .project-desc, .project-tags, .project-links');

      // 3D door-swing entrance 
      const fromRight = p.classList.contains('reverse');
      const dir = fromRight ? 1 : -1;
      gsap.set(browser, { transformOrigin: fromRight ? 'right center' : 'left center' });
      gsap.from(browser, {
        xPercent: dir * 14, rotationY: dir * -58, rotationX: 6, z: -240,
        autoAlpha: 0, duration: 1.25, ease: 'power4.out',
        scrollTrigger: { trigger: p, start: 'top 78%' }
      });
      gsap.from(info, {
        x: dir * -40, autoAlpha: 0, duration: .9, ease: 'expo.out', stagger: .08,
        scrollTrigger: { trigger: p, start: 'top 72%' }
      });

      // longer parallax pan 
      if (img) gsap.fromTo(img, { yPercent: 0 }, {
        yPercent: -15, ease: 'none',
        scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true }
      });

      // cursor-driven 3D tilt + glare follow
      if (browser && !window.matchMedia('(hover: none)').matches) {
        const setX = gsap.quickTo(browser, 'rotationY', { duration: .5, ease: 'power3' });
        const setY = gsap.quickTo(browser, 'rotationX', { duration: .5, ease: 'power3' });
        mediaWrap.addEventListener('pointermove', e => {
          const r = browser.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          setX((px - .5) * 11);
          setY((.5 - py) * 8);
          if (glare) { glare.style.setProperty('--gx', (px*100).toFixed(1)+'%');
                       glare.style.setProperty('--gy', (py*100).toFixed(1)+'%'); }
        });
        mediaWrap.addEventListener('pointerleave', () => { setX(0); setY(0); });
      }
    });

    window.addEventListener('site:ready', () => setTimeout(() => ScrollTrigger.refresh(), 80));
    window.addEventListener('load', () => ScrollTrigger.refresh());
  })();

  /* Active nav */
  const secs = document.querySelectorAll('section[id]');
  const navAs = document.querySelectorAll('.nav-links a:not(.pill)');
  window.addEventListener('scroll', () => {
    let cur = '';
    secs.forEach(s => { if (window.scrollY >= s.offsetTop - 130) cur = s.id; });
    navAs.forEach(a => { a.classList.toggle('active', a.getAttribute('href') === '#' + cur); });
  }, { passive: true });

  /* Mobile nav */
  function openMnav()  { document.getElementById('mnav').classList.add('open'); }
  function closeMnav() { document.getElementById('mnav').classList.remove('open'); }
