export function orientationTilt(
  current: { beta: number; gamma: number },
  baseline: { beta: number; gamma: number },
  screenAngle: number,
): { x: number; y: number } {
  const delta = (value: number, origin: number) => ((value - origin + 540) % 360) - 180;
  const clamp = (value: number) => Math.max(-16, Math.min(16, value));
  const vertical = delta(current.beta, baseline.beta) * .45;
  const horizontal = delta(current.gamma, baseline.gamma) * .55;
  const radians = screenAngle * Math.PI / 180;
  return {
    x: clamp(-vertical * Math.cos(radians) + horizontal * Math.sin(radians)),
    y: clamp(horizontal * Math.cos(radians) + vertical * Math.sin(radians)),
  };
}
