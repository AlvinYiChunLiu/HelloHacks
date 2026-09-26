import { useEffect, useId, useRef, useState } from 'react'
import { SMILEY_OPTIONS } from '../data/avatarOptions.js'
import { normalizeAvatar } from '../lib/avatar.js'
import ProfileAvatar from './ProfileAvatar'
import SmileyFace from './SmileyFace'
import './ProfilePicturePicker.css'

async function preparePhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP image.')
  }
  if (file.size > 8 * 1024 * 1024) throw new Error('Choose an image smaller than 8 MB.')
  const imageUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise((resolve, reject) => {
      const picture = new Image()
      picture.onload = () => resolve(picture)
      picture.onerror = () => reject(new Error('This image could not be opened. Try another file.'))
      picture.src = imageUrl
    })
    const { naturalWidth: width, naturalHeight: height } = image
    if (!width || !height || width * height > 40000000 || Math.max(width, height) > 16384) {
      throw new Error('Choose a smaller image, up to 40 megapixels.')
    }
    const cropSize = Math.min(width, height)
    const canvas = document.createElement('canvas')
    canvas.width = Math.min(256, cropSize)
    canvas.height = canvas.width
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Image editing is unavailable in this browser. You can choose a smiley instead.')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, (width - cropSize) / 2, (height - cropSize) / 2, cropSize, cropSize, 0, 0, canvas.width, canvas.height)
    const avatar = normalizeAvatar({ type: 'photo', value: canvas.toDataURL('image/jpeg', 0.85) })
    if (!avatar) throw new Error('This image could not be prepared. Try a smaller file.')
    return avatar
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

export default function ProfilePicturePicker({ value, onChange, profileName, color }) {
  const [error, setError] = useState('')
  const [isPreparing, setIsPreparing] = useState(false)
  const requestRef = useRef(0)
  const id = useId()
  const avatar = normalizeAvatar(value)

  useEffect(() => () => { requestRef.current += 1 }, [])

  function chooseAvatar(nextAvatar) {
    requestRef.current += 1
    setIsPreparing(false)
    setError('')
    onChange(nextAvatar)
  }

  async function choosePhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const requestId = ++requestRef.current
    setError('')
    setIsPreparing(true)
    try {
      const photo = await preparePhoto(file)
      if (requestId === requestRef.current) onChange(photo)
    } catch (cause) {
      if (requestId === requestRef.current) setError(cause.message || 'This image could not be opened.')
    } finally {
      if (requestId === requestRef.current) setIsPreparing(false)
    }
  }

  return (
    <fieldset className="profile-picture-picker" aria-describedby={`${id}-hint`}>
      <legend>Profile picture <span>(optional)</span></legend>
      <div className="profile-picture-preview">
        <ProfileAvatar profile={{ name: profileName, favoriteColor: color, avatar }} size="large" />
        <div className="profile-picture-actions">
          <label className="picture-upload-button">
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} aria-label="Choose a profile photo from your files" aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`} />
            {avatar?.type === 'photo' ? 'Change photo' : 'Choose a photo'}
          </label>
          {avatar && <button type="button" className="picture-remove-button" onClick={() => chooseAvatar(null)}>Remove picture</button>}
          <p id={`${id}-hint`}>JPG, PNG, or WebP, up to 8 MB. Photos are cropped to a square.</p>
        </div>
      </div>
      <p className="smiley-picker-label" id={`${id}-smileys`}>Or choose a smiley</p>
      <div className="smiley-options" role="group" aria-labelledby={`${id}-smileys`}>
        {SMILEY_OPTIONS.map(({ value: expression, label }) => (
          <button key={expression} type="button" className={`smiley-option${avatar?.type === 'smiley' && avatar.value === expression ? ' is-selected' : ''}`} aria-label={`${label} smiley`} aria-pressed={avatar?.type === 'smiley' && avatar.value === expression} onClick={() => chooseAvatar({ type: 'smiley', value: expression })}>
            <SmileyFace expression={expression} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <p className="picture-status" role="status">{isPreparing ? 'Preparing your photo...' : ''}</p>
      {error && <p className="field-error" id={`${id}-error`} role="alert">{error}</p>}
    </fieldset>
  )
}