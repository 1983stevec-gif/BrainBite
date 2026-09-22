import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.js';
import { createWorldProfileDecor, getWorldProfile, listWorldProfiles, validateWorldProfile } from '../presentation/world-profiles.mjs';
import { disposeObject } from '../presentation/props.mjs';

test('world profiles are valid, deterministic, and isolated copies', () => {
  const first = getWorldProfile('bubble-reef');
  const second = getWorldProfile('bubble-reef');
  assert.equal(validateWorldProfile(first).valid, true);
  assert.deepEqual(first, second);
  first.palette.sky = 0;
  assert.notEqual(getWorldProfile('bubble-reef').palette.sky, 0);
  assert.deepEqual(listWorldProfiles().map(profile => profile.id), ['jungle-circuit', 'bubble-reef']);
});

test('invalid world profiles are rejected without affecting the registry', () => {
  const result = validateWorldProfile({ id: '', palette: { sky: 'blue' }, lighting: {}, decor: 'unknown' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 5);
  assert.equal(validateWorldProfile({
    ...getWorldProfile(),
    id: 'unknown-world',
  }).valid, false);
  assert.equal(validateWorldProfile({
    ...getWorldProfile(),
    name: '   ',
  }).valid, false);
  assert.equal(validateWorldProfile({
    ...getWorldProfile(),
    version: 999,
  }).valid, false);
  assert.equal(validateWorldProfile(getWorldProfile()).valid, true);
});

test('Bubble Reef decor is reusable and disposable', () => {
  const decor = createWorldProfileDecor(THREE, 'bubble-reef');
  assert.equal(decor.userData.worldProfile, 'bubble-reef');
  assert.equal(decor.children.length, 8);
  const empty = createWorldProfileDecor(THREE, 'jungle-circuit');
  assert.equal(empty.children.length, 0);
  disposeObject(decor);
  disposeObject(empty);
  assert.equal(decor.parent, null);
});
