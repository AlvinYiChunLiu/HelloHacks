import { useEffect, useRef, useState } from 'react'
import { ArrowIcon, BuddyMark, CloseIcon, EditIcon } from '../components/Icons'
import ProfileAvatar from '../components/ProfileAvatar'
import ProfileSocials from '../components/ProfileSocials'
import CountryFlag from '../components/CountryFlag'
import CopyButton from '../components/CopyButton'
import { BookmarkIcon, SearchIcon, FilterIcon, SparkIcon } from '../components/DiscoveryIcons'
import { activeFilterChoices, conversationStarter, readSavedBuddies, removeFilterChoice, saveBuddies, searchBuddies } from '../lib/discovery'
import countries from '../data/countries.json'
import ubcOptions from '../data/ubcOptions.json'
import { PROFILE_COLORS } from '../data/profileOptions'
import { SAMPLE_BUDDIES } from '../data/sampleBuddies'
import { emptyBuddyFilters, getBuddyMatches, getFilteredBuddies, getSharedProfileTraits } from '../lib/buddies'
import { getAge, HOBBIES, SPORTS } from '../lib/profile'
import CampusMap from '../components/CampusMap'
import HangoutsBoard, { HangoutCard } from '../components/HangoutsBoard'
import { readHangouts, saveHangouts, sortHangouts } from '../lib/hangouts'
import { SAMPLE_HANGOUTS } from '../data/sampleHangouts'
import './MainPage.css'

const countryName = (code) => countries.find((country) => country.code === code)?.name || 'Not selected'
const yearName = (year) => ({ 1: '1st year', 2: '2nd year', 3: '3rd year', 4: '4th year', 5: '5th year', 6: '6th year' })[year] || 'Year not selected'
const genderName = (gender) => ({ male: 'Male', female: 'Female' })[gender]

function CategoryIcon({ category }) {
  return category === 'sports' ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M3 12h18M12 3v18M5.7 5.7c8.3 1.6 10.8 4.1 12.6 12.6M18.3 5.7C10 7.3 7.5 9.8 5.7 18.3" stroke="currentColor" strokeWidth="1.4" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
  )
}

function Tags({ values, empty = 'Not added yet', className = '' }) {
  return values?.length ? <div className={`dashboard-tags ${className}`}>{values.map((value) => <span key={value}>{value}</span>)}</div> : <span className="profile-empty">{empty}</span>
}

function SaveBuddyButton({ buddy, saved, onSave, full = false }) {
  return <button className={`save-buddy${saved ? ' is-saved' : ''}${full ? ' save-buddy--full' : ''}`} aria-label={`${saved ? 'Unsave' : 'Save'} ${buddy.name}`} aria-pressed={saved} onClick={() => onSave(buddy)}><BookmarkIcon filled={saved} />{full && <span>{saved ? 'Saved buddy' : 'Save buddy'}</span>}</button>
}

function buddyAffinity(buddy, category, shared) {
  if (category === 'nationality') return `Both from ${countryName(buddy.nationality)}`
  if (category === 'sports' && shared[0]) return `Both like ${shared[0]}`
  if (category === 'hobbies' && shared[0]) return `Both enjoy ${shared[0]}`
  const trait = buddy.shared?.find((item) => item.startsWith('Sport: '))
  if (trait) return `Both like ${trait.slice(7)}`
  const hobby = buddy.shared?.find((item) => item.startsWith('Hobby: '))
  if (hobby) return `Both enjoy ${hobby.slice(7)}`
  if (buddy.commonCount > 0) return `${buddy.commonCount} things in common`
  return 'A new perspective to discover'
}

function BuddyCard({ buddy, category, onView, saved, onSave, requested, onRequest, showScore = false }) {
  const shared = category === 'nationality' ? [countryName(buddy.nationality)] : (buddy.shared || [])
  return (
    <article className="buddy-card">
      <div className="buddy-card-heading">
        <ProfileAvatar profile={buddy} />
        <div><h4>{buddy.name}</h4><p>@{buddy.username}</p></div>
        <SaveBuddyButton buddy={buddy} saved={saved} onSave={onSave} />
      </div>
      <div className="buddy-location"><CountryFlag code={buddy.nationality} /><span>{countryName(buddy.nationality)}</span>{genderName(buddy.gender) && <span className="buddy-gender">{genderName(buddy.gender)}</span>}</div>
      <p className="buddy-major">{buddy.major}</p>
      <p className="buddy-campus">{yearName(buddy.year)} <span aria-hidden="true">&middot;</span> {buddy.residence}</p>
      {showScore && buddy.commonCount > 0 && <p className="buddy-common-count"><SparkIcon />{buddy.commonCount} {buddy.commonCount === 1 ? 'thing' : 'things'} in common</p>}
      <p className="buddy-affinity"><SparkIcon />{buddyAffinity(buddy, category, shared)}</p>
      <Tags values={shared.slice(0, 2)} className="shared-tags" empty="A new perspective to discover" />
      <ProfileSocials accounts={buddy.socialMedia} compact />
      <button type="button" className={`buddy-request-button${requested ? ' is-requested' : ''}`} onClick={() => onRequest(buddy)} aria-pressed={requested} disabled={requested}>
        <span aria-hidden="true">{requested ? '✓' : '👋'}</span>{requested ? 'Requested' : 'Say hi'}
      </button>
      <button className="view-buddy" onClick={() => onView(buddy)}>Meet {buddy.name.split(' ')[0]} <ArrowIcon /></button>
    </article>
  )
}
function BuddyColumn({ title, category, description, matches, profile, onView, savedIds, onSave, requestedIds, onRequest }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? matches : matches.slice(0, 3)
  const emptyMessage = category === 'nationality'
    ? `No buddies from ${countryName(profile.nationality)} yet.`
    : !profile[category]?.length
      ? `Add ${category} to your profile to see what you have in common.`
      : `No buddies share your ${category} yet.`
  return (
    <section className={`buddy-column buddy-column--${category}`} aria-labelledby={`${category}-title`}>
      <header className="buddy-column-header">
        <div className="category-icon">{category === 'nationality' ? <CountryFlag code={profile.nationality} /> : <CategoryIcon category={category} />}</div>
        <div className="column-title-line"><h3 id={`${category}-title`}>{title}</h3><span>{matches.length}</span></div>
        <p>{description}</p>
      </header>
      <div className="buddy-list">
        {visible.map((buddy) => <BuddyCard key={buddy.id} buddy={buddy} category={category} onView={onView} saved={savedIds.includes(buddy.id)} onSave={onSave} requested={requestedIds.has(buddy.id)} onRequest={onRequest} />)}
        {!matches.length && <div className="buddy-empty"><p>{emptyMessage}</p><a href="#/edit-profile">Edit profile <span aria-hidden="true">&rarr;</span></a></div>}
      </div>
      {matches.length > 3 && <button className="column-more" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Show fewer' : `See all ${matches.length} buddies`}</button>}
    </section>
  )
}

function FilterPills({ selectedSports, selectedHobbies, onSportsChange, onHobbiesChange }) {
  function group(title, options, selected, onChange) {
    return (
      <div className="filter-pill-group">
        <p>{title}</p>
        <div className="filter-pill-list">
          {options.map((option) => {
            const active = selected.includes(option)
            return <button key={option} type="button" className={active ? 'is-selected' : ''} aria-pressed={active} onClick={() => onChange(active ? selected.filter((item) => item !== option) : [...selected, option])}>{option}</button>
          })}
        </div>
      </div>
    )
  }

  return (
    <fieldset className="buddy-filter-pills">
      <legend>Hobbies &amp; sports <span>Choose any</span></legend>
      {group('Sports', SPORTS, selectedSports, onSportsChange)}
      {group('Hobbies', HOBBIES, selectedHobbies, onHobbiesChange)}
    </fieldset>
  )
}

function BuddyFilterDialog({ open, filters, options, onChange, onClose, onReset, onApply, resultCount }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function setField(field, value) {
    onChange((previous) => ({ ...previous, [field]: value }))
  }

  return (
    <dialog ref={dialogRef} className="buddy-dialog buddy-filter-dialog" aria-labelledby="buddy-filter-title" onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="buddy-filter-content">
        <button className="buddy-dialog-close" aria-label="Close buddy filters" onClick={onClose}><CloseIcon /></button>
        <p className="eyebrow">Find your people</p>
        <h2 id="buddy-filter-title">Who would you like to meet?</h2>
        <p className="buddy-filter-description">Start with what matters to you. Choose any options within a section, then combine sections to narrow your search.</p>
        <form onSubmit={(event) => { event.preventDefault(); onApply() }}>
          <div className="buddy-filter-select-grid">
            <label className="buddy-filter-select"><span>Nationality</span><select value={filters.nationality} onChange={(event) => setField('nationality', event.target.value)}><option value="">Any nationality</option>{options.nationality.map(({ code, name }) => <option key={code} value={code}>{name}</option>)}</select></label>
            <label className="buddy-filter-select"><span>Faculty / major</span><select value={filters.major} onChange={(event) => setField('major', event.target.value)}><option value="">Any faculty or major</option>{options.major.map((major) => <option key={major} value={major}>{major}</option>)}</select></label>
            <label className="buddy-filter-select"><span>Year of study</span><select value={filters.year} onChange={(event) => setField('year', event.target.value)}><option value="">Any year</option>{[1, 2, 3, 4, 5, 6].map((year) => <option key={year} value={year}>{yearName(year)}</option>)}</select></label>
          </div>
          <FilterPills selectedSports={filters.sports} selectedHobbies={filters.hobbies} onSportsChange={(value) => setField('sports', value)} onHobbiesChange={(value) => setField('hobbies', value)} />
          <div className="buddy-filter-actions">
            <button type="button" className="dashboard-secondary" onClick={onReset}>Clear choices</button>
            <button type="submit" className="filter-submit">Show {resultCount} {resultCount === 1 ? 'buddy' : 'buddies'} <ArrowIcon /></button>
          </div>
        </form>
      </div>
    </dialog>
  )
}

function BuddyResults({ matches, savedIds, onSave, onView, requestedIds, onRequest, isSaved, onReset, onDiscover, hasCriteria }) {
  return (
    <section className="buddy-filter-results" aria-labelledby="filtered-buddies-title">
      <div className="discovery-heading">
        <div><h2 id="filtered-buddies-title">{isSaved ? 'Your saved buddies' : 'People to get to know'}</h2><p>{isSaved ? 'A few familiar faces to come back to.' : 'A little common ground. A good place to start.'}</p></div>
        <span className="results-count" role="status">{matches.length} {matches.length === 1 ? 'person' : 'people'}</span>
      </div>
      <div className="buddy-results-grid">
        {matches.map((buddy) => <BuddyCard key={buddy.id} buddy={buddy} category="filtered" onView={onView} saved={savedIds.includes(buddy.id)} onSave={onSave} requested={requestedIds.has(buddy.id)} onRequest={onRequest} showScore />)}
        {!matches.length && <div className="buddy-filter-empty"><div className="empty-state-icon">{isSaved ? <BookmarkIcon /> : <SearchIcon />}</div><h3>{isSaved && !savedIds.length ? 'Keep a good connection in mind.' : 'No matches just yet.'}</h3><p>{isSaved && !savedIds.length ? 'Tap the bookmark on a profile to find it here later.' : 'Try a different search or give your filters a little more room.'}</p><button className="filter-edit-button" onClick={hasCriteria ? onReset : onDiscover}>{hasCriteria ? 'Reset search and filters' : 'Discover buddies'}<ArrowIcon /></button></div>}
      </div>
      {isSaved && matches.length > 0 && <p className="saved-note">Saved in this browser tab for your profile.</p>}
    </section>
  )
}
function ProfilePanel({ profile, onEdit }) {
  const age = getAge(profile.birthday)
  const colorName = PROFILE_COLORS.find((color) => color.value.toLowerCase() === profile.favoriteColor.toLowerCase())?.name || 'Your color'
  return (
    <aside className="profile-panel" aria-labelledby="your-profile-title">
      <p className="panel-eyebrow" id="your-profile-title">Your profile</p>
      <div className="profile-panel-identity">
        <ProfileAvatar profile={profile} size="large" />
        <h2>{profile.name || 'Your name'}</h2>
        <p>@{profile.username || 'username'}{age !== null && <span> &middot; {age} years old</span>}</p>
        <div className="profile-country"><CountryFlag code={profile.nationality} /><span>{countryName(profile.nationality)}</span></div>
      </div>
      <button className="edit-profile-button" onClick={onEdit}><EditIcon />Edit profile</button>
      <div className="profile-details">
        <p className="profile-university">{profile.university || 'University not selected'}</p>
        <dl>
          <div><dt>Residence</dt><dd>{profile.residence || 'Not selected'}</dd></div>
          <div><dt>Year</dt><dd>{yearName(profile.year)}</dd></div>
          <div><dt>Major</dt><dd>{profile.major || 'Not selected'}</dd></div>
          {genderName(profile.gender) && <div><dt>Gender</dt><dd>{genderName(profile.gender)}</dd></div>}
          <div><dt>Languages</dt><dd>{profile.languages?.join(', ') || 'Not added'}</dd></div>
          <div><dt>Profile color</dt><dd className="profile-color-detail"><span style={{ background: profile.favoriteColor }} aria-hidden="true" />{colorName}</dd></div>
        </dl>
      </div>
      <div className="profile-interests"><h3>Sports</h3><Tags values={profile.sports} /><h3>Hobbies</h3><Tags values={profile.hobbies} /></div>
      <ProfileSocials accounts={profile.socialMedia} />
      <p className="profile-session-note">Profile edits are saved for this browser session.</p>
    </aside>
  )
}

function BuddyDialog({ buddy, profile, onClose, saved, onSave }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  const shared = getSharedProfileTraits(profile, buddy)
  return (
    <dialog ref={dialogRef} className="buddy-dialog" aria-labelledby="buddy-dialog-title" onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="buddy-dialog-content">
        <button className="buddy-dialog-close" aria-label="Close buddy profile" onClick={onClose}><CloseIcon /></button>
        <p className="eyebrow">{shared.length ? 'A little common ground' : 'Meet a new face'}</p>
        <ProfileAvatar profile={buddy} size="large" />
        <h2 id="buddy-dialog-title">{buddy.name}</h2>
        <p className="buddy-dialog-handle">@{buddy.username} <span aria-hidden="true">&middot;</span> {getAge(buddy.birthday)} years old</p>
        <div className="profile-country"><CountryFlag code={buddy.nationality} /><span>{countryName(buddy.nationality)}</span></div>
        <p className="buddy-bio">{buddy.bio}</p>
        <dl className="buddy-dialog-details"><div><dt>Studies</dt><dd>{buddy.major} &middot; {yearName(buddy.year)}</dd></div><div><dt>Residence</dt><dd>{buddy.residence}</dd></div><div><dt>Languages</dt><dd>{buddy.languages.join(', ')}</dd></div>{genderName(buddy.gender) && <div><dt>Gender</dt><dd>{genderName(buddy.gender)}</dd></div>}</dl>
        <div className="buddy-all-interests"><h3>Outside the classroom</h3><Tags values={[...buddy.sports, ...buddy.hobbies]} /></div>
        <ProfileSocials accounts={buddy.socialMedia} />
        <div className="buddy-shared"><h3>You have in common</h3><Tags values={[...new Set(shared)]} empty="A new perspective to share." /></div>
        <div className="icebreaker"><div><SparkIcon /><h3>Break the ice</h3></div><p>{conversationStarter(profile, buddy)}</p><CopyButton text={conversationStarter(profile, buddy)} label="Copy conversation starter" /></div>
        <p className="sample-profile-note">Sample profile for this preview. Messaging is not available yet.</p>
        <div className="buddy-dialog-actions"><SaveBuddyButton buddy={buddy} saved={saved} onSave={onSave} full /><button className="dashboard-secondary" onClick={onClose}>Back to buddies</button></div>
      </div>
    </dialog>
  )
}

const countryNames = Object.fromEntries(countries.map(({ code, name }) => [code, name]))
const filterLabel = ({ field, value }) => field === 'nationality' ? countryName(value) : field === 'year' ? yearName(value) : value

const WORKSPACE_SECTIONS = [
  { id: 'map', label: 'Campus map' },
  { id: 'buddies', label: 'Find buddies' },
  { id: 'hangouts', label: 'Campus Hangouts' },
  { id: 'profile', label: 'My profile' },
]

function WorkspaceIcon({ section }) {
  const shapes = {
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15m6-12v15" /></>,
    buddies: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-1.5A5.5 5.5 0 0 1 9 13h.5m3-2.5a3 3 0 1 0 0-5.9M15 14a5 5 0 0 1 5 5v1" /></>,
    hangouts: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18m-13 5h3m-3 3h7" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" /></>,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[section]}</svg>
}

function WorkspaceSidebar({ section, onNavigate, hangoutCount }) {
  return (
    <aside className="workspace-sidebar" aria-label="Main sections">
      <p className="workspace-sidebar-label">YOUR SPACE</p>
      <nav className="workspace-nav">
        {WORKSPACE_SECTIONS.map((item) => (
          <button key={item.id} type="button" className={section === item.id ? 'is-active' : ''} aria-current={section === item.id ? 'page' : undefined} onClick={() => onNavigate(item.id)}>
            <WorkspaceIcon section={item.id} /><span>{item.label}</span>
            {item.id === 'hangouts' && <span className="workspace-nav-count">{hangoutCount}</span>}
          </button>
        ))}
      </nav>
      <div className="workspace-sidebar-note"><span aria-hidden="true">✦</span><p>Good things start with a hello.</p></div>
    </aside>
  )
}

export default function MainPage({ profile, onEdit }) {
  const [section, setSection] = useState('map')
  const [userHangouts, setUserHangouts] = useState(readHangouts)
  const [goingIds, setGoingIds] = useState(() => new Set())
  const [selectedHangoutId, setSelectedHangoutId] = useState(null)
  const [requestedIds, setRequestedIds] = useState(() => new Set())
  const [selectedBuddy, setSelectedBuddy] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState(emptyBuddyFilters)
  const [appliedFilters, setAppliedFilters] = useState(emptyBuddyFilters)
  const [view, setView] = useState('discover')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('common')
  const [savedIds, setSavedIds] = useState(() => readSavedBuddies(profile))
  const [feedback, setFeedback] = useState('')
  const titleRef = useRef(null)
  const feedbackTimer = useRef(null)
  const hangouts = sortHangouts([...SAMPLE_HANGOUTS, ...userHangouts])
  const matches = getBuddyMatches(profile)
  const choices = activeFilterChoices(appliedFilters)
  const ranked = getFilteredBuddies(profile, appliedFilters)
  const filteredBuddies = searchBuddies(ranked, query, countryNames).filter((buddy) => view !== 'saved' || savedIds.includes(buddy.id))
  if (sort === 'name') filteredBuddies.sort((a, b) => a.name.localeCompare(b.name))
  const savedCount = SAMPLE_BUDDIES.filter((buddy) => savedIds.includes(buddy.id)).length
  const hasCriteria = choices.length > 0 || query.trim().length > 0
  const showColumns = view === 'discover' && !hasCriteria && sort === 'common'
  const previewCount = searchBuddies(getFilteredBuddies(profile, draftFilters), query, countryNames).filter((buddy) => view !== 'saved' || savedIds.includes(buddy.id)).length
  const filterOptions = {
    nationality: [...countries].sort((a, b) => a.name.localeCompare(b.name, 'en')),
    major: [...new Set([...ubcOptions.majors.map(({ name }) => name), ...SAMPLE_BUDDIES.map((buddy) => buddy.major), profile.major])].filter(Boolean).sort(),
  }

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true })
    return () => window.clearTimeout(feedbackTimer.current)
  }, [])

  function toggleSave(buddy) {
    const alreadySaved = savedIds.includes(buddy.id)
    const next = alreadySaved ? savedIds.filter((id) => id !== buddy.id) : [...savedIds, buddy.id]
    setSavedIds(next)
    const stored = saveBuddies(profile, next)
    showFeedback(`${buddy.name.split(' ')[0]} ${alreadySaved ? 'removed from saved buddies' : 'saved for later'}.${stored ? '' : ' This change will last until you leave the page.'}`)
  }

  function showFeedback(message) {
    setFeedback(message)
    window.clearTimeout(feedbackTimer.current)
    feedbackTimer.current = window.setTimeout(() => setFeedback(''), 4000)
  }

  function requestBuddy(buddy) {
    if (requestedIds.has(buddy.id)) return
    setRequestedIds((previous) => new Set(previous).add(buddy.id))
    showFeedback(`Demo request noted for ${buddy.name.split(' ')[0]}. No message was sent.`)
  }

  function selectHangout(eventId) {
    setSelectedHangoutId(eventId)
    setSection('map')
  }

  function markGoing(event) {
    if (goingIds.has(event.id)) return
    setGoingIds((previous) => new Set(previous).add(event.id))
    showFeedback('You’re on the demo guest list. Nothing was sent.')
  }

  function addHangout(event) {
    const nextHangouts = [...userHangouts, event]
    const saved = saveHangouts(nextHangouts)
    setUserHangouts(nextHangouts)
    setSelectedHangoutId(event.id)
    setSection('map')
    showFeedback(saved ? 'Hangout pinned and saved in this browser.' : 'Hangout pinned for this visit. Browser storage is unavailable.')
  }

  function removeHangout(eventId) {
    const nextHangouts = userHangouts.filter((event) => event.id !== eventId)
    saveHangouts(nextHangouts)
    setUserHangouts(nextHangouts)
    setGoingIds((previous) => {
      const next = new Set(previous)
      next.delete(eventId)
      return next
    })
    showFeedback('Your hangout was removed from this browser.')
  }

  function findBuddy() {
    setDraftFilters({ ...appliedFilters })
    setFilterOpen(true)
  }

  function clearFilters() {
    setQuery('')
    setAppliedFilters(emptyBuddyFilters())
    setDraftFilters(emptyBuddyFilters())
  }

  function chooseView(nextView) {
    setView(nextView)
    clearFilters()
    setSort('common')
  }

  function quickFilter(field, value) {
    setAppliedFilters({ ...emptyBuddyFilters(), [field]: value })
    setView('all')
    setQuery('')
  }

  return (
    <main className="dashboard" id="main-content">
      <div className="workspace-shell">
        <WorkspaceSidebar section={section} onNavigate={setSection} hangoutCount={hangouts.length} />
        <div className="workspace-content">
          {section === 'map' && (
            <section className="workspace-page" aria-labelledby="campus-map-title">
              <header className="workspace-page-header">
                <div><p className="eyebrow">UBC VANCOUVER</p><h2 id="campus-map-title" ref={titleRef} tabIndex={-1}>Campus map</h2><p>Find a study partner, pickup game, or coffee plan nearby.</p></div>
                <button type="button" className="workspace-primary-button" onClick={() => setSection('hangouts')}><span aria-hidden="true">＋</span> Post a hangout</button>
              </header>
              <div className="campus-map-layout">
                <div className="campus-map-frame"><CampusMap events={hangouts} goingIds={goingIds} selectedEventId={selectedHangoutId} onSelectEvent={setSelectedHangoutId} onGoing={markGoing} /><p className="map-demo-caption">Demo meetups and locally posted hangouts. Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>.</p></div>
                <aside className="map-coming-up" aria-labelledby="coming-up-title">
                  <div className="map-coming-up-heading"><div><p className="eyebrow">ON CAMPUS</p><h3 id="coming-up-title">Coming up</h3></div><span>{hangouts.length}</span></div>
                  <p className="map-coming-up-caption">Choose a plan to open its map pin.</p>
                  <div className="map-coming-up-list">{hangouts.slice(0, 4).map((event) => <HangoutCard key={event.id} event={event} compact onShowOnMap={selectHangout} />)}</div>
                  <button type="button" className="map-all-hangouts" onClick={() => setSection('hangouts')}>Explore all hangouts <ArrowIcon /></button>
                  <p className="map-rsvp-note">RSVPs are demo-only and stay in this browser.</p>
                </aside>
              </div>
            </section>
          )}

          {section === 'buddies' && (
            <section className="workspace-page buddies-workspace" aria-labelledby="buddies-page-title">
              <header className="workspace-page-header">
                <div><p className="eyebrow">A LITTLE COMMON GROUND</p><h2 id="buddies-page-title" ref={titleRef} tabIndex={-1}>Find buddies</h2><p>Meet someone who shares a piece of your campus life.</p></div>
                <button type="button" className="workspace-primary-button" onClick={findBuddy}><FilterIcon /> Choose filters</button>
              </header>
              <div className="discovery-toolbar">
                <nav className="discovery-tabs" aria-label="Browse buddies">
                  {[['discover', 'For you'], ['all', 'Everyone'], ['saved', 'Saved']].map(([value, label]) => <button key={value} className={view === value ? 'is-active' : ''} aria-current={view === value ? 'page' : undefined} onClick={() => chooseView(value)}>{value === 'saved' && <BookmarkIcon filled={view === value} />}{label}{value === 'saved' && <span>{savedCount}</span>}</button>)}
                </nav>
                <div className="discovery-tools">
                  <div className="buddy-search"><SearchIcon /><label className="sr-only" htmlFor="buddy-search">Search names, countries, majors, or interests</label><input id="buddy-search" type="search" placeholder="Name, country, interest..." value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><CloseIcon /></button>}</div>
                  <button className={`open-filters${choices.length ? ' has-filters' : ''}`} onClick={findBuddy}><FilterIcon /><span>Filters</span>{choices.length > 0 && <span className="filter-count">{choices.length}</span>}</button>
                </div>
              </div>
              <div className="discovery-options">
                <div className="quick-filters">
                  {!hasCriteria && view === 'discover' ? <><span>Quick matches</span>{profile.nationality && <button onClick={() => quickFilter('nationality', profile.nationality)}>Same nationality</button>}{profile.major && <button onClick={() => quickFilter('major', profile.major)}>Same major</button>}{profile.sports?.[0] && <button onClick={() => quickFilter('sports', [profile.sports[0]])}>Both like {profile.sports[0]}</button>}</> : <><span role="status">{filteredBuddies.length} {filteredBuddies.length === 1 ? 'person' : 'people'} to explore</span>{choices.map((choice) => <button key={`${choice.field}-${choice.value}`} onClick={() => setAppliedFilters(removeFilterChoice(appliedFilters, choice.field, choice.value))} aria-label={`Remove ${filterLabel(choice)} filter`}>{filterLabel(choice)}<CloseIcon /></button>)}{choices.length > 0 && <span className="active-filter-pill">{choices.length} {choices.length === 1 ? 'filter' : 'filters'} active</span>}{hasCriteria && <button className="clear-discovery" onClick={clearFilters}>Reset</button>}</>}
                </div>
                <label className="buddy-sort"><span className="sr-only">Sort buddies</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="common">Most in common</option><option value="name">Name: A to Z</option></select></label>
              </div>
              <div className="buddy-content-grid">
                {showColumns ? <section className="buddy-discovery" aria-labelledby="discovery-title">
                  <div className="discovery-heading"><div><h2 id="discovery-title">A few things in common</h2><p>Start with something familiar. Discover someone new.</p></div><span className="curated-mark"><SparkIcon />Picked for you</span></div>
                  <div className="buddy-columns">
                    <BuddyColumn title="Nationality" category="nationality" description={`A little closer to ${countryName(profile.nationality)}.`} matches={matches.nationality} profile={profile} onView={setSelectedBuddy} savedIds={savedIds} onSave={toggleSave} requestedIds={requestedIds} onRequest={requestBuddy} />
                    <BuddyColumn title="Sport" category="sports" description="A teammate for your next game." matches={matches.sports} profile={profile} onView={setSelectedBuddy} savedIds={savedIds} onSave={toggleSave} requestedIds={requestedIds} onRequest={requestBuddy} />
                    <BuddyColumn title="Hobbies" category="hobbies" description="Good company for your favorite things." matches={matches.hobbies} profile={profile} onView={setSelectedBuddy} savedIds={savedIds} onSave={toggleSave} requestedIds={requestedIds} onRequest={requestBuddy} />
                  </div>
                </section> : <BuddyResults matches={filteredBuddies} savedIds={savedIds} onSave={toggleSave} onView={setSelectedBuddy} requestedIds={requestedIds} onRequest={requestBuddy} isSaved={view === 'saved'} hasCriteria={hasCriteria} onReset={clearFilters} onDiscover={() => chooseView('discover')} />}
                <ProfilePanel profile={profile} onEdit={onEdit} />
              </div>
            </section>
          )}

          {section === 'hangouts' && <section className="workspace-page"><HangoutsBoard events={hangouts} author={profile} onAdd={addHangout} onRemove={removeHangout} onShowOnMap={selectHangout} /></section>}

          {section === 'profile' && <section className="workspace-page profile-standalone" aria-labelledby="my-profile-title"><header className="workspace-page-header"><div><p className="eyebrow">YOUR DETAILS</p><h2 id="my-profile-title" ref={titleRef} tabIndex={-1}>My profile</h2><p>Review the details you share with your community.</p></div></header><ProfilePanel profile={profile} onEdit={onEdit} /></section>}
        </div>
      </div>
      <div className={`buddy-toast${feedback ? ' is-visible' : ''}`} role="status">{feedback}</div>
      <BuddyFilterDialog open={filterOpen} filters={draftFilters} options={filterOptions} resultCount={previewCount} onChange={setDraftFilters} onClose={() => setFilterOpen(false)} onReset={() => setDraftFilters(emptyBuddyFilters())} onApply={() => { setAppliedFilters(draftFilters); if (view !== 'saved') setView('all'); setFilterOpen(false) }} />
      {selectedBuddy && <BuddyDialog key={selectedBuddy.id} buddy={selectedBuddy} profile={profile} saved={savedIds.includes(selectedBuddy.id)} onSave={toggleSave} onClose={() => setSelectedBuddy(null)} />}
    </main>
  )
}
