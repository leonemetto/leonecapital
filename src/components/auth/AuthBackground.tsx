import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/* ── Shader source ── */
const vertexShader = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    pos.y += sin(pos.x * 10.0 + time) * 0.1 * intensity;
    pos.x += cos(pos.y * 8.0 + time * 1.5) * 0.05 * intensity;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform vec3 color1;
  uniform vec3 color2;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    float noise = sin(uv.x * 20.0 + time) * cos(uv.y * 15.0 + time * 0.8);
    noise += sin(uv.x * 35.0 - time * 2.0) * cos(uv.y * 25.0 + time * 1.2) * 0.5;
    vec3 color = mix(color1, color2, noise * 0.5 + 0.5);
    color = mix(color, vec3(1.0), pow(abs(noise), 2.0) * intensity * 0.06);
    float glow = 1.0 - length(uv - 0.5) * 2.0;
    glow = pow(max(glow, 0.0), 2.4);
    gl_FragColor = vec4(color * glow, glow * 0.5);
  }
`;

/* ── Config for each plane ── */
const PLANES = [
  { pos: [0, 0, 0] as [number, number, number],       c1: '#061209', c2: '#1a4a28', scale: 2.4, speed: 0.35 },
  { pos: [-1.6, 1.1, -1.2] as [number, number, number], c1: '#050e07', c2: '#123520', scale: 1.8, speed: 0.22 },
  { pos: [1.4, -0.8, -0.9] as [number, number, number], c1: '#050b06', c2: '#163d22', scale: 1.6, speed: 0.28 },
];

const RINGS = [
  { radius: 1.6, pos: [0.4, 0.2, -0.5] as [number, number, number],  color: '#1e5c30', speed:  0.18 },
  { radius: 2.2, pos: [-0.6, -0.3, -1.0] as [number, number, number], color: '#174d28', speed: -0.12 },
  { radius: 0.9, pos: [1.2, 0.9, -0.3] as [number, number, number],  color: '#28703e', speed:  0.25 },
];

export function AuthBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x040d07, 1);
    mount.appendChild(renderer.domElement);

    /* ── Scene + camera ── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.z = 3.5;

    /* ── Shader planes ── */
    const planeGeo = new THREE.PlaneGeometry(2, 2, 24, 24);
    const planeMeshes: Array<{ mesh: THREE.Mesh; uniforms: Record<string, THREE.IUniform>; speed: number }> = [];

    for (const p of PLANES) {
      const uniforms = {
        time:      { value: 0 },
        intensity: { value: 1.2 },
        color1:    { value: new THREE.Color(p.c1) },
        color2:    { value: new THREE.Color(p.c2) },
      };
      const mat = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(planeGeo, mat);
      mesh.position.set(...p.pos);
      mesh.scale.setScalar(p.scale);
      scene.add(mesh);
      planeMeshes.push({ mesh, uniforms, speed: p.speed });
    }

    /* ── Energy rings ── */
    const ringMeshes: Array<{ mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; speed: number }> = [];

    for (const r of RINGS) {
      const geo = new THREE.RingGeometry(r.radius * 0.82, r.radius, 48);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(r.color),
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...r.pos);
      scene.add(mesh);
      ringMeshes.push({ mesh, mat, speed: r.speed });
    }

    /* ── Animation loop ── */
    const clock = new THREE.Clock();
    let frameId: number;
    let running = true;

    const animate = () => {
      if (!running) return;
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      for (const p of planeMeshes) {
        p.uniforms.time.value = t * p.speed;
        p.uniforms.intensity.value = 1.2 + Math.sin(t * 1.2) * 0.3;
      }
      for (const r of ringMeshes) {
        r.mesh.rotation.z = t * r.speed;
        r.mat.opacity = 0.18 + Math.sin(t * 2.5) * 0.08;
      }

      renderer.render(scene, camera);
    };
    animate();

    /* ── Resize ── */
    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      planeGeo.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
