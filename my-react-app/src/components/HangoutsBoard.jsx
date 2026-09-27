import { useEffect, useState } from 'react'
import { ArrowIcon, CloseIcon } from './Icons'
import { sortHangouts, createHangoutId } from '../lib/hangouts'
import './HangoutsBoard.css'

const EMPTY_HANGOUT = { title: '', location: '', description: '', startsAt: '', endsAt: '' }
const MAX_LOCATION_RESULTS = 14
const POPULAR_LOCATION_ORDER = [
  'building-vbl10407',
  'building-vbl10080',
  'building-vbl10125',
  'building-vbl10248',
  'building-vbl10071',
  'building-vbl10154',
  'building-vbl10065',
  'building-vbl10161',
]

function getLocationMatchRank(location, query) {
  const name = location.name.toLocaleLowerCase()
  const aliases = (location.aliases || []).map((alias) => alias.toLocaleLowerCase())
  if (name === query) return 0
  if (name.startsWith(query)) return 1
  if (name.includes(query)) return 2
  if (aliases.some((alias) => alias.startsWith(query))) return 3
  if (aliases.some((alias) => alias.includes(query))) return 4
  return 5
}

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
  const [campusLocations, setCampusLocations] = useState([])
  const [locationsLoading, setLocationsLoading] = useState(false)
  const [locationLoadError, setLocationLoadError] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [locationOpen, setLocationOpen] = useState(false)
  const [activeLocationIndex, setActiveLocationIndex] = useState(-1)
  const selectedLocation = campusLocations.find((location) => location.id === draft.location)
  const normalizedLocationQuery = locationQuery.trim().toLocaleLowerCase()
  const matchingLocations = normalizedLocationQuery
    ? campusLocations.filter((building) => {
      const searchableText = [building.name, building.description, building.kind, ...(building.aliases || [])].join(' ').toLocaleLowerCase()
      return searchableText.includes(normalizedLocationQuery)
    }).sort((first, second) => {
      const rankDifference = getLocationMatchRank(first, normalizedLocationQuery) - getLocationMatchRank(second, normalizedLocationQuery)
      return rankDifference || first.name.localeCompare(second.name)
    })
    : campusLocations
      .filter((building) => building.featured)
      .sort((first, second) => POPULAR_LOCATION_ORDER.indexOf(first.id) - POPULAR_LOCATION_ORDER.indexOf(second.id))
  const locationOptions = matchingLocations.slice(0, MAX_LOCATION_RESULTS)

  useEffect(() => {
    if (!composerOpen || campusLocations.length) return undefined
    let active = true
    setLocationsLoading(true)
    setLocationLoadError('')
    import('../data/ubcLocations')
      .then(({ UBC_LOCATIONS }) => {
        if (active) setCampusLocations(UBC_LOCATIONS)
      })
      .catch(() => {
        if (active) setLocationLoadError('Campus locations could not be loaded. Close and reopen the form to try again.')
      })
      .finally(() => {
        if (active) setLocationsLoading(false)
      })
    return () => {
      active = false
    }
  }, [composerOpen, campusLocations.length])

  function update(field, value) {
    setDraft((previous) => ({ ...previous, [field]: value }))
    setError('')
  }

  function chooseLocation(location) {
    setDraft((previous) => ({ ...previous, location: location.id }))
    setLocationQuery(location.name)
    setLocationOpen(false)
    setActiveLocationIndex(-1)
    setError('')
  }

  function handleLocationKeyDown(event) {
    if (event.key === 'Escape') {
      setLocationOpen(false)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setLocationOpen(true)
      setActiveLocationIndex((index) => Math.min(index + 1, locationOptions.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveLocationIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && locationOpen && locationOptions[activeLocationIndex]) {
      event.preventDefault()
      chooseLocation(locationOptions[activeLocationIndex])
    }
  }

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    if (!selectedLocation) {
      setError('Choose a location from the UBC campus list.')
      setLocationOpen(true)
      return
    }
    const startTime = Date.parse(draft.startsAt)
    const endTime = Date.parse(draft.endsAt)
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
      setError('Choose valid start and end times. The end must be after the start.')
      return
    }
    setSaving(true)
    setError('')
    const hangout = {
      id: createHangoutId(),
      title: draft.title.trim(),
      location: selectedLocation.name,
      displayLocation: selectedLocation.name + ', UBC',
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      description: draft.description.trim(),
      startsAt: draft.startsAt,
      endsAt: draft.endsAt,
      author: { name: author.name || author.username || 'UBC student', username: author.username || '', nationality: author.nationality || '' },
    }
    try {
      await onAdd(hangout)
    } catch (submitError) {
      setError(submitError.message || 'Unable to save this hangout.')
      setSaving(false)
      return
    }
    setDraft(EMPTY_HANGOUT)
    setLocationQuery('')
    setLocationOpen(false)
    setComposerOpen(false)
    setSaving(false)
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
            <div className="hangout-form-location">
              <label htmlFor="hangout-location-search">Location</label>
              <div className="hangout-location-picker">
                <input
                  id="hangout-location-search"
                  type="search"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={locationOpen}
                  aria-controls="ubc-location-options"
                  aria-activedescendant={locationOpen && activeLocationIndex >= 0 ? `ubc-location-option-${locationOptions[activeLocationIndex]?.id}` : undefined}
                  aria-invalid={Boolean(error && !selectedLocation)}
                  required
                  value={locationQuery}
                  onFocus={() => setLocationOpen(true)}
                  onBlur={() => setLocationOpen(false)}
                  onKeyDown={handleLocationKeyDown}
                  onChange={(event) => {
                    setLocationQuery(event.target.value)
                    setDraft((previous) => ({ ...previous, location: '' }))
                    setLocationOpen(true)
                    setActiveLocationIndex(-1)
                    setError('')
                  }}
                  placeholder="Search UBC buildings, cafes, parks, and more"
                  autoComplete="off"
                />
                {locationOpen && (
                  <ul id="ubc-location-options" className="hangout-location-options" role="listbox" aria-label="UBC campus locations">
                    <li className="hangout-location-hint" role="presentation">
                      {locationsLoading ? 'Loading campus locations...' : locationLoadError || (normalizedLocationQuery
                        ? matchingLocations.length > MAX_LOCATION_RESULTS
                          ? `Showing ${MAX_LOCATION_RESULTS} of ${matchingLocations.length} matches · keep typing to narrow down`
                          : `${matchingLocations.length} matching ${matchingLocations.length === 1 ? 'location' : 'locations'}`
                        : `Popular campus spots · search all ${campusLocations.length} locations`)}
                    </li>
                    {locationsLoading ? <li className="hangout-location-empty" role="status">Loading campus locations...</li> : locationOptions.length ? locationOptions.map((location, index) => (
                      <li key={location.id} role="presentation">
                        <button
                          id={`ubc-location-option-${location.id}`}
                          type="button"
                          role="option"
                          aria-selected={selectedLocation?.id === location.id || activeLocationIndex === index}
                          className={activeLocationIndex === index ? 'is-active' : ''}
                          onMouseDown={(clickEvent) => clickEvent.preventDefault()}
                          onClick={() => chooseLocation(location)}
                        >
                          <span>{location.name}</span><small>{location.description} · {location.kind}</small>
                        </button>
                      </li>
                    )) : <li className="hangout-location-empty" role="option" aria-disabled="true">No matching UBC locations</li>}
                  </ul>
                )}
              </div>
              {selectedLocation && <p className="hangout-location-confirmation">Map pin will use the saved coordinates for {selectedLocation.name}.</p>}
            </div>
            <div className="hangout-time-fields">
              <label><span>Starts</span><input required type="datetime-local" value={draft.startsAt} onChange={(event) => update('startsAt', event.target.value)} /></label>
              <label><span>Ends</span><input required type="datetime-local" min={draft.startsAt || undefined} value={draft.endsAt} onChange={(event) => update('endsAt', event.target.value)} /></label>
            </div>
            <label><span>Details <small>Optional</small></span><textarea rows="3" maxLength={500} value={draft.description} onChange={(event) => update('description', event.target.value)} placeholder="Add a little context for people joining." /></label>
            {error && <p className="hangout-form-error" role="alert">{error}</p>}
            <p className="hangout-privacy-note">Choose a campus location from the list to use its saved coordinates. Posts are saved to the campus events database.</p>
            <button type="submit" className="hangout-submit-button" disabled={saving}>{saving ? 'Saving hangout…' : 'Post and pin hangout'}{!saving && <ArrowIcon />}</button>
          </form>
        </section>
      )}

      <div className="hangouts-list-heading"><div><h3>Coming up</h3><p>Friendly plans to join around UBC.</p></div><span>{events.length}</span></div>
      <div className="hangouts-card-list">
        {sortHangouts(events).map((event) => <HangoutCard key={event.id} event={event} onShowOnMap={onShowOnMap} onRemove={event.id.startsWith('demo-') || event.author?.username !== author.username ? undefined : async (id) => {
          try { await onRemove(id) } catch (removeError) { setError(removeError.message || 'Unable to remove this hangout.') }
        }} />)}
      </div>
      <p className="hangouts-demo-note">Hangouts are saved to the campus events database. RSVPs are currently saved only in this browser.</p>
    </div>
  )
}
