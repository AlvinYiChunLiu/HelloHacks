import assert from 'node:assert/strict'
import test from 'node:test'
import { SMILEY_OPTIONS } from '../data/avatarOptions.js'
import { MAX_AVATAR_DATA_URL_LENGTH, normalizeAvatar } from './avatar.js'

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='

test('exactly five unique expressions are accepted and copied without extra fields', () => {
  assert.equal(SMILEY_OPTIONS.length, 5)
  assert.equal(new Set(SMILEY_OPTIONS.map(({ value }) => value)).size, 5)
  for (const { value } of SMILEY_OPTIONS) {
    const source = { type: 'smiley', value, token: 'secret' }
    const normalized = normalizeAvatar(source)
    assert.deepEqual(normalized, { type: 'smiley', value })
    assert.notEqual(normalized, source)
  }
})

test('small raster data URLs retain their image while ignoring unrelated fields', () => {
  assert.deepEqual(normalizeAvatar({ type: 'photo', value: PNG, filename: 'private-filename.png' }), { type: 'photo', value: PNG })
})

test('remote images, SVGs, malformed base64 and mismatched image types are rejected', () => {
  for (const value of [
    'https://example.com/photo.png',
    'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    'data:image/png;base64,not+base64!',
    'data:image/png;base64,aGVsbG8=',
    PNG.replace('image/png', 'image/jpeg'),
    PNG + ' trailing text',
    null,
    {},
  ]) {
    assert.equal(normalizeAvatar({ type: 'photo', value }), null)
  }
})

test('oversized images and unknown avatar variants fall back to initials', () => {
  assert.equal(normalizeAvatar({ type: 'photo', value: `data:image/png;base64,${'A'.repeat(MAX_AVATAR_DATA_URL_LENGTH)}` }), null)
  for (const avatar of [null, undefined, [], 'smile', {}, { type: 'smiley', value: 'unknown' }, { type: 'html', value: '<svg />' }]) {
    assert.equal(normalizeAvatar(avatar), null)
  }
})