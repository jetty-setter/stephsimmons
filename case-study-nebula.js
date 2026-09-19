(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.getElementById('field');
  if (!canvas || !window.THREE) return;

  var THREE = window.THREE;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 4;

  var BX = 2.7, BY = 2.1, BZ = 1.5;
  function cw(s){ return ((Math.random()+Math.random()+Math.random()+Math.random())/4*2-1)*s; }

  var starTex = (function(){
    var c = document.createElement('canvas');
    c.width = c.height = 128;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(64,64,0,64,64,64);
    g.addColorStop(0,'rgba(255,255,255,1)');
    g.addColorStop(0.88,'rgba(255,255,255,1)');
    g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,128,128);
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
  })();

  function layer(count,color,size,opacity){
    var pos = new Float32Array(count*3);
    var spd = new Float32Array(count);
    for (var i=0;i<count;i++){
      pos[i*3]=cw(BX);
      pos[i*3+1]=cw(BY);
      pos[i*3+2]=cw(BZ);
      spd[i]=0.6+Math.random()*1.0;
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pos,3));
    var material = new THREE.PointsMaterial({
      color:color,
      size:size,
      sizeAttenuation:true,
      transparent:true,
      opacity:opacity,
      depthWrite:false,
      map:starTex,
      blending:THREE.NormalBlending
    });
    var points = new THREE.Points(geometry,material);
    scene.add(points);
    return {
      pts:points,
      geo:geometry,
      mat:material,
      spd:spd,
      count:count,
      baseOp:opacity,
      tw:Math.random()*6.28
    };
  }

  var layers = [
    layer(7200, 0x121212, 0.009, 0.72),
    layer(1400, 0x5f5f5f, 0.011, 0.40),
    layer(1500, 0x5200FF, 0.018, 0.82),
    layer(1250, 0xF900FF, 0.017, 0.78),
    layer(1150, 0xAEE500, 0.023, 0.82),
    layer(460, 0xFF6000, 0.019, 0.76)
  ];

  function flow(x,y,z,t,o){
    var s=0.85;
    o[0]=Math.sin(y*s+t)+Math.cos(z*s*1.3-t*0.7);
    o[1]=Math.sin(z*s*1.1+t*0.8)+Math.cos(x*s*0.9+t);
    o[2]=(Math.sin(x*s*1.2-t)+Math.cos(y*s*1.05+t*0.6))*0.5;
  }

  function resize(){
    var w=window.innerWidth, h=window.innerHeight;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize, {passive:true});

  var hasMouse=false, mwx=0, mwy=0;
  window.addEventListener('pointermove', function(e){
    hasMouse=true;
    mwx=((e.clientX/window.innerWidth)*2-1)*BX;
    mwy=-(((e.clientY/window.innerHeight)*2-1)*BY);
  }, {passive:true});

  var group = new THREE.Group();
  layers.forEach(function(L){ group.add(L.pts); });
  scene.add(group);

  var v=[0,0,0], t=0;
  var NEBULA_FLOOR=0.32;

  function frame(){
    t += 0.004;
    var speed=0.006;
    var vh=window.innerHeight || 1;
    var scrollFactor=Math.max(NEBULA_FLOOR, Math.min(1, 1-(window.scrollY/(vh*2.2))));

    for (var li=0; li<layers.length; li++){
      var L=layers[li];
      var a=L.geo.attributes.position.array;
      for (var i=0;i<L.count;i++){
        var ix=i*3, x=a[ix], y=a[ix+1], z=a[ix+2];
        flow(x,y,z,t,v);
        var sp=speed*L.spd[i];
        x += v[0]*sp;
        y += v[1]*sp;
        z += v[2]*sp;

        if (hasMouse){
          var dx=x-mwx, dy=y-mwy, d2=dx*dx+dy*dy;
          if (d2<0.8){
            var f=(0.8-d2)*0.06;
            x+=dx*f;
            y+=dy*f;
          }
        }

        if (x>BX) x-=BX*2; else if (x<-BX) x+=BX*2;
        if (y>BY) y-=BY*2; else if (y<-BY) y+=BY*2;
        if (z>BZ) z-=BZ*2; else if (z<-BZ) z+=BZ*2;

        a[ix]=x;
        a[ix+1]=y;
        a[ix+2]=z;
      }
      L.geo.attributes.position.needsUpdate=true;
      L.mat.opacity=L.baseOp*scrollFactor*(0.84+0.16*Math.sin(t*1.6+L.tw));
    }

    group.rotation.z=t*0.05;
    group.rotation.x=Math.sin(t*0.3)*0.04;
    group.position.y=Math.sin(t*0.4)*0.05;

    renderer.render(scene,camera);
    if (!reduce) requestAnimationFrame(frame);
  }

  frame();

  setTimeout(function(){
    canvas.style.transition='opacity 1.5s ease';
    canvas.style.opacity='1';
    if (reduce) return;

    layers.forEach(function(L,i){
      L.pts.scale.set(0.35,0.35,0.35);
      var start=performance.now(), dur=2000+i*150;
      function scaleIn(){
        var p=Math.min(1,(performance.now()-start)/dur);
        var val=0.35+0.65*p;
        L.pts.scale.set(val,val,val);
        if (p<1) requestAnimationFrame(scaleIn);
      }
      requestAnimationFrame(scaleIn);
    });
  },300);
})();