import * as THREE from '../vendor/three/three.module.js';

function canvasSurface(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  let seed = 7391;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  return { canvas, context, random };
}

function surfaceTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

// Small deterministic textures add surface detail without downloads or more meshes.
export function makeStoneMaterial({ color = 0xb7b28b, repeat = 1 } = {}) {
  const { canvas, context, random } = canvasSurface();
  context.fillStyle = '#414735';
  context.fillRect(0, 0, 256, 256);
  for (let row = -1; row < 7; row++) {
    for (let col = -1; col < 5; col++) {
      const x = col * 64 + (row % 2 ? 32 : 0);
      const y = row * 43;
      const light = 64 + random() * 16;
      context.fillStyle = `hsl(48 12% ${light}%)`;
      context.fillRect(x + 2, y + 2, 60, 39);
      context.strokeStyle = 'rgba(255,250,209,0.3)';
      context.lineWidth = 1;
      context.strokeRect(x + 3, y + 3, 58, 37);
      for (let fleck = 0; fleck < 22; fleck++) {
        context.fillStyle = fleck % 3 ? 'rgba(46,59,29,0.12)' : 'rgba(244,239,195,0.2)';
        context.fillRect(x + 4 + random() * 54, y + 4 + random() * 32, 2, 1);
      }
    }
  }
  const map = surfaceTexture(canvas);
  map.repeat.set(repeat, repeat);
  return new THREE.MeshStandardMaterial({ color, map, bumpMap: map, bumpScale: 0.055, roughness: 0.9 });
}

export function makePlazaMaterial() {
  const { canvas, context, random } = canvasSurface(512);
  context.fillStyle = '#4e6342';
  context.fillRect(0, 0, 512, 512);
  const rings = [0, 72, 131, 194, 256];
  for (let ring = 0; ring < rings.length - 1; ring++) {
    const count = 7 + ring * 5;
    for (let tile = 0; tile < count; tile++) {
      const angle = (tile / count) * Math.PI * 2 + ring * 0.13;
      const next = angle + Math.PI * 2 / count;
      context.beginPath();
      context.arc(256, 256, rings[ring + 1] - 1.5, angle + 0.008, next - 0.008);
      context.arc(256, 256, rings[ring] + 1.5, next - 0.008, angle + 0.008, true);
      context.closePath();
      context.fillStyle = `hsl(${44 + random() * 8} 24% ${48 + random() * 13}%)`;
      context.fill();
      context.strokeStyle = 'rgba(244,225,156,0.25)';
      context.lineWidth = 2;
      context.stroke();
    }
  }
  for (let fleck = 0; fleck < 1600; fleck++) {
    context.fillStyle = fleck % 3 ? 'rgba(50,68,35,0.12)' : 'rgba(255,244,189,0.12)';
    context.fillRect(random() * 512, random() * 512, 1 + random() * 2, 1);
  }
  const map = surfaceTexture(canvas);
  return new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: 0.05, roughness: 0.91 });
}

export function makeTimberMaterial({ color = 0xc29253 } = {}) {
  const { canvas, context, random } = canvasSurface();
  context.fillStyle = '#b88b55';
  context.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 64; row++) {
    context.beginPath();
    for (let x = 0; x <= 256; x += 4) {
      const y = row * 4 + Math.sin(x / 42 + row * 0.5) * 1.9;
      if (x === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.strokeStyle = row % 5 ? `rgba(73,42,19,${0.06 + random() * 0.1})` : 'rgba(246,213,152,0.24)';
    context.lineWidth = 0.6 + random();
    context.stroke();
  }
  const map = surfaceTexture(canvas);
  return new THREE.MeshStandardMaterial({ color, map, bumpMap: map, bumpScale: 0.025, roughness: 0.82 });
}

export function makeWaterfallMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec2 flowUv;
      void main() { flowUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float time; varying vec2 flowUv;
      void main() {
        float edge = smoothstep(0.0, 0.16, flowUv.x) * smoothstep(0.0, 0.16, 1.0 - flowUv.x);
        float streak = pow(0.5 + 0.5 * sin(flowUv.x * 72.0 + sin(flowUv.y * 14.0 + time * 2.0)), 3.0);
        float spray = pow(0.5 + 0.5 * sin(flowUv.y * 45.0 + time * 5.0 + flowUv.x * 9.0), 12.0);
        vec3 color = mix(vec3(0.11, 0.55, 0.64), vec3(0.75, 0.97, 0.94), streak * 0.7 + spray * 0.3);
        gl_FragColor = vec4(color, edge * (0.66 + streak * 0.26));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

export function makePortalEnergyMaterial(center, radius) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      center: { value: new THREE.Vector2(...center) },
      radius: { value: radius },
    },
    vertexShader: `
      varying vec2 portalPosition;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        portalPosition = world.xy;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec2 center;
      uniform float radius;
      varying vec2 portalPosition;
      void main() {
        vec2 p = (portalPosition - center) / radius;
        float r = length(p);
        float angle = atan(p.y, p.x);
        float spiral = pow(0.5 + 0.5 * sin(r * 24.0 - angle * 3.0 - time * 1.4), 5.0);
        float ring = exp(-abs(r - 0.88) * 28.0);
        float heart = exp(-r * 4.0);
        vec3 color = mix(vec3(0.015, 0.09, 0.25), vec3(0.015, 0.48, 0.78), r);
        color += spiral * vec3(0.05, 0.25, 0.32) + ring * vec3(0.3, 0.9, 1.0);
        color += heart * vec3(0.05, 0.3, 0.45);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

export function makeTerrainMaterial() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = '#667a45';
  context.fillRect(0, 0, 256, 256);
  let seed = 491;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 1800; i++) {
    const x = random() * 256, y = random() * 256;
    context.strokeStyle = i % 3 ? '#728650' : '#526b3d';
    context.lineWidth = 1 + random();
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + random() * 3 - 1.5, y - 2 - random() * 4);
    context.stroke();
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(12, 12);
  return new THREE.MeshStandardMaterial({ map, roughness: 0.97 });
}
