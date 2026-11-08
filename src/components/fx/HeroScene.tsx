"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uPixelRatio;
  uniform float uSize;
  attribute float aRand;
  varying float vMix;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float w1 = sin(p.x * 0.35 + uTime * 0.6) * 0.9;
    float w2 = cos(p.y * 0.45 + uTime * 0.45) * 0.7;
    float w3 = sin((p.x + p.y) * 0.18 - uTime * 0.3) * 1.2;
    float d = distance(p.xy, uMouse * vec2(14.0, 6.0));
    float ripple = exp(-d * 0.35) * sin(d * 1.4 - uTime * 3.0) * 1.1;
    p.z += w1 + w2 + w3 + ripple + aRand * 0.25;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (0.6 + aRand * 0.8) * (10.0 / -mv.z);

    vMix = clamp((p.x + 16.0) / 32.0 + p.z * 0.08, 0.0, 1.0);
    vAlpha = clamp(0.35 + (p.z + 2.5) * 0.18, 0.15, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uOpacity;
  varying float vMix;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float glow = pow(1.0 - d * 2.0, 1.8);
    vec3 col = mix(uColorA, uColorB, smoothstep(0.0, 0.55, vMix));
    col = mix(col, uColorC, smoothstep(0.55, 1.0, vMix));
    gl_FragColor = vec4(col, glow * vAlpha * uOpacity);
  }
`;

function Particles({ cols, rows, light }: { cols: number; rows: number; light: boolean }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const group = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = cols * rows;
    const pos = new Float32Array(n * 3);
    const rand = new Float32Array(n);
    const W = 32, H = 16;
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        const k = i * rows + j;
        pos[k * 3] = (i / (cols - 1) - 0.5) * W + (Math.random() - 0.5) * 0.15;
        pos[k * 3 + 1] = (j / (rows - 1) - 0.5) * H + (Math.random() - 0.5) * 0.15;
        pos[k * 3 + 2] = 0;
        rand[k] = Math.random();
      }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
    return g;
  }, [cols, rows]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uPixelRatio: { value: 1 },
      uSize: { value: 7 },
      uOpacity: { value: 1 },
      uColorA: { value: new THREE.Color("#8B5CF6") },
      uColorB: { value: new THREE.Color("#A855F7") },
      uColorC: { value: new THREE.Color("#C026D3") },
    }),
    []
  );

  useFrame((state, delta) => {
    const m = mat.current;
    if (!m) return;
    m.uniforms.uTime.value += Math.min(delta, 0.05);
    m.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    m.uniforms.uMouse.value.lerp(state.pointer, 0.06);
    if (group.current) {
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -1.05 + state.pointer.y * 0.08, 0.05);
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, state.pointer.x * 0.08, 0.05);
    }
  });

  return (
    <group ref={group} rotation={[-1.05, 0, 0]} position={[0, -1.6, 0]}>
      <points geometry={geometry}>
        <shaderMaterial
          key={light ? "light" : "dark"}
          ref={mat}
          vertexShader={vertex}
          fragmentShader={fragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={light ? THREE.NormalBlending : THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/** Interactive particle wave field for the hero. Pauses when off-screen. */
export default function HeroScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [light, setLight] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(window.matchMedia("(max-width: 768px)").matches);
    const html = document.documentElement;
    const read = () => setLight(html.dataset.theme === "light");
    read();
    const mo = new MutationObserver(read);
    mo.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    if (wrap.current) io.observe(wrap.current);
    return () => { mo.disconnect(); io.disconnect(); };
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, mobile ? 1.25 : 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 10], fov: 55 }}
        eventSource={typeof document !== "undefined" ? document.body : undefined}
        eventPrefix="client"
      >
        <Particles cols={mobile ? 70 : 140} rows={mobile ? 36 : 70} light={light} />
      </Canvas>
    </div>
  );
}
