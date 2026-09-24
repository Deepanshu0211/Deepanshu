"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
export default function RaceCar({
  view,
  motion,
}: {
  view: "perspective" | "top";
  motion: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    cameraView = useRef(view);
  useEffect(() => {
    cameraView.current = view;
  }, [view]);
  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      container.dataset.webgl = "unavailable";
      return () => {
        delete container.dataset.webgl;
      };
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive white Formula-style race car. Drag horizontally to rotate, or use the camera view buttons.",
    );
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100),
      car = new THREE.Group();
    scene.add(car);
    camera.position.set(-6.8, 4.4, 7.6);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8bcc2, 3));
    const key = new THREE.DirectionalLight(0xffffff, 5);
    key.position.set(-3, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, {
      left: -5,
      right: 5,
      top: 5,
      bottom: -5,
    });
    key.shadow.normalBias = 0.025;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdce7ff, 2);
    fill.position.set(4, 3, -4);
    scene.add(fill);
    const white = new THREE.MeshPhysicalMaterial({
        color: 0xf4f4f0,
        roughness: 0.28,
        metalness: 0.32,
        clearcoat: 1,
      }),
      carbon = new THREE.MeshStandardMaterial({
        color: 0x202323,
        roughness: 0.62,
        metalness: 0.25,
      }),
      rubber = new THREE.MeshStandardMaterial({
        color: 0x171918,
        roughness: 0.91,
      }),
      metal = new THREE.MeshStandardMaterial({
        color: 0x777c7d,
        roughness: 0.25,
        metalness: 0.9,
      }),
      orange = new THREE.MeshStandardMaterial({
        color: 0xf45324,
        roughness: 0.4,
        metalness: 0.25,
      });
    function mesh(
      g: THREE.BufferGeometry,
      m: THREE.Material,
      x = 0,
      y = 0,
      z = 0,
    ) {
      const o = new THREE.Mesh(g, m);
      o.position.set(x, y, z);
      o.castShadow = true;
      o.receiveShadow = true;
      car.add(o);
      return o;
    }
    function box(
      w: number,
      h: number,
      d: number,
      m: THREE.Material,
      x: number,
      y: number,
      z: number,
    ) {
      return mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z);
    }
    function rod(a: number[], b: number[], r: number, m: THREE.Material) {
      const av = new THREE.Vector3(...a),
        bv = new THREE.Vector3(...b);
      const o = mesh(new THREE.CylinderGeometry(r, r, av.distanceTo(bv), 8), m);
      o.position.copy(av).add(bv).multiplyScalar(0.5);
      o.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        bv.sub(av).normalize(),
      );
      return o;
    }
    function loft(sections: number[][], m: THREE.Material) {
      const pos: number[] = [],
        idx: number[] = [];
      const n = 32;
      sections.forEach(([x, y, w, h]) => {
        for (let j = 0; j < n; j++) {
          const a = (j / n) * Math.PI * 2;
          pos.push(x, y + Math.sin(a) * h, Math.cos(a) * w);
        }
      });
      for (let i = 0; i < sections.length - 1; i++)
        for (let j = 0; j < n; j++) {
          const a = i * n + j,
            b = i * n + ((j + 1) % n),
            c = (i + 1) * n + j,
            d = (i + 1) * n + ((j + 1) % n);
          idx.push(a, c, b, b, c, d);
        }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return mesh(g, m);
    }
    box(4.3, 0.09, 1.55, carbon, 0.1, 0.22, 0);
    loft(
      [
        [-2.65, 0.43, 0.1, 0.06],
        [-2.4, 0.48, 0.16, 0.1],
        [-1.7, 0.54, 0.22, 0.14],
        [-0.8, 0.59, 0.36, 0.2],
        [-0.32, 0.58, 0.43, 0.23],
        [0.4, 0.54, 0.42, 0.22],
        [1.15, 0.53, 0.33, 0.25],
        [2, 0.46, 0.15, 0.15],
        [2.25, 0.43, 0.02, 0.04],
      ],
      white,
    );
    for (const s of [-1, 1]) {
      const pod = loft(
        [
          [-0.45, 0.43, 0.01, 0.02],
          [-0.22, 0.48, 0.22, 0.21],
          [0.2, 0.46, 0.25, 0.23],
          [0.85, 0.44, 0.22, 0.2],
          [1.6, 0.4, 0.07, 0.1],
          [1.9, 0.37, 0.01, 0.01],
        ],
        white,
      );
      pod.position.z = s * 0.55;
      box(0.1, 0.23, 0.32, carbon, -0.22, 0.5, s * 0.55);
      box(1.4, 0.035, 0.075, orange, 0.55, 0.64, s * 0.72);
      box(1.9, 0.045, 0.13, carbon, 0.8, 0.26, s * 0.86);
    }
    loft(
      [
        [0.16, 0.76, 0.19, 0.12],
        [0.45, 0.93, 0.2, 0.28],
        [0.7, 0.88, 0.17, 0.24],
        [1.2, 0.67, 0.15, 0.15],
        [1.85, 0.46, 0.04, 0.04],
      ],
      white,
    );
    mesh(
      new THREE.SphereGeometry(0.14, 24, 16),
      carbon,
      0.37,
      1.06,
      0,
    ).scale.set(0.4, 1, 0.85);
    mesh(
      new THREE.SphereGeometry(0.32, 32, 20),
      carbon,
      -0.38,
      0.76,
      0,
    ).scale.set(1.4, 0.28, 0.8);
    mesh(
      new THREE.SphereGeometry(0.145, 24, 16),
      white,
      -0.21,
      0.8,
      0,
    ).scale.set(1, 0.95, 0.95);
    mesh(
      new THREE.SphereGeometry(0.15, 24, 16, Math.PI * 0.5, Math.PI),
      carbon,
      -0.22,
      0.82,
      0,
    ).scale.set(1, 0.34, 0.93);
    mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.14, 0.87, -0.3),
          new THREE.Vector3(-0.45, 0.97, -0.3),
          new THREE.Vector3(-0.88, 0.86, 0),
          new THREE.Vector3(-0.45, 0.97, 0.3),
          new THREE.Vector3(0.14, 0.87, 0.3),
        ]),
        32,
        0.036,
        8,
        false,
      ),
      carbon,
    );
    rod([-0.88, 0.65, 0], [-0.88, 0.86, 0], 0.027, carbon);
    for (const s of [-1, 1]) {
      rod([-0.6, 0.68, s * 0.26], [-0.65, 0.75, s * 0.61], 0.017, carbon);
      mesh(
        new THREE.SphereGeometry(0.1, 16, 12),
        white,
        -0.65,
        0.76,
        s * 0.62,
      ).scale.set(1, 0.5, 0.65);
    }
    for (let i = 0; i < 3; i++)
      box(
        0.2,
        0.04,
        2.45 - i * 0.12,
        i === 0 ? white : carbon,
        -2.56 + i * 0.17,
        0.23 + i * 0.07,
        0,
      ).rotation.z = -0.09;
    for (const s of [-1, 1]) {
      box(0.67, 0.26, 0.045, white, -2.38, 0.32, s * 1.19);
      box(0.59, 0.025, 0.06, orange, -2.38, 0.46, s * 1.19);
      box(0.055, 0.66, 0.045, carbon, 1.95, 0.61, s * 0.34);
      box(0.65, 0.51, 0.055, white, 2.08, 0.89, s * 0.9);
    }
    box(0.66, 0.065, 1.8, carbon, 2.06, 1.04, 0);
    box(0.25, 0.06, 1.79, white, 2.18, 1.14, 0);
    box(0.12, 0.025, 1.81, orange, 2.29, 1.17, 0);
    box(0.45, 0.13, 0.9, carbon, 2.04, 0.27, 0);
    for (let i = -3; i <= 3; i++)
      box(0.44, 0.15, 0.024, carbon, 2.1, 0.24, i * 0.14);
    for (const x of [-1.65, 1.48])
      for (const s of [-1, 1]) {
        const z = s * 1.02,
          r = x > 0 ? 0.49 : 0.45,
          w = x > 0 ? 0.43 : 0.36;
        mesh(
          new THREE.CylinderGeometry(r, r, w, 64),
          rubber,
          x,
          0.5,
          z,
        ).rotation.x = Math.PI / 2;
        for (const face of [-1, 1]) {
          mesh(
            new THREE.TorusGeometry(r * 0.8, 0.012, 8, 64),
            orange,
            x,
            0.5,
            z + face * (w / 2 + 0.005),
          );
          mesh(
            new THREE.CylinderGeometry(0.255, 0.255, 0.025, 48),
            carbon,
            x,
            0.5,
            z + face * (w / 2 + 0.009),
          ).rotation.x = Math.PI / 2;
          mesh(
            new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16),
            metal,
            x,
            0.5,
            z + face * (w / 2 + 0.028),
          ).rotation.x = Math.PI / 2;
          for (let k = 0; k < 10; k++) {
            const a = (k / 10) * Math.PI * 2;
            rod(
              [
                x + Math.cos(a) * 0.07,
                0.5 + Math.sin(a) * 0.07,
                z + face * (w / 2 + 0.03),
              ],
              [
                x + Math.cos(a + 0.15) * 0.23,
                0.5 + Math.sin(a + 0.15) * 0.23,
                z + face * (w / 2 + 0.03),
              ],
              0.016,
              metal,
            );
          }
        }
        for (const y of [0.35, 0.58]) {
          rod([x - 0.42, y, s * 0.2], [x, 0.5, s * 0.91], 0.026, carbon);
          rod([x + 0.38, y, s * 0.22], [x, 0.5, s * 0.91], 0.026, carbon);
        }
        rod([x + 0.23, 0.7, s * 0.25], [x, 0.38, s * 0.95], 0.028, metal);
      }
    const label = document.createElement("canvas");
    label.width = 512;
    label.height = 256;
    const ctx = label.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#232624";
      ctx.textAlign = "center";
      ctx.font = "italic bold 135px Arial";
      ctx.fillText("01", 256, 158);
      ctx.font = "22px Arial";
      ctx.fillText("DEEPANSHU", 256, 200);
      const decal = mesh(
        new THREE.PlaneGeometry(0.58, 0.29),
        new THREE.MeshBasicMaterial({
          map: new THREE.CanvasTexture(label),
          transparent: true,
          depthWrite: false,
        }),
        -1.24,
        0.697,
        0,
      );
      decal.rotation.x = -Math.PI / 2;
      decal.rotation.z = -Math.PI / 2;
    }
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.ShadowMaterial({ opacity: 0.13 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.position.y = 0.005;
    scene.add(floor);
    const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motionQuery.matches || !motion;
    const updatePreference = () => {
      reduced = motionQuery.matches || !motion;
    };
    motionQuery.addEventListener("change", updatePreference);
    const orbit = { turn: 0, elevation: 0, entry: 0 };
    const mm = gsap.matchMedia();
    if (motion)
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = gsap.timeline();
        intro.fromTo(
          orbit,
          { entry: -1.2 },
          { entry: 0, duration: 2.6, ease: "power3.out" },
        );
        intro.from(
          car.position,
          { y: 0.6, duration: 2.6, ease: "power3.out" },
          0,
        );
        gsap.to(orbit, {
          turn: Math.PI * 0.7,
          elevation: 2,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: 1.8,
          },
        });
        return () => {
          intro.kill();
        };
      });
    let drag = false,
      lastX = 0,
      rotation = -0.1,
      frame = 0,
      visible = true;
    const down = (e: PointerEvent) => {
        drag = true;
        lastX = e.clientX;
        container.setPointerCapture(e.pointerId);
      },
      move = (e: PointerEvent) => {
        if (drag) {
          rotation += (e.clientX - lastX) * 0.008;
          lastX = e.clientX;
        }
      },
      up = () => {
        drag = false;
      };
    container.addEventListener("pointerdown", down);
    container.addEventListener("pointermove", move);
    container.addEventListener("pointerup", up);
    container.addEventListener("pointercancel", up);
    const resize = new ResizeObserver(() => {
      const w = container.clientWidth,
        h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    resize.observe(container);
    const visibility = new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
    });
    visibility.observe(container);
    const startTime = performance.now(),
      target = new THREE.Vector3(0, 0.2, 0),
      perspective = new THREE.Vector3(-6.8, 4.4, 7.6),
      top = new THREE.Vector3(-0.8, 10, 0.01);
    function animate() {
      frame = requestAnimationFrame(animate);
      if (!visible || document.hidden) return;
      car.rotation.y = THREE.MathUtils.lerp(
        car.rotation.y,
        rotation +
          orbit.entry +
          orbit.turn +
          (reduced || drag
            ? 0
            : Math.sin((performance.now() - startTime) * 0.00028) * 0.065),
        0.065,
      );
      perspective.y = 4.4 + orbit.elevation;
      camera.position.lerp(
        cameraView.current === "top" ? top : perspective,
        reduced ? 1 : 0.045,
      );
      camera.lookAt(target);
      renderer.render(scene, camera);
    }
    animate();
    return () => {
      cancelAnimationFrame(frame);
      mm.revert();
      motionQuery.removeEventListener("change", updatePreference);
      resize.disconnect();
      visibility.disconnect();
      container.removeEventListener("pointerdown", down);
      container.removeEventListener("pointermove", move);
      container.removeEventListener("pointerup", up);
      container.removeEventListener("pointercancel", up);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach(
            (m) => {
              if ("map" in m) (m.map as THREE.Texture | null)?.dispose();
              m.dispose();
            },
          );
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [motion]);
  return (
    <div className="car-canvas" ref={host}>
      <div className="car-fallback" role="status">
        <b>DY–01</b>
        <p>Precision is a mindset.</p>
        <small>3D preview requires WebGL.</small>
      </div>
    </div>
  );
}
