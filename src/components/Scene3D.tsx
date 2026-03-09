import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Environment, Stars, useGLTF, MeshTransmissionMaterial } from '@react-three/drei';
import { useRef, useMemo, Suspense, useEffect } from 'react';
import * as THREE from 'three';

function Particles({ count = 800 }) {
  const ref = useRef<THREE.Points>(null);
  const [positions, sizes] = useMemo(() => {
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 50;
      p[i * 3 + 1] = (Math.random() - 0.5) * 50;
      p[i * 3 + 2] = (Math.random() - 0.5) * 50;
      s[i] = Math.random() * 0.012 + 0.001;
    }
    return [p, s];
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.004;
      ref.current.rotation.x = clock.elapsedTime * 0.002;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial size={0.01} color="#c4953a" transparent opacity={0.18} sizeAttenuation />
    </points>
  );
}

// Load actual 3D model
function HelmetModel() {
  const { scene } = useGLTF('/models/DamagedHelmet.glb');
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouse.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.elapsedTime * 0.05 + mouse.current.x * 0.15;
      groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.3) * 0.05 + mouse.current.y * 0.08;
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        mouse.current.x * viewport.width * 0.04,
        0.006
      );
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        mouse.current.y * viewport.height * 0.04 + Math.sin(clock.elapsedTime * 0.5) * 0.15,
        0.006
      );
    }
  });

  return (
    <Float speed={0.3} rotationIntensity={0.05} floatIntensity={0.2}>
      <group ref={groupRef} scale={2.4} rotation={[0, 0, Math.PI * 0.1]}>
        <primitive object={scene} />
      </group>
    </Float>
  );
}

// Glass sphere for visual interest
function GlassSphere({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.4 + position[0]) * 0.3;
    }
  });

  return (
    <mesh ref={ref} position={position} scale={0.3}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhysicalMaterial
        color="#c4953a"
        roughness={0}
        metalness={0.9}
        envMapIntensity={3}
        clearcoat={1}
        clearcoatRoughness={0}
      />
    </mesh>
  );
}

function Ring({ r = 4, speed = 0.02, col = '#d4a040', op = 0.04, tilt = 0 }: {
  r?: number; speed?: number; col?: string; op?: number; tilt?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.z = clock.elapsedTime * speed;
      ref.current.rotation.x = tilt + clock.elapsedTime * speed * 0.2;
    }
  });
  return (
    <mesh ref={ref} scale={r}>
      <torusGeometry args={[1, 0.001, 64, 300]} />
      <meshBasicMaterial color={col} transparent opacity={op} />
    </mesh>
  );
}

const Scene3D = () => (
  <Canvas
    camera={{ position: [0, 0, 7], fov: 32 }}
    style={{ background: 'transparent' }}
    gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3 }}
    dpr={[1, 1.5]}
  >
    <Suspense fallback={null}>
      <Environment preset="city" />
      <ambientLight intensity={0.08} />
      <directionalLight position={[5, 5, 5]} intensity={2} color="#ffeedd" />
      <pointLight position={[-6, 4, -6]} intensity={1.5} color="#c4953a" />
      <pointLight position={[6, -4, 6]} intensity={0.3} color="#3a6acc" />
      <spotLight position={[0, 8, 0]} angle={0.2} penumbra={1} intensity={0.5} color="#d4a040" />

      <HelmetModel />
      <GlassSphere position={[-3, 1.5, -2]} />
      <GlassSphere position={[3.5, -1, -3]} />
      <GlassSphere position={[2, 2.5, -4]} />
      <Ring r={3.5} speed={0.015} col="#c4953a" op={0.03} tilt={Math.PI / 4} />
      <Ring r={5} speed={0.008} col="#3a6acc" op={0.015} tilt={Math.PI / 3} />
      <Ring r={6.5} speed={0.005} col="#c4953a" op={0.008} tilt={-Math.PI / 5} />
      <Particles />
      <Stars radius={40} depth={120} count={1500} factor={0.6} saturation={0} fade speed={0.08} />
    </Suspense>
  </Canvas>
);

// Preload
useGLTF.preload('/models/DamagedHelmet.glb');

export default Scene3D;
