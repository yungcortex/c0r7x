import * as THREE from 'three';
import vertexShader from '../shaders/liquid-bg.vert';
import fragmentShader from '../shaders/liquid-bg.frag';

export class LiquidBackground {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouse = new THREE.Vector2(0.5, 0.5);
    this.scrollY = 0;
    this.dpr = Math.min(window.devicePixelRatio, 2);
    this.resScale = window.innerWidth < 768 ? 0.25 : 0.5;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(this.dpr * this.resScale);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.uniforms = {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      depthTest: false,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    this._onResize = this.onResize.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    window.addEventListener('resize', this._onResize);
    window.addEventListener('mousemove', this._onMouseMove);
  }

  onResize() {
    this.resScale = window.innerWidth < 768 ? 0.25 : 0.5;
    this.renderer.setPixelRatio(this.dpr * this.resScale);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  }

  onMouseMove(e) {
    this.mouse.set(e.clientX / window.innerWidth, 1.0 - e.clientY / window.innerHeight);
  }

  update(time, scrollProgress) {
    this.uniforms.uTime.value = time;
    this.uniforms.uScroll.value = scrollProgress;
    this.uniforms.uMouse.value.lerp(this.mouse, 0.05);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('mousemove', this._onMouseMove);
    this.renderer.dispose();
  }
}
