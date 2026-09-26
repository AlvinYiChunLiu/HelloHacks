import { SMILEY_OPTIONS } from '../data/avatarOptions.js'

export const MAX_AVATAR_DATA_URL_LENGTH = 300 * 1024
const smileyIds = new Set(SMILEY_OPTIONS.map(({ value }) => value))

function validRasterDataUrl(value) {
  if (typeof value !== 'string' || value.length > MAX_AVATAR_DATA_URL_LENGTH) return false
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match || match[2].length % 4 !== 0) return false
  let bytes
  try {
    bytes = atob(match[2])
  } catch {
    return false
  }
  if (match[1] === 'png') {
    return bytes.startsWith('\x89PNG\r\n\x1a\n') && bytes.length >= 45
      && bytes.slice(12, 16) === 'IHDR' && bytes.slice(-8, -4) === 'IEND'
  }
  if (match[1] === 'jpeg') {
    return bytes.startsWith('\xff\xd8\xff') && bytes.endsWith('\xff\xd9') && bytes.length >= 20
  }
  return bytes.length >= 20 && bytes.startsWith('RIFF') && bytes.slice(8, 12) === 'WEBP'
}

// Avatar values are public presentation data only. Never accept arbitrary URLs,
// SVG markup, or large original files in a stored profile.
export function normalizeAvatar(avatar) {
  if (!avatar || typeof avatar !== 'object' || Array.isArray(avatar)) return null
  if (avatar.type === 'smiley' && smileyIds.has(avatar.value)) {
    return { type: 'smiley', value: avatar.value }
  }
  if (avatar.type === 'photo' && validRasterDataUrl(avatar.value)) {
    return { type: 'photo', value: avatar.value }
  }
  return null
}
