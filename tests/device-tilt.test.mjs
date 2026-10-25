import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orientationTilt } from '../src/lib/deviceTilt.ts';
const origin = { beta: 45, gamma: 0 };
test('calibrating at a comfortable holding angle starts at rest', () => {
  const result = orientationTilt(origin, origin, 0);
  assert.equal(Math.abs(result.x), 0); assert.equal(Math.abs(result.y), 0);
});
test('portrait movement follows tilt and is bounded', () => {
  assert.deepEqual(orientationTilt({beta: 65, gamma: 20}, origin, 0), {x: -9, y: 11});
  assert.deepEqual(orientationTilt({beta: 130, gamma: -80}, origin, 0), {x: -16, y: -16});
});
test('landscape remaps axes to the screen', () => {
  const result = orientationTilt({beta: 65, gamma: 20}, origin, 90);
  assert.ok(Math.abs(result.x - 11) < .0001); assert.ok(Math.abs(result.y - 9) < .0001);
});
test('crossing the orientation boundary does not jump', () => {
  const result = orientationTilt({beta: -179, gamma: 0}, {beta: 179, gamma: 0}, 0);
  assert.ok(Math.abs(result.x + .9) < .0001);
});
test('all screen rotations keep the sculpture within its safe movement range', () => {
  for (const angle of [0, 90, 180, 270]) {
    const result = orientationTilt({beta: -160, gamma: 89}, origin, angle);
    assert.ok(Math.abs(result.x) <= 16 && Math.abs(result.y) <= 16);
  }
});
