export type DiscoveryId =
  "spark" | "palette" | "card" | "monogram" | "keyboard" | "iteration";
export function discover(id: DiscoveryId, element?: HTMLElement) {
  const rect = element?.getBoundingClientRect();
  window.dispatchEvent(
    new CustomEvent("dy-discovery", {
      detail: {
        id,
        x: rect ? rect.left + rect.width / 2 : innerWidth / 2,
        y: rect ? rect.top + rect.height / 2 : innerHeight / 2,
      },
    }),
  );
}
