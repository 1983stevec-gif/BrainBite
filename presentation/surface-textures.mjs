import * as THREE from '../vendor/three/three.module.js';

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
