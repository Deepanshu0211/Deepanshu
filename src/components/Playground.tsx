// "use client";
// import { useEffect, useRef, useState } from "react";
// import { gsap } from "gsap";
// import { discover, type DiscoveryId } from "@/components/discoveries";
// const eggs: { id: DiscoveryId; name: string; hint: string; message: string }[] =
//   [
//     {
//       id: "spark",
//       name: "A spark of curiosity",
//       hint: "That little star beside my introduction looks tappable.",
//       message: "A tiny detail. A very good find. ✳",
//     },
//     {
//       id: "palette",
//       name: "A change of mood",
//       hint: "There’s more to the dot after my name.",
//       message: "Same person. A different shade of curious.",
//     },
//     {
//       id: "card",
//       name: "The other side",
//       hint: "A personal card always has two sides.",
//       message: "There’s always another side to the story.",
//     },
//     {
//       id: "monogram",
//       name: "A little spin",
//       hint: "My initials don’t have to sit still.",
//       message: "You gave DY a new perspective. ↗",
//     },
//     {
//       id: "keyboard",
//       name: "Curiosity is the password",
//       hint: "Type CURIOUS anywhere outside an input. On a phone, try the field below.",
//       message: "SECRET LAP UNLOCKED. Curiosity wins. 🏁",
//     },
//     {
//       id: "iteration",
//       name: "Never quite finished",
//       hint: "The footer has something to say about becoming.",
//       message: "One more iteration. That’s usually how it starts.",
//     },
//   ];
// export default function Playground({ motion }: { motion: boolean }) {
//   const [found, setFound] = useState<DiscoveryId[]>([]),
//     [toast, setToast] = useState(""),
//     [open, setOpen] = useState(false),
//     [code, setCode] = useState("");
//   const dialog = useRef<HTMLDialogElement>(null),
//     particles = useRef<HTMLDivElement>(null),
//     toastEl = useRef<HTMLDivElement>(null),
//     timer = useRef<ReturnType<typeof setTimeout> | null>(null);
//   useEffect(() => {
//     const receive = (event: Event) => {
//       const { id, x, y } = (
//         event as CustomEvent<{ id: DiscoveryId; x: number; y: number }>
//       ).detail;
//       const egg = eggs.find((e) => e.id === id);
//       if (!egg) return;
//       setFound((old) => (old.includes(id) ? old : [...old, id]));
//       setToast(egg.message);
//       if (timer.current) clearTimeout(timer.current);
//       timer.current = setTimeout(() => setToast(""), 3400);
//       if (motion && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
//         const bits = particles.current?.children;
//         if (bits) {
//           gsap.killTweensOf(bits);
//           gsap.set(bits, { x, y, opacity: 1, scale: 1, rotation: 0 });
//           gsap.to(bits, {
//             x: (i) =>
//               x + Math.cos((i * Math.PI * 2) / 24) * (70 + (i % 5) * 21),
//             y: (i) =>
//               y + Math.sin((i * Math.PI * 2) / 24) * (70 + (i % 5) * 21) + 75,
//             rotation: (i) => i * 39,
//             opacity: 0,
//             scale: 0.25,
//             duration: 1.25,
//             stagger: 0.008,
//             ease: "power3.out",
//           });
//         }
//         gsap.fromTo(
//           toastEl.current,
//           { y: 16, opacity: 0, scale: 0.96 },
//           { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" },
//         );
//       }
//     };
//     let buffer = "";
//     const key = (e: KeyboardEvent) => {
//       const target = e.target as HTMLElement;
//       if (
//         e.ctrlKey ||
//         e.metaKey ||
//         e.altKey ||
//         target.closest("input,textarea,[contenteditable=true]") ||
//         e.key.length !== 1
//       )
//         return;
//       buffer = (buffer + e.key.toLowerCase()).slice(-7);
//       if (buffer === "curious") {
//         discover("keyboard");
//         buffer = "";
//       }
//     };
//     window.addEventListener("dy-discovery", receive);
//     window.addEventListener("keydown", key);
//     const container = particles.current,
//       toastNode = toastEl.current;
//     return () => {
//       window.removeEventListener("dy-discovery", receive);
//       window.removeEventListener("keydown", key);
//       if (timer.current) clearTimeout(timer.current);
//       if (container) gsap.killTweensOf(container.children);
//       gsap.killTweensOf(toastNode);
//     };
//   }, [motion]);
//   useEffect(() => {
//     const lenis = (
//       window as unknown as {
//         __lenis?: { stop: () => void; start: () => void };
//       }
//     ).__lenis;
//     if (open) {
//       dialog.current?.showModal();
//       lenis?.stop();
//     } else {
//       dialog.current?.close();
//       lenis?.start();
//     }
//     return () => {
//       lenis?.start();
//     };
//   }, [open]);
//   return (
//     <>
//       <div ref={particles} className="discovery-particles" aria-hidden="true">
//         {Array.from({ length: 24 }, (_, i) => (
//           <i
//             key={i}
//             style={{
//               background:
//                 i % 3 === 0
//                   ? "var(--blue)"
//                   : i % 3 === 1
//                     ? "#c6cfb6"
//                     : "#f3ae77",
//               borderRadius: i % 2 ? "50%" : "1px",
//             }}
//           />
//         ))}
//       </div>
//       <div
//         ref={toastEl}
//         className={`discovery-toast ${toast ? "is-visible" : ""}`}
//         role="status"
//         aria-live="polite"
//       >
//         {toast}
//       </div>
//       <button
//         className="curiosity-toggle"
//         onClick={() => setOpen(true)}
//         aria-label={`Open curiosity collection, ${found.length} of 6 discovered`}
//       >
//         <span>✳</span> {found.length}/6{" "}
//         <span className="curiosity-label">STAY CURIOUS</span>
//       </button>
//       <dialog
//         ref={dialog}
//         className="curiosity-dialog"
//         aria-labelledby="curiosity-title"
//         onCancel={() => setOpen(false)}
//         onClick={(e) => {
//           if (e.target === dialog.current) setOpen(false);
//         }}
//       >
//         <div className="curiosity-content">
//           <button
//             className="curiosity-close"
//             onClick={() => setOpen(false)}
//             aria-label="Close curiosity collection"
//           >
//             ✕
//           </button>
//           <span className="section-id">A LITTLE REWARD FOR LOOKING CLOSER</span>
//           <h2 id="curiosity-title">
//             Stay <em>curious.</em>
//           </h2>
//           <p>Six small secrets. No prizes, just a bit of play.</p>
//           <div
//             className="collection-progress"
//             aria-label={`${found.length} of 6 discovered`}
//           >
//             <span style={{ width: `${(found.length / 6) * 100}%` }} />
//           </div>
//           <ol>
//             {eggs.map((egg) => (
//               <li
//                 key={egg.id}
//                 className={found.includes(egg.id) ? "discovered" : ""}
//               >
//                 <span>{found.includes(egg.id) ? "✓" : "?"}</span>
//                 <div>
//                   <strong>{egg.name}</strong>
//                   <p>{found.includes(egg.id) ? "DISCOVERED" : egg.hint}</p>
//                 </div>
//               </li>
//             ))}
//           </ol>
//           <form
//             onSubmit={(e) => {
//               e.preventDefault();
//               if (code.trim().toLowerCase() === "curious") {
//                 discover("keyboard");
//                 setCode("");
//               }
//             }}
//           >
//             <label htmlFor="secret-word">Found the secret word?</label>
//             <div>
//               <input
//                 id="secret-word"
//                 value={code}
//                 onChange={(e) => setCode(e.target.value)}
//                 placeholder="A seven-letter mindset"
//                 autoComplete="off"
//                 maxLength={20}
//               />
//               <button type="submit">TRY ↗</button>
//             </div>
//           </form>
//           {found.length === 6 && (
//             <p className="collection-complete">
//               6/6. You notice the details. I like that. ✳
//             </p>
//           )}
//         </div>
//       </dialog>
//     </>
//   );
// }
