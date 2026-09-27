import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowIcon, BuddyMark, CloseIcon, EditIcon } from '../components/Icons'
import ProfileAvatar from '../components/ProfileAvatar'
import ProfileSocials from '../components/ProfileSocials'
import CountryFlag from '../components/CountryFlag'
import { BookmarkIcon, SearchIcon, FilterIcon, SparkIcon } from '../components/DiscoveryIcons'
import { activeFilterChoices, readSavedBuddies, removeFilterChoice, saveBuddies, savedBuddiesStorageKey, SAVED_BUDDIES_EVENT } from '../lib/discovery'
import countries from '../data/countries.json'
import ubcOptions from '../data/ubcOptions.json'
import { LANGUAGES, PROFILE_COLORS } from '../data/profileOptions'
import { emptyBuddyFilters, getBuddyMatches, getFilteredBuddies, getSharedProfileTraits } from '../lib/buddies'
import { HOBBIES, SPORTS } from '../lib/profile'
import CampusMap from '../components/CampusMap'
import HangoutsBoard, { HangoutCard } from '../components/HangoutsBoard'
import { sortHangouts } from '../lib/hangouts'
import './MainPage.css'

function normalizeBackendUser(user) {
  const parseArray = (value) => {
    if (Array.isArray(value)) return value
    if (typeof value !== 'string') return []
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return {
    id: user.id,
    name: user.name || 'Unknown user',
    username: user.username || `user_${user.id}`,
    nationality: user.nationality || '',
    gender: 'prefer-not-to',
    avatar: user.avatar || (user.avatar_url ? { type: 'photo', value: `http://localhost:5000${user.avatar_url}` } : null),
    university: user.university || 'University of British Columbia',
    residence: user.residence || 'Not selected',
    year: Number(user.year) || 1,
    major: user.major || 'Not selected',
    hobbies: parseArray(user.hobbies),
    sports: parseArray(user.sports),
    languages: parseArray(user.languages),
    socialMedia: parseArray(user.socialMedia),
    favoriteColor: '#2563eb',
    bio: 'Profile loaded from the backend.',
  }
}

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

function BuddyCard({ buddy, category, onView, saved, onSave, showScore = false }) {
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
      <button className="view-buddy" onClick={() => onView(buddy)}>Meet {buddy.name.split(' ')[0]} <ArrowIcon /></button>
    </article>
  )
}
function BuddyColumn({ title, category, description, matches, profile, onView, savedIds, onSave }) {
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
        {visible.map((buddy) => <BuddyCard key={buddy.id} buddy={buddy} category={category} onView={onView} saved={savedIds.includes(buddy.id)} onSave={onSave} />)}
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
            <button type="submit" className="filter-submit">Show buddies <ArrowIcon /></button>
          </div>
        </form>
      </div>
    </dialog>
  )
}

function BuddyResults({ matches, savedIds, onSave, onView, isSaved, onReset, onDiscover, hasCriteria }) {
  return (
    <section className="buddy-filter-results" aria-labelledby="filtered-buddies-title">
      <div className="discovery-heading">
        <div><h2 id="filtered-buddies-title">{isSaved ? 'Your saved buddies' : 'People to get to know'}</h2><p>{isSaved ? 'A few familiar faces to come back to.' : 'A little common ground. A good place to start.'}</p></div>
        <span className="results-count" role="status">{matches.length} {matches.length === 1 ? 'person' : 'people'}</span>
      </div>
      <div className="buddy-results-grid">
        {matches.map((buddy) => <BuddyCard key={buddy.id} buddy={buddy} category="filtered" onView={onView} saved={savedIds.includes(buddy.id)} onSave={onSave} showScore />)}
        {!matches.length && <div className="buddy-filter-empty"><div className="empty-state-icon">{isSaved ? <BookmarkIcon /> : <SearchIcon />}</div><h3>{isSaved && !savedIds.length ? 'Keep a good connection in mind.' : 'No matches just yet.'}</h3><p>{isSaved && !savedIds.length ? 'Tap the bookmark on a profile to find it here later.' : 'Try different filters, or give them a little more room.'}</p><button className="filter-edit-button" onClick={hasCriteria ? onReset : onDiscover}>{hasCriteria ? 'Reset filters' : 'Discover buddies'}<ArrowIcon /></button></div>}
      </div>
      {isSaved && matches.length > 0 && <p className="saved-note">Saved in this browser for your profile.</p>}
    </section>
  )
}

function SavedBuddies({ profile, filters, sort, onSave, onView, onReset, onDiscover, hasCriteria }) {
  const [storedBuddies, setStoredBuddies] = useState(() => readSavedBuddies(profile))

  useEffect(() => {
    const storageKey = savedBuddiesStorageKey(profile)
    const refresh = (event) => {
      if (event.type === 'storage') {
        if (event.key !== null && event.key !== storageKey) return
      } else if (event.detail?.key !== storageKey) {
        return
      }
      setStoredBuddies(readSavedBuddies(profile))
    }
    window.addEventListener('storage', refresh)
    window.addEventListener(SAVED_BUDDIES_EVENT, refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener(SAVED_BUDDIES_EVENT, refresh)
    }
  }, [profile, profile.id, profile.username])

  const savedIds = storedBuddies.map((buddy) => buddy.id)
  const matches = getFilteredBuddies(profile, filters, storedBuddies)
  if (sort === 'name') matches.sort((a, b) => a.name.localeCompare(b.name))
  return <BuddyResults matches={matches} savedIds={savedIds} onSave={onSave} onView={onView} isSaved onReset={onReset} onDiscover={onDiscover} hasCriteria={hasCriteria} />
}

function ProfilePanel({ profile, onEdit }) {
  const colorName = PROFILE_COLORS.find((color) => color.value.toLowerCase() === profile.favoriteColor.toLowerCase())?.name || 'Your color'
  return (
    <aside className="profile-panel" aria-labelledby="your-profile-title">
      <p className="panel-eyebrow" id="your-profile-title">Your profile</p>
      <div className="profile-panel-identity">
        <ProfileAvatar profile={profile} size="large" />
        <h2>{profile.name || 'Your name'}</h2>
        <p>@{profile.username || 'username'}</p>
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
        <p className="buddy-dialog-handle">@{buddy.username}</p>
        <div className="profile-country"><CountryFlag code={buddy.nationality} /><span>{countryName(buddy.nationality)}</span></div>
        <p className="buddy-bio">{buddy.bio}</p>
        <dl className="buddy-dialog-details"><div><dt>Studies</dt><dd>{buddy.major} &middot; {yearName(buddy.year)}</dd></div><div><dt>Residence</dt><dd>{buddy.residence}</dd></div><div><dt>Languages</dt><dd>{buddy.languages.join(', ')}</dd></div>{genderName(buddy.gender) && <div><dt>Gender</dt><dd>{genderName(buddy.gender)}</dd></div>}</dl>
        <div className="buddy-all-interests"><h3>Outside the classroom</h3><Tags values={[...buddy.sports, ...buddy.hobbies]} /></div>
        <ProfileSocials accounts={buddy.socialMedia} />
        <div className="buddy-shared"><h3>You have in common</h3><Tags values={[...new Set(shared)]} empty="A new perspective to share." /></div>
        <p className="sample-profile-note">Sample profile for this preview. Messaging is not available yet.</p>
        <div className="buddy-dialog-actions"><SaveBuddyButton buddy={buddy} saved={saved} onSave={onSave} full /><button className="dashboard-secondary" onClick={onClose}>Back to buddies</button></div>
      </div>
    </dialog>
  )
}

const filterLabel = ({ field, value }) => field === 'nationality' ? countryName(value) : field === 'year' ? yearName(value) : value

const WORKSPACE_SECTIONS = [
  { id: 'map', label: 'Campus map' },
  { id: 'buddies', label: 'Find buddies' },
  { id: 'hangouts', label: 'Campus Hangouts' },
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
    </aside>
  )
}

export default function MainPage({ profile, onEdit, registerNavigate }) {
  const [section, setSection] = useState('map')
  const [userHangouts, setUserHangouts] = useState([])
  const [goingIds, setGoingIds] = useState(() => new Set())
  const [selectedHangoutId, setSelectedHangoutId] = useState(null)

  useEffect(() => {
    registerNavigate?.((nextSection) => setSection(nextSection))
    return () => registerNavigate?.(null)
  }, [registerNavigate])
  const [selectedBuddy, setSelectedBuddy] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState(emptyBuddyFilters)
  const [appliedFilters, setAppliedFilters] = useState(emptyBuddyFilters)
  const [view, setView] = useState('discover')
  const [sort, setSort] = useState('common')
  const [savedBuddies, setSavedBuddies] = useState(() => readSavedBuddies(profile))
  const [feedback, setFeedback] = useState('')
  const [backendUsers, setBackendUsers] = useState([])
  const titleRef = useRef(null)
  const feedbackTimer = useRef(null)
  const hangouts = sortHangouts(userHangouts)
  const savedIds = useMemo(() => savedBuddies.map((buddy) => buddy.id), [savedBuddies])
  const savedCount = savedBuddies.length

  useEffect(() => {
    fetch('http://localhost:5000/api/users')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load users from the backend.')
        }
        return response.json()
      })
      .then((users) => setBackendUsers(Array.isArray(users) ? users : []))
      .catch((error) => {
        console.error('Failed to load users:', error)
        setBackendUsers([])
      })
  }, [])

  useEffect(() => {
    let active = true
    fetch('http://localhost:5000/api/events')
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load campus hangouts.')
        return response.json()
      })
      .then(async (events) => {
        const loadedEvents = Array.isArray(events) ? await Promise.all(events.map(async (event) => {
          const response = await fetch(`http://localhost:5000/api/events/${encodeURIComponent(event.id)}/attendees`)
          const attendees = response.ok ? await response.json() : []
          return {
          ...event,
          attendees: Array.isArray(attendees) ? attendees : [],
          latitude: Number.isFinite(Number(event.latitude)) && event.latitude !== null ? Number(event.latitude) : 49.2606,
          longitude: Number.isFinite(Number(event.longitude)) && event.longitude !== null ? Number(event.longitude) : -123.246,
          }
        })) : []
        if (active) setUserHangouts(loadedEvents)
      })
      .catch((error) => {
        console.error('Failed to load events:', error)
        if (active) showFeedback('Campus hangouts could not be loaded. Check the backend connection.')
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    fetch(`http://localhost:5000/api/events/rsvps?username=${encodeURIComponent(profile.username)}`)
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load event registrations.')
        return response.json()
      })
      .then(({ eventIds }) => { if (active) setGoingIds(new Set(Array.isArray(eventIds) ? eventIds : [])) })
      .catch((error) => console.error('Failed to load event registrations:', error))
    return () => { active = false }
  }, [profile.username])

  const buddies = useMemo(() => backendUsers.map(normalizeBackendUser), [backendUsers])
  const matches = getBuddyMatches(profile, buddies)
  const filteredBuddies = getFilteredBuddies(profile, appliedFilters, view === 'saved' ? savedBuddies : buddies)
  const choices = activeFilterChoices(appliedFilters)
  const hasCriteria = choices.length > 0
  const previewCount = filteredBuddies.length
  const showColumns = view === 'discover' && !hasCriteria
  const filterOptions = {
    nationality: [...countries].sort((a, b) => a.name.localeCompare(b.name, 'en')),
    major: [...new Set([...ubcOptions.majors.map(({ name }) => name), ...buddies.map((buddy) => buddy.major), profile.major])].filter(Boolean).sort((a, b) => a.localeCompare(b, 'en')),
    residence: [...new Set([...ubcOptions.residences.map(({ name }) => name), ...buddies.map((buddy) => buddy.residence), 'Off campus / commuting', profile.residence])].filter(Boolean).sort((a, b) => a.localeCompare(b, 'en')),
  }

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true })
    return () => window.clearTimeout(feedbackTimer.current)
  }, [])

  useEffect(() => {
    const storageKey = savedBuddiesStorageKey(profile)
    const syncFromStorage = (event) => {
      if (event.type === 'storage') {
        if (event.key !== null && event.key !== storageKey) return
      } else if (event.detail?.key !== storageKey) {
        return
      }
      setSavedBuddies(readSavedBuddies(profile))
    }
    window.addEventListener('storage', syncFromStorage)
    window.addEventListener(SAVED_BUDDIES_EVENT, syncFromStorage)
    return () => {
      window.removeEventListener('storage', syncFromStorage)
      window.removeEventListener(SAVED_BUDDIES_EVENT, syncFromStorage)
    }
  }, [profile, profile.id, profile.username])

  function toggleSave(buddy) {
    const alreadySaved = savedBuddies.some((savedBuddy) => savedBuddy.id === buddy.id)
    const next = alreadySaved
      ? savedBuddies.filter((savedBuddy) => savedBuddy.id !== buddy.id)
      : [...savedBuddies, buddy]
    setSavedBuddies(next)
    const stored = saveBuddies(profile, next)
    showFeedback(`${buddy.name.split(' ')[0]} ${alreadySaved ? 'removed from saved buddies' : 'saved for later'}.${stored ? '' : ' This change will last until you leave the page.'}`)
  }

  function showFeedback(message) {
    setFeedback(message)
    window.clearTimeout(feedbackTimer.current)
    feedbackTimer.current = window.setTimeout(() => setFeedback(''), 4000)
  }

  function selectHangout(eventId) {
    setSelectedHangoutId(eventId)
    setSection('map')
  }

  function viewAttendee(person) {
    const buddy = buddies.find((item) => item.username.toLowerCase() === String(person.username || '').toLowerCase())
    if (buddy) setSelectedBuddy(buddy)
    else setSelectedBuddy(normalizeBackendUser(person))
  }

  async function toggleGoing(event) {
    const wasGoing = goingIds.has(event.id)
    const response = await fetch(`http://localhost:5000/api/events/${encodeURIComponent(event.id)}/rsvp`, {
      method: wasGoing ? 'DELETE' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: profile.username }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      if (wasGoing && response.status === 404) {
        setGoingIds((previous) => { const next = new Set(previous); next.delete(event.id); return next })
      }
      showFeedback(payload.error || 'Unable to update your event registration.')
      return
    }
    setGoingIds((previous) => {
      const next = new Set(previous)
      if (wasGoing) next.delete(event.id)
      else next.add(event.id)
      return next
    })
    fetch(`http://localhost:5000/api/events/${encodeURIComponent(event.id)}/attendees`)
      .then((attendeeResponse) => attendeeResponse.ok ? attendeeResponse.json() : [])
      .then((attendees) => setUserHangouts((previous) => previous.map((item) => item.id === event.id ? { ...item, attendees: Array.isArray(attendees) ? attendees : [] } : item)))
      .catch((error) => console.error('Failed to refresh event attendees:', error))
    showFeedback(wasGoing ? 'Your event registration was canceled.' : 'You’re on the guest list.')
  }

  async function addHangout(event) {
    const response = await fetch('http://localhost:5000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || !payload.event) throw new Error(payload.error || 'Unable to save this hangout.')
    const savedEvent = payload.event
    setUserHangouts((previous) => [...previous, savedEvent])
    setSelectedHangoutId(savedEvent.id)
    setSection('map')
    showFeedback('Hangout saved to campus events.')
  }

  async function removeHangout(eventId) {
    const response = await fetch(`http://localhost:5000/api/events/${encodeURIComponent(eventId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: profile.username }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.error || 'Unable to remove this hangout.')
    setUserHangouts((previous) => previous.filter((event) => event.id !== eventId))
    setGoingIds((previous) => {
      const next = new Set(previous)
      next.delete(eventId)
      return next
    })
    showFeedback('Your hangout was removed.')
  }

  function findBuddy() {
    setDraftFilters({ ...appliedFilters })
    setFilterOpen(true)
  }

  function clearFilters() {
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
                <div className="campus-map-frame"><CampusMap events={hangouts} goingIds={goingIds} selectedEventId={selectedHangoutId} onSelectEvent={setSelectedHangoutId} onGoing={toggleGoing} onViewAttendee={viewAttendee} /><p className="map-demo-caption">Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>.</p></div>
                <aside className="map-coming-up" aria-labelledby="coming-up-title">
                  <div className="map-coming-up-heading"><div><p className="eyebrow">ON CAMPUS</p><h3 id="coming-up-title">Coming up</h3></div><span>{hangouts.length}</span></div>
                  <p className="map-coming-up-caption">Choose a plan to open its map pin.</p>
                  <div className="map-coming-up-list">{hangouts.slice(0, 4).map((event) => <HangoutCard key={event.id} event={event} compact onShowOnMap={selectHangout} onViewAttendee={viewAttendee} />)}</div>
                  <button type="button" className="map-all-hangouts" onClick={() => setSection('hangouts')}>Explore all hangouts <ArrowIcon /></button>
                </aside>
              </div>
            </section>
          )}

          {section === 'buddies' && (
            <section className="workspace-page buddies-workspace" aria-labelledby="buddies-page-title">
              <header className="workspace-page-header">
                <div><p className="eyebrow">A LITTLE COMMON GROUND</p><h2 id="buddies-page-title" ref={titleRef} tabIndex={-1}>Find buddies</h2><p>Meet someone who shares a piece of your campus life.</p></div>
              </header>
              <div className="discovery-toolbar">
                <nav className="discovery-tabs" aria-label="Browse buddies">
                  {[['discover', 'For you'], ['all', 'Everyone'], ['saved', 'Saved']].map(([value, label]) => <button key={value} className={view === value ? 'is-active' : ''} aria-current={view === value ? 'page' : undefined} onClick={() => chooseView(value)}>{value === 'saved' && <BookmarkIcon filled={view === value} />}{label}{value === 'saved' && <span>{savedCount}</span>}</button>)}
                </nav>
                <div className="discovery-tools">
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
                {view === 'saved' ? <SavedBuddies profile={profile} filters={appliedFilters} sort={sort} onSave={toggleSave} onView={setSelectedBuddy} onReset={clearFilters} onDiscover={() => chooseView('discover')} hasCriteria={hasCriteria} /> : showColumns ? <section className="buddy-discovery" aria-labelledby="discovery-title">
                  <div className="discovery-heading"><div><h2 id="discovery-title">A few things in common</h2><p>Start with something familiar. Discover someone new.</p></div><span className="curated-mark"><SparkIcon />Picked for you</span></div>
                  <div className="buddy-columns">
                    <BuddyColumn title="Nationality" category="nationality" description={`A little closer to ${countryName(profile.nationality)}.`} matches={matches.nationality} profile={profile} onView={setSelectedBuddy} savedIds={savedIds} onSave={toggleSave} />
                    <BuddyColumn title="Sport" category="sports" description="A teammate for your next game." matches={matches.sports} profile={profile} onView={setSelectedBuddy} savedIds={savedIds} onSave={toggleSave} />
                    <BuddyColumn title="Hobbies" category="hobbies" description="Good company for your favorite things." matches={matches.hobbies} profile={profile} onView={setSelectedBuddy} savedIds={savedIds} onSave={toggleSave} />
                  </div>
                </section> : <BuddyResults matches={filteredBuddies} savedIds={savedIds} onSave={toggleSave} onView={setSelectedBuddy} hasCriteria={hasCriteria} onReset={clearFilters} onDiscover={() => chooseView('discover')} />}
                <ProfilePanel profile={profile} onEdit={onEdit} />
              </div>
            </section>
          )}

          {section === 'hangouts' && <section className="workspace-page"><HangoutsBoard events={hangouts} author={profile} onAdd={addHangout} onRemove={removeHangout} onShowOnMap={selectHangout} onViewAttendee={viewAttendee} /></section>}

          {section === 'profile' && <section className="workspace-page profile-standalone" aria-labelledby="my-profile-title"><header className="workspace-page-header"><div><p className="eyebrow">YOUR DETAILS</p><h2 id="my-profile-title" ref={titleRef} tabIndex={-1}>My profile</h2><p>Review the details you share with your community.</p></div></header><ProfilePanel profile={profile} onEdit={onEdit} /></section>}
        </div>
      </div>
      <div className={`buddy-toast${feedback ? ' is-visible' : ''}`} role="status">{feedback}</div>
      <BuddyFilterDialog open={filterOpen} filters={draftFilters} options={filterOptions} resultCount={previewCount} onChange={setDraftFilters} onClose={() => setFilterOpen(false)} onReset={() => setDraftFilters(emptyBuddyFilters())} onApply={() => { setAppliedFilters(draftFilters); if (view !== 'saved') setView('all'); setFilterOpen(false) }} />
      {selectedBuddy && <BuddyDialog key={selectedBuddy.id} buddy={selectedBuddy} profile={profile} saved={savedIds.includes(selectedBuddy.id)} onSave={toggleSave} onClose={() => setSelectedBuddy(null)} />}
    </main>
  )
}
