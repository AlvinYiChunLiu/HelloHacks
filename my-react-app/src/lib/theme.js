const NEUTRAL_ACCENT = '#555555'
const WHITE = '#ffffff'

function channels(hex) {
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16))
}

function luminance(hex) {
  const [red, green, blue] = channels(hex).map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return red * 0.2126 + green * 0.7152 + blue * 0.0722
}

function contrast(first, second) {
  const a = luminance(first)
  const b = luminance(second)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

function mix(color, target, amount) {
  const from = channels(color)
  const to = channels(target)
  return `#${from.map((value, index) => Math.round(value + (to[index] - value) * amount).toString(16).padStart(2, '0')).join('')}`
}

function foreground(background) {
  if (contrast(WHITE, background) >= 4.5) return WHITE
  return contrast('#17202a', background) >= 4.5 ? '#17202a' : '#000000'
}

function readableAccent(color, backgrounds) {
  let result = color
  // Preserve the chosen hue while darkening text until all light surfaces are readable.
  for (let step = 0; step <= 100; step += 1) {
    result = mix(color, '#000000', step / 100)
    if (backgrounds.every((background) => contrast(result, background) >= 4.5)) break
  }
  return result
}

/** Scoped CSS variables for a selected profile color, or a fully gray first step. */
export function getThemeStyle(color) {
  const accent = typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)
    ? color.toLowerCase()
    : NEUTRAL_ACCENT
  const soft = mix(accent, WHITE, 0.91)
  const canvas = mix(accent, WHITE, 0.975)
  const hover = mix(accent, '#000000', 0.09)
  const text = readableAccent(accent, [WHITE, soft, canvas])

  return {
    '--theme-accent': accent,
    '--theme-on-accent': foreground(accent),
    '--theme-hover': hover,
    '--theme-on-hover': foreground(hover),
    '--theme-text': text,
    '--theme-focus': text,
    '--theme-soft': soft,
    '--theme-border': mix(accent, WHITE, 0.7),
    '--theme-canvas': canvas,
    '--theme-shadow': `${accent}18`,
  }
}
