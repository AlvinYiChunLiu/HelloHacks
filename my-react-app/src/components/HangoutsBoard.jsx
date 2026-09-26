import { useState } from 'react'
import { ArrowIcon, CloseIcon } from './Icons'
import { findHangoutLocation, sortHangouts, createHangoutId } from '../lib/hangouts'
import './HangoutsBoard.css'

const EMPTY_HANGOUT = { title: '', location: '', description: '', startsAt: '', endsAt: '' }

function flagEmoji(code) {
  return /^[A-Z]{2}$/.test(code || '') ? [...code].map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0))).join('') : '🌐'
}

function formatTime(value) {
  return new Date(value).toLocaleString('en', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function HangoutCard({ event, onShowOnMap, onRemove, compact = false }) {
  const date = new Date(event.startsAt)
  return (
    <article className={`hangout-card${compact ? ' hangout-card--compact' : ''}`}>
      <div className="hangout-date"><span>{date.toLocaleString('en', { month: 'short' })}</span><strong>{date.getDate()}</strong></div>
      <div className="hangout-card-main">
        <div className="hangout-card-author"><span aria-label={`${event.author?.nationality || 'World'} flag`}>{flagEmoji(event.author?.nationality)}</span><span>{event.author?.name || 'UBC student'}</span></div>
        <h3>{event.title}</h3>
        <p className="hangout-card-time">{formatTime(event.startsAt)} <span aria-hidden="true">·</span> {new Date(event.endsAt).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}</p>
        <p className="hangout-card-place">{event.displayLocation || event.location}</p>
        {!compact && event.description && <p className="hangout-card-description">{event.description}</p>}
        <button type="button" className="hangout-card-map-link" onClick={() => onShowOnMap(event.id)}>Show on map <ArrowIcon /></button>
      </div>
      {onRemove && <button type="button" className="hangout-card-remove" aria-label={`Remove ${event.title}`} onClick={() => onRemove(event.id)}><CloseIcon /></button>}
    </article>
  )
}

export default function HangoutsBoard({ events, author, onAdd, onRemove, onShowOnMap }) {
  const [composerOpen, setComposerOpen] = useState(false)
  const [draft, setDraft] = useState(EMPTY_HANGOUT)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function update(field, value) {
    setDraft((previous) => ({ ...previous, [field]: value }))
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    const start = Date.parse(draft.startsAt)
    const end = Date.parse(draft.endsAt)
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      setError('Choose valid start and end times. The end must be after the start.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const point = await findHangoutLocation(draft.location.trim())
      if (!point) {
        setError('We couldn’t find that place. Try a building or street address with “Vancouver, BC”.')
        return
      }
      onAdd({
        id: createHangoutId(),
        title: draft.title.trim(),
        location: draft.location.trim(),
        displayLocation: point.displayLocation,
        latitude: point.latitude,
        longitude: point.longitude,
        description: draft.description.trim(),
        startsAt: draft.startsAt,
        endsAt: draft.endsAt,
        author: { name: author.name || author.username || 'UBC student', nationality: author.nationality || '' },
      })
      setDraft(EMPTY_HANGOUT)
      setComposerOpen(false)
    } catch {
      setError('Location search is unavailable right now. Please try again shortly.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="hangouts-board">
      <header className="hangouts-board-heading">
        <div><p className="eyebrow">MEET AROUND CAMPUS</p><h2>Campus Hangouts</h2><p>Study, play, or grab a drink with someone new.</p></div>
        <button type="button" className="hangout-create-button" onClick={() => { setComposerOpen((open) => !open); setError('') }}>{composerOpen ? 'Close form' : '＋ Post a hangout'}</button>
      </header>

      {composerOpen && (
        <section className="hangout-composer" aria-labelledby="hangout-composer-title">
          <div className="hangout-composer-heading"><div><p className="eyebrow">INVITE SOMEONE ALONG</p><h3 id="hangout-composer-title">What are you planning?</h3></div><button type="button" aria-label="Close post form" onClick={() => setComposerOpen(false)}><CloseIcon /></button></div>
          <form onSubmit={submit} className="hangout-form">
            <label><span>Hangout name</span><input required maxLength={100} value={draft.title} onChange={(event) => update('title', event.target.value)} placeholder="e.g. Boba after class" /></label>
            <label><span>Location</span><input required maxLength={240} value={draft.location} onChange={(event) => update('location', event.target.value)} placeholder="Building or street, Vancouver, BC" autoComplete="street-address" /></label>
            <div className="hangout-time-fields">
              <label><span>Starts</span><input required type="datetime-local" value={draft.startsAt} onChange={(event) => update('startsAt', event.target.value)} /></label>
              <label><span>Ends</span><input required type="datetime-local" min={draft.startsAt || undefined} value={draft.endsAt} onChange={(event) => update('endsAt', event.target.value)} /></label>
            </div>
            <label><span>Details <small>Optional</small></span><textarea rows="3" maxLength={500} value={draft.description} onChange={(event) => update('description', event.target.value)} placeholder="Add a little context for people joining." /></label>
            {error && <p className="hangout-form-error" role="alert">{error}</p>}
            <p className="hangout-privacy-note">We look up the location only when you post. The address is sent to OpenStreetMap; the post is saved in this browser for the demo.</p>
            <button type="submit" className="hangout-submit-button" disabled={saving}>{saving ? 'Finding the place…' : 'Post and pin hangout'}{!saving && <ArrowIcon />}</button>
          </form>
        </section>
      )}

      <div className="hangouts-list-heading"><div><h3>Coming up</h3><p>Friendly plans to join around UBC.</p></div><span>{events.length}</span></div>
      <div className="hangouts-card-list">
        {sortHangouts(events).map((event) => <HangoutCard key={event.id} event={event} onShowOnMap={onShowOnMap} onRemove={event.id.startsWith('demo-') ? undefined : onRemove} />)}
      </div>
      <p className="hangouts-demo-note">Demo meetups are examples. Your RSVP and new posts stay in this browser; they aren’t sent to other students.</p>
    </div>
  )
}
