import * as THREE from 'three';

const orbVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
uniform float uTime;
uniform float uDisplacement;

vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  vec3 pos = position;
  float noise = snoise(pos * 2.0 + uTime * 0.4) * uDisplacement;
  pos += normal * noise;

  vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const orbFragmentShader = `
precision highp float;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
uniform float uTime;
uniform vec3 uAccent;
uniform float uHover;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(-vPosition);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);

  vec3 chrome = vec3(0.6, 0.6, 0.68);
  vec3 highlight = vec3(0.95, 0.95, 1.0);
  vec3 baseColor = mix(chrome, uAccent, 0.3);
  vec3 color = mix(baseColor, highlight, fresnel * 0.7);

  vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
  float spec = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 32.0);
  color += spec * 0.5;
  color += uAccent * fresnel * 0.4 * (1.0 + uHover * 0.5);

  float irid = sin(fresnel * 6.28 + uTime * 0.5) * 0.5 + 0.5;
  color += vec3(irid * 0.05, irid * 0.02, irid * 0.08);

  gl_FragColor = vec4(color, 0.95);
}
`;

export class ProjectOrb {
  constructor(container, config) {
    this.container = container;
    this.config = config;
    this.isVisible = false;
    this.mouse = { x: 0, y: 0 };
    this.targetRotation = { x: 0, y: 0 };

    const rect = container.getBoundingClientRect();
    const w = rect.width || 400;
    const h = rect.height || 400;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    this.camera.position.z = 4;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);

    const accent = new THREE.Color(config.accent);
    this.uniforms = {
      uTime: { value: 0 },
      uAccent: { value: accent },
      uHover: { value: 0 },
      uDisplacement: { value: 0.15 },
    };

    const geometry = this.createGeometry(config.orbType);
    const material = new THREE.ShaderMaterial({
      vertexShader: orbVertexShader,
      fragmentShader: orbFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    // Wireframe overlay
    const wiremat = new THREE.MeshBasicMaterial({
      color: accent,
      wireframe: true,
      transparent: true,
      opacity: 0.06,
    });
    this.wireframe = new THREE.Mesh(geometry.clone(), wiremat);
    this.wireframe.scale.setScalar(1.02);
    this.scene.add(this.wireframe);

    // Scale from 0 (mercury puddle effect)
    this.mesh.scale.set(0, 0, 0);
    this.wireframe.scale.set(0, 0, 0);

    this._onMouseMove = (e) => {
      const r = container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      this.mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener('mousemove', this._onMouseMove);

    this._resizeObserver = new ResizeObserver(() => {
      const r = container.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        this.camera.aspect = r.width / r.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(r.width, r.height);
      }
    });
    this._resizeObserver.observe(container);
  }

  createGeometry(type) {
    switch (type) {
      case 'icosahedron': return new THREE.IcosahedronGeometry(1.2, 3);
      case 'torus': return new THREE.TorusGeometry(1, 0.4, 32, 64);
      case 'box': return new THREE.BoxGeometry(1.5, 1.5, 1.5, 8, 8, 8);
      case 'dodecahedron': return new THREE.DodecahedronGeometry(1.2, 2);
      case 'sphere':
      default: return new THREE.SphereGeometry(1.2, 64, 64);
    }
  }

  show() {
    this.isVisible = true;
  }

  hide() {
    this.isVisible = false;
  }

  update(time) {
    this.uniforms.uTime.value = time;

    // Scale animation (mercury puddle -> sphere)
    const targetScale = this.isVisible ? 1 : 0;
    const currentScale = this.mesh.scale.x;
    const newScale = currentScale + (targetScale - currentScale) * 0.06;
    // Y-squash during scale-up for mercury effect
    const squash = newScale < 0.5 ? 0.3 + newScale * 1.4 : 1.0;
    this.mesh.scale.set(newScale, newScale * squash, newScale);
    this.wireframe.scale.set(newScale * 1.02, newScale * squash * 1.02, newScale * 1.02);

    // Mouse parallax rotation
    this.targetRotation.x = this.mouse.y * 0.3;
    this.targetRotation.y = this.mouse.x * 0.3;
    this.mesh.rotation.x += (this.targetRotation.x - this.mesh.rotation.x) * 0.05;
    this.mesh.rotation.y += (this.targetRotation.y + time * 0.2 - this.mesh.rotation.y) * 0.05;
    this.wireframe.rotation.copy(this.mesh.rotation);

    if (newScale > 0.01) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    window.removeEventListener('mousemove', this._onMouseMove);
    this._resizeObserver.disconnect();
    this.renderer.dispose();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
