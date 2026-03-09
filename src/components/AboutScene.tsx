import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Suspense, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import * as THREE from 'three';

export interface AboutSceneHandle {
  setScrollProgress: (progress: number) => void;
}

function AbstractSculpture({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const p = progressRef.current;
    const t = state.clock.elapsedTime;

    groupRef.current.rotation.y = p * Math.PI * 2 + t * 0.08;
    groupRef.current.rotation.x = Math.sin(p * Math.PI) * 0.3;
    groupRef.current.position.y = -p * 1.2;
    const s = 1 - p * 0.15;
    groupRef.current.scale.setScalar(s);

    if (innerRef.current) {
      const pulse = 1 + Math.sin(t * 1.5) * 0.05;
      innerRef.current.scale.setScalar(pulse);
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.3 + p * Math.PI;
      ring1Ref.current.rotation.z = t * 0.15;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = t * 0.25 + p * Math.PI * 0.5;
      ring2Ref.current.rotation.x = Math.PI * 0.5 + t * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main torus knot — metallic gold */}
      <mesh>
        <torusKnotGeometry args={[1, 0.35, 256, 64, 2, 3]} />
        <meshPhysicalMaterial
          color="#d4a040"
          metalness={0.9}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={2}
        />
      </mesh>

      {/* Inner glowing sphere */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.45, 4]} />
        <meshStandardMaterial
          color="#c4953a"
          emissive="#c4953a"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>

      {/* Orbiting ring 1 */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.8, 0.015, 16, 100]} />
        <meshStandardMaterial
          color="#c4953a"
          emissive="#c4953a"
          emissiveIntensity={0.8}
          toneMapped={false}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Orbiting ring 2 */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.1, 0.01, 16, 100]} />
        <meshStandardMaterial
          color="#3a6acc"
          emissive="#3a6acc"
          emissiveIntensity={0.5}
          toneMapped={false}
          transparent
          opacity={0.3}
        />
      </mesh>

      <OrbitingParticles />
    </group>
  );
}

function OrbitingParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 120;

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.2 + Math.random() * 1.2;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return [pos];
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.03;
      ref.current.rotation.x = state.clock.elapsedTime * 0.015;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="#c4953a" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

const AboutScene = forwardRef<AboutSceneHandle>((_, forwardedRef) => {
  const progressRef = useRef(0);

  useImperativeHandle(forwardedRef, () => ({
    setScrollProgress: (p: number) => {
      progressRef.current = p;
    },
  }));

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 32 }}
      style={{ background: 'transparent' }}
      gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.8 }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        <Environment preset="city" />
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={2} color="#ffeedd" />
        <pointLight position={[-3, 2, -3]} intensity={2} color="#c4953a" />
        <pointLight position={[3, -2, 3]} intensity={0.8} color="#3a6acc" />
        <spotLight position={[0, 5, 0]} intensity={1} angle={0.3} penumbra={1} color="#c4953a" />
        <AbstractSculpture progressRef={progressRef} />
      </Suspense>
    </Canvas>
  );
});

AboutScene.displayName = 'AboutScene';

export default AboutScene;
