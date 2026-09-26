import { PROFILE_COLORS } from '../data/profileOptions'
import './ProfileColorPicker.css'

export default function ProfileColorPicker({ value, onChange, error }) {
  const selected = PROFILE_COLORS.find((color) => color.value === value)

  return (
    <fieldset className="profile-color-picker" aria-describedby={error ? 'favoriteColor-error' : 'favoriteColor-hint'}>
      <legend className="sr-only">Favorite color</legend>
      <div className="color-profile-preview">
        <div className="color-preview-avatar" style={{ borderColor: selected?.value || '#d4d4d4' }} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </div>
        <div><strong aria-live="polite">{selected ? `${selected.name} looks like you.` : 'A little color, a little you.'}</strong><p id="favoriteColor-hint">Your choice colors your pages and frames your profile picture.</p></div>
      </div>
      <div className="profile-color-grid">
        {PROFILE_COLORS.map(({ name, value: color }) => (
          <label key={color} className={`profile-color-choice${value === color ? ' is-selected' : ''}`}>
            <input type="radio" name="favoriteColor" value={color} checked={value === color} onChange={() => onChange(color)} aria-invalid={Boolean(error)} />
            <span className="profile-color-swatch" style={{ backgroundColor: color }} aria-hidden="true">{value === color && <span>✓</span>}</span>
            <span>{name}</span>
          </label>
        ))}
      </div>
      {error && <p className="field-error" id="favoriteColor-error">{error}</p>}
      <p className="color-choice-note">30 colors. Pick the one that feels like you.</p>
    </fieldset>
  )
}
