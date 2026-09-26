import test from 'node:test'
import assert from 'node:assert/strict'
import { PROFILE_COLORS } from '../data/profileOptions.js'
import { getThemeStyle } from './theme.js'

function luminance(hex) {
  const values = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

test('all 30 profile colors preserve the selected accent and readable button text', () => {
  assert.equal(PROFILE_COLORS.length, 30)
  for (const color of PROFILE_COLORS) {
    const theme = getThemeStyle(color.value)
    assert.equal(theme['--theme-accent'], color.value.toLowerCase())
    assert.ok(contrast(theme['--theme-accent'], theme['--theme-on-accent']) >= 4.5, `${color.name} button`)
    assert.ok(contrast(theme['--theme-hover'], theme['--theme-on-hover']) >= 4.5, `${color.name} hover`)
  }
})

test('accent text and focus colors remain readable on every light theme surface', () => {
  for (const { name, value } of PROFILE_COLORS) {
    const theme = getThemeStyle(value)
    for (const background of ['#ffffff', theme['--theme-soft'], theme['--theme-canvas']]) {
      assert.ok(contrast(theme['--theme-text'], background) >= 4.5, `${name} text on ${background}`)
      assert.ok(contrast(theme['--theme-focus'], background) >= 3, `${name} focus on ${background}`)
    }
  }
})

test('unselected and invalid colors produce neutral gray variables', () => {
  const neutral = getThemeStyle('')
  for (const invalid of [undefined, null, '#fff', 'red', '#000000; color: red', {}, '#GGGGGG']) {
    assert.deepEqual(getThemeStyle(invalid), neutral)
  }
  for (const value of Object.values(neutral)) {
    assert.equal(value.slice(1, 3), value.slice(3, 5))
    assert.equal(value.slice(3, 5), value.slice(5, 7))
  }
})

test('very light and dark colors also receive readable foregrounds', () => {
  for (const color of ['#ffffff', '#000000', '#777777', '#ffff00']) {
    const theme = getThemeStyle(color)
    assert.ok(contrast(theme['--theme-accent'], theme['--theme-on-accent']) >= 4.5)
    assert.ok(contrast(theme['--theme-hover'], theme['--theme-on-hover']) >= 4.5)
  }
})
