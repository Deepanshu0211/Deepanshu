"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { discover } from "@/components/discoveries";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
export default function Monogram({ motion }: { motion: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    const el = host.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      el.dataset.fallback = "true";
      return () => {
        delete el.dataset.fallback;
      };
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive sculptural DY monogram",
    );
    renderer.domElement.setAttribute("role", "img");
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(33, 1, 0.1, 50);
    camera.position.set(0, 0, 9);
    const generator = new THREE.PMREMGenerator(renderer),
      room = new RoomEnvironment(),
      env = generator.fromScene(room, 0.04);
    scene.environment = env.texture;
    room.dispose();
    generator.dispose();
    const group = new THREE.Group();
    scene.add(group);
    const chrome = new THREE.MeshStandardMaterial({
      color: 0xd9def1,
      metalness: 1,
      roughness: 0.18,
    });
    const blue = new THREE.MeshPhysicalMaterial({
      color: 0x2044ed,
      metalness: 0.45,
      roughness: 0.2,
      clearcoat: 1,
    });
    scene.add(new THREE.HemisphereLight(0xffffff, 0x434c77, 2));
    const light = new THREE.DirectionalLight(0xffffff, 4);
    light.position.set(-3, 5, 4);
    scene.add(light);
    const d = new THREE.Shape();
    d.moveTo(-1.55, -1.1);
    d.lineTo(-1.55, 1.1);
    d.lineTo(-0.72, 1.1);
    d.bezierCurveTo(0.7, 1.1, 0.7, -1.1, -0.72, -1.1);
    d.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-1.03, -0.57);
    hole.lineTo(-0.7, -0.57);
    hole.bezierCurveTo(-0.02, -0.57, -0.02, 0.57, -0.7, 0.57);
    hole.lineTo(-1.03, 0.57);
    hole.closePath();
    d.holes.push(hole);
    const dMesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(d, {
        depth: 0.38,
        bevelEnabled: true,
        bevelThickness: 0.14,
        bevelSize: 0.13,
        bevelSegments: 8,
        curveSegments: 32,
        steps: 1,
      }),
      chrome,
    );
    group.add(dMesh);
    const y = new THREE.Shape();
    y.moveTo(0.1, 1.1);
    y.lineTo(0.73, 1.1);
    y.lineTo(1.15, 0.24);
    y.lineTo(1.57, 1.1);
    y.lineTo(2.2, 1.1);
    y.lineTo(1.43, -0.37);
    y.lineTo(1.43, -1.1);
    y.lineTo(0.87, -1.1);
    y.lineTo(0.87, -0.37);
    y.closePath();
    const yMesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(y, {
        depth: 0.38,
        bevelEnabled: true,
        bevelThickness: 0.14,
        bevelSize: 0.12,
        bevelSegments: 8,
        curveSegments: 24,
        steps: 1,
      }),
      blue,
    );
    yMesh.position.set(-0.1, -0.24, 0.22);
    yMesh.rotation.z = -0.09;
    group.add(yMesh);
    group.rotation.set(0.15, -0.3, -0.17);
    group.position.x = -0.18;
    const pointer = { x: 0, y: 0 };
    const spin = { angle: 0 };
    const turn = () => {
      discover("monogram", el);
      if (motion && !matchMedia("(prefers-reduced-motion: reduce)").matches)
        gsap.to(spin, {
          angle: spin.angle + Math.PI * 2,
          duration: 2.2,
          ease: "power3.inOut",
          overwrite: true,
        });
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        turn();
      }
    };
    const recolor = (event: Event) => {
      blue.color.set((event as CustomEvent<string>).detail);
    };
    const currentAccent = getComputedStyle(document.documentElement)
      .getPropertyValue("--blue")
      .trim();
    if (currentAccent) blue.color.set(currentAccent);
    el.addEventListener("click", turn);
    el.addEventListener("keydown", key);
    window.addEventListener("dy-palette", recolor);
    let visible = true,
      frame = 0;
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / r.width - 0.5;
      pointer.y = (e.clientY - r.top) / r.height - 0.5;
    };
    const leave = () => {
      pointer.x = 0;
      pointer.y = 0;
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    const resize = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    });
    resize.observe(el);
    const io = new IntersectionObserver((e) => {
      visible = e[0].isIntersecting;
    });
    io.observe(el);
    const start = performance.now();
    const render = () => {
      frame = requestAnimationFrame(render);
      if (!visible || document.hidden) return;
      const animated = motion && !query.matches,
        t = (performance.now() - start) / 1000;
      group.rotation.y = THREE.MathUtils.lerp(
        group.rotation.y,
        -0.3 +
          spin.angle +
          (animated ? pointer.x * 0.7 + Math.sin(t * 0.4) * 0.15 : 0),
        0.045,
      );
      group.rotation.x = THREE.MathUtils.lerp(
        group.rotation.x,
        0.15 + (animated ? pointer.y * 0.4 : 0),
        0.045,
      );
      group.position.y = animated ? Math.sin(t * 0.7) * 0.075 : 0;
      renderer.render(scene, camera);
    };
    render();
    return () => {
      cancelAnimationFrame(frame);
      gsap.killTweensOf(spin);
      el.removeEventListener("click", turn);
      el.removeEventListener("keydown", key);
      window.removeEventListener("dy-palette", recolor);
      resize.disconnect();
      io.disconnect();
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      chrome.dispose();
      blue.dispose();
      env.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [motion]);
  return (
    <div
      ref={host}
      className="monogram-canvas"
      role="button"
      tabIndex={0}
      aria-label="Give the DY monogram a spin"
    >
      <span className="monogram-fallback">dy.</span>
    </div>
  );
}
