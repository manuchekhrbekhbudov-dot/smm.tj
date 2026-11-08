"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* Simplex noise (Ashima / Stefan Gustavson, MIT) for organic blob morphing. */
const noise = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const vertex = /* glsl */ `
uniform float uTime;
uniform float uAmp;
varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;
${noise}
void main(){
  float n = snoise(normal * 0.85 + uTime * 0.22);
  float n2 = snoise(normal * 1.6 - uTime * 0.16) * 0.25;
  float d = (n + n2) * uAmp;
  vNoise = d;
  vec3 pos = position + normal * d;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  // approximate displaced normal (good enough for a glossy look)
  vNormal = normalize(normalMatrix * normalize(normal + vec3(n, n2, -n) * uAmp * 0.35));
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const fragment = /* glsl */ `
uniform float uTime;
uniform float uLight;
varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;
void main(){
  vec3 n = normalize(vNormal);
  float fres = pow(1.0 - max(dot(n, vView), 0.0), 2.4);

  // iridescent body: violet core → magenta → soft cyan rim
  vec3 deep = vec3(0.20, 0.06, 0.45);
  vec3 violet = vec3(0.55, 0.36, 0.96);
  vec3 magenta = vec3(0.86, 0.30, 0.95);
  vec3 cyan = vec3(0.55, 0.85, 1.0);
  float band = 0.5 + 0.5 * sin(vNoise * 5.0 + uTime * 0.6 + n.y * 2.5);
  vec3 col = mix(deep, violet, smoothstep(-0.4, 0.8, n.y + vNoise));
  col = mix(col, magenta, band * 0.45);
  col += cyan * pow(fres, 2.2) * 0.35;

  // two glossy specular highlights (glass feel)
  vec3 L1 = normalize(vec3(-0.5, 0.8, 0.6));
  vec3 L2 = normalize(vec3(0.7, -0.3, 0.5));
  vec3 h1 = normalize(L1 + vView);
  vec3 h2 = normalize(L2 + vView);
  float s1 = pow(max(dot(n, h1), 0.0), 90.0);
  float s2 = pow(max(dot(n, h2), 0.0), 40.0) * 0.35;
  col += vec3(1.0) * (s1 + s2);

  col += violet * fres * 0.9;
  float alpha = 1.0;
  gl_FragColor = vec4(col, alpha);
}`;

function Blob({ light }: { light: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uAmp: { value: 0.2 }, uLight: { value: 0 } }), []);

  useEffect(() => { uniforms.uLight.value = light ? 1 : 0; }, [light, uniforms]);

  useFrame((state, delta) => {
    uniforms.uTime.value += Math.min(delta, 0.05);
    const m = mesh.current;
    if (!m) return;
    const scrollT = Math.min(window.scrollY / window.innerHeight, 1.2);
    m.rotation.y = THREE.MathUtils.lerp(m.rotation.y, state.pointer.x * 0.6 + uniforms.uTime.value * 0.15, 0.05);
    m.rotation.x = THREE.MathUtils.lerp(m.rotation.x, -state.pointer.y * 0.4, 0.05);
    const target = 1 - scrollT * 0.25;
    m.scale.setScalar(THREE.MathUtils.lerp(m.scale.x, target, 0.08));
    m.position.y = THREE.MathUtils.lerp(m.position.y, scrollT * 1.2, 0.08);
    uniforms.uAmp.value = THREE.MathUtils.lerp(uniforms.uAmp.value, 0.18 + Math.abs(state.pointer.x) * 0.08, 0.04);
  });

  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1.55, 64]} />
      <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent />
    </mesh>
  );
}

/** Small glossy satellites orbiting the blob. */
function Satellites() {
  const group = useRef<THREE.Group>(null);
  const items = useMemo(
    () => [
      { r: 2.6, s: 0.16, speed: 0.35, phase: 0, tilt: 0.4 },
      { r: 2.9, s: 0.1, speed: -0.25, phase: 2, tilt: -0.6 },
      { r: 2.3, s: 0.12, speed: 0.5, phase: 4, tilt: 1.1 },
    ],
    []
  );
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    items.forEach((it, i) => {
      const m = refs.current[i];
      if (!m) return;
      const a = t * it.speed + it.phase;
      m.position.set(Math.cos(a) * it.r, Math.sin(a * 1.3) * 0.6 + Math.sin(it.tilt) * Math.sin(a) * 0.8, Math.sin(a) * it.r * 0.5);
    });
    if (group.current) group.current.rotation.z = state.pointer.x * 0.1;
  });
  return (
    <group ref={group}>
      {items.map((it, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }}>
          <sphereGeometry args={[it.s, 32, 32]} />
          <meshStandardMaterial color="#c4b5fd" emissive="#7c3aed" emissiveIntensity={0.6} roughness={0.15} metalness={0.3} />
        </mesh>
      ))}
      <ambientLight intensity={0.6} />
      <pointLight position={[-3, 3, 4]} intensity={30} color="#e9d5ff" />
    </group>
  );
}

/** Hero 3D: morphing iridescent glass blob with orbiting satellites. Pauses off-screen. */
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
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    if (wrap.current) io.observe(wrap.current);
    return () => { mo.disconnect(); io.disconnect(); };
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, mobile ? 1.5 : 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 6.2], fov: 45 }}
        eventSource={typeof document !== "undefined" ? document.body : undefined}
        eventPrefix="client"
      >
        <Blob light={light} />
        {!mobile && <Satellites />}
      </Canvas>
    </div>
  );
}
