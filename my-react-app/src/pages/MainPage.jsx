import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowIcon, BuddyMark, CloseIcon, EditIcon } from '../components/Icons'
import ProfileAvatar from '../components/ProfileAvatar'
import ProfileSocials from '../components/ProfileSocials'
import CountryFlag from '../components/CountryFlag'
import CopyButton from '../components/CopyButton'
import { BookmarkIcon, SearchIcon, FilterIcon, SparkIcon } from '../components/DiscoveryIcons'
import { activeFilterChoices, conversationStarter, readSavedBuddies, removeFilterChoice, saveBuddies, searchBuddies } from '../lib/discovery'
import countries from '../data/countries.json'
import { SOCIAL_PLATFORMS } from '../data/socialPlatforms'
import ubcOptions from '../data/ubcOptions.json'
import { LANGUAGES, PROFILE_COLORS } from '../data/profileOptions'
import { emptyBuddyFilters, getBuddyMatches, getFilteredBuddies, getSharedProfileTraits } from '../lib/buddies'
import { getAge, HOBBIES, SPORTS } from '../lib/profile'
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
    birthday: user.birthday || '2000-01-01',
    gender: 'prefer-not-to',
    university: user.university || 'University of British Columbia',
    residence: user.residence || 'Not selected',
    year: Number(user.year) || 1,
    major: user.major || 'Not selected',
    hobbies: parseArray(user.hobbies),
    sports: parseArray(user.sports),
    languages: [],
    socialMedia: [],
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

function BuddyCard({ buddy, category, onView, saved, onSave, showScore = false }) {
  const shared = category === 'nationality' ? [countryName(buddy.nationality)] : buddy.shared
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

function MultiFilterGroup({ title, options, selected, onChange }) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(selected.length > 0)
  const filtered = options.filter((option) => option.toLocaleLowerCase('en').includes(query.trim().toLocaleLowerCase('en')))
  return (
    <details className="buddy-filter-group" open={expanded} onToggle={(event) => setExpanded(event.currentTarget.open)}>
      <summary><span>{title}</span><span>{selected.length ? `${selected.length} selected` : 'Any'}</span></summary>
      <div className="buddy-filter-options-panel">
        {options.length > 8 && <input type="search" aria-label={`Search ${title.toLowerCase()}`} placeholder={`Search ${title.toLowerCase()}…`} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault() }} />}
        <div className="buddy-filter-options">
          {filtered.map((option) => (
            <label key={option} className="buddy-filter-option">
              <input type="checkbox" checked={selected.includes(option)} onChange={() => onChange(selected.includes(option) ? selected.filter((value) => value !== option) : [...selected, option])} />
              <span>{option}</span>
            </label>
          ))}
          {!filtered.length && <p className="buddy-filter-no-options">No matches.</p>}
        </div>
      </div>
    </details>
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
            <label className="buddy-filter-select"><span>Major</span><select value={filters.major} onChange={(event) => setField('major', event.target.value)}><option value="">Any major</option>{options.major.map((major) => <option key={major} value={major}>{major}</option>)}</select></label>
            <label className="buddy-filter-select"><span>Year of study</span><select value={filters.year} onChange={(event) => setField('year', event.target.value)}><option value="">Any year</option>{[1, 2, 3, 4, 5, 6].map((year) => <option key={year} value={year}>{yearName(year)}</option>)}</select></label>
            <label className="buddy-filter-select"><span>Residence</span><select value={filters.residence} onChange={(event) => setField('residence', event.target.value)}><option value="">Any residence</option>{options.residence.map((residence) => <option key={residence} value={residence}>{residence}</option>)}</select></label>
          </div>
          <div className="buddy-filter-multi-grid">
            <MultiFilterGroup title="Sports" options={SPORTS} selected={filters.sports} onChange={(value) => setField('sports', value)} />
            <MultiFilterGroup title="Hobbies" options={HOBBIES} selected={filters.hobbies} onChange={(value) => setField('hobbies', value)} />
            <MultiFilterGroup title="Languages" options={LANGUAGES} selected={filters.languages} onChange={(value) => setField('languages', value)} />
            <MultiFilterGroup title="Social media" options={SOCIAL_PLATFORMS} selected={filters.socialMedia} onChange={(value) => setField('socialMedia', value)} />
          </div>
          <div className="buddy-filter-actions">
            <button type="button" className="dashboard-secondary" onClick={onReset}>Clear choices</button>
            <button type="submit" className="filter-submit">Show {resultCount} {resultCount === 1 ? 'buddy' : 'buddies'} <ArrowIcon /></button>
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
        {!matches.length && <div className="buddy-filter-empty"><div className="empty-state-icon">{isSaved ? <BookmarkIcon /> : <SearchIcon />}</div><h3>{isSaved && !savedIds.length ? 'Keep a good connection in mind.' : 'No matches just yet.'}</h3><p>{isSaved && !savedIds.length ? 'Tap the bookmark on a profile to find it here later.' : 'Try a different search or give your filters a little more room.'}</p><button className="filter-edit-button" onClick={hasCriteria ? onReset : onDiscover}>{hasCriteria ? 'Reset search and filters' : 'Discover buddies'}<ArrowIcon /></button></div>}
      </div>
      {isSaved && matches.length > 0 && <p className="saved-note">Saved in this browser tab for your profile.</p>}
    </section>
  )
}
function ProfilePanel({ profile, onEdit }) {
  const age = getAge(profile.birthday)
  const birthday = age === null ? 'Not added' : new Date(`${profile.birthday}T12:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
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
          <div><dt>Birthday</dt><dd>{birthday}</dd></div>
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

export default function MainPage({ profile, onEdit }) {
  const [selectedBuddy, setSelectedBuddy] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState(emptyBuddyFilters)
  const [appliedFilters, setAppliedFilters] = useState(emptyBuddyFilters)
  const [view, setView] = useState('discover')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('common')
  const [savedIds, setSavedIds] = useState(() => readSavedBuddies(profile))
  const [feedback, setFeedback] = useState('')
  const [backendUsers, setBackendUsers] = useState([])
  const titleRef = useRef(null)

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

  const buddies = useMemo(() => backendUsers.map(normalizeBackendUser), [backendUsers])
  const matches = getBuddyMatches(profile, buddies)
  const filteredBuddies = getFilteredBuddies(profile, appliedFilters, buddies)
  const filterOptions = {
    nationality: [...countries].sort((a, b) => a.name.localeCompare(b.name, 'en')),
    major: [...new Set([...ubcOptions.majors.map(({ name }) => name), ...buddies.map((buddy) => buddy.major), profile.major])].filter(Boolean).sort((a, b) => a.localeCompare(b, 'en')),
    residence: [...new Set([...ubcOptions.residences.map(({ name }) => name), ...buddies.map((buddy) => buddy.residence), 'Off campus / commuting', profile.residence])].filter(Boolean).sort((a, b) => a.localeCompare(b, 'en')),
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
    setFeedback(`${buddy.name.split(' ')[0]} ${alreadySaved ? 'removed from saved buddies' : 'saved for later'}.${stored ? '' : ' This change will last until you leave the page.'}`)
    window.clearTimeout(feedbackTimer.current)
    feedbackTimer.current = window.setTimeout(() => setFeedback(''), 4000)
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
      <section className="dashboard-intro" aria-labelledby="dashboard-title">
        <div className="campus-pill">UBC Vancouver</div>
        <p className="eyebrow">Good to see you, {profile.name.split(' ')[0] || 'buddy'}.</p>
        <h2 id="dashboard-title" ref={titleRef} tabIndex={-1}>Your people are<br /><span>closer than you think.</span></h2>
        <p>A study partner. A familiar language. A new friend.<br />Find a little common ground and take it from there.</p>
        <button className="find-buddy-button" onClick={findBuddy}><BuddyMark />Find buddy<ArrowIcon /></button>
        <div className="hero-orbit hero-orbit--one" aria-hidden="true" /><div className="hero-orbit hero-orbit--two" aria-hidden="true" />
      </section>
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
        <div className="quick-filters">{!hasCriteria && view === 'discover' ? <><span>Try a little common ground</span>{profile.residence && <button onClick={() => quickFilter('residence', profile.residence)}>Same residence</button>}{profile.major && <button onClick={() => quickFilter('major', profile.major)}>Same major</button>}{profile.languages.length > 0 && <button onClick={() => quickFilter('languages', profile.languages)}>Shared language</button>}</> : <><span role="status">{filteredBuddies.length} {filteredBuddies.length === 1 ? 'person' : 'people'} to explore</span>{choices.map((choice) => <button key={`${choice.field}-${choice.value}`} onClick={() => setAppliedFilters(removeFilterChoice(appliedFilters, choice.field, choice.value))} aria-label={`Remove ${filterLabel(choice)} filter`}>{filterLabel(choice)}<CloseIcon /></button>)}{hasCriteria && <button className="clear-discovery" onClick={clearFilters}>Clear all</button>}</>}</div>
        <label className="buddy-sort"><span className="sr-only">Sort buddies</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="common">Most in common</option><option value="name">Name: A to Z</option></select></label>
      </div>
      <div className="dashboard-grid">
        {showColumns ? <section className="buddy-discovery" aria-labelledby="discovery-title">
          <div className="discovery-heading"><div><h2 id="discovery-title">A few things in common</h2><p>Start with something familiar. Discover someone new.</p></div><span className="curated-mark"><SparkIcon />Picked for you</span></div>
          <div className="buddy-columns">
            <BuddyColumn title="Nationality" category="nationality" description={`A little closer to ${countryName(profile.nationality)}.`} matches={matches.nationality} profile={profile} onView={setSelectedBuddy} savedIds={savedIds} onSave={toggleSave} />
            <BuddyColumn title="Sport" category="sports" description="A teammate for your next game." matches={matches.sports} profile={profile} onView={setSelectedBuddy} savedIds={savedIds} onSave={toggleSave} />
            <BuddyColumn title="Hobbies" category="hobbies" description="Good company for your favorite things." matches={matches.hobbies} profile={profile} onView={setSelectedBuddy} savedIds={savedIds} onSave={toggleSave} />
          </div>
        </section> : <BuddyResults matches={filteredBuddies} savedIds={savedIds} onSave={toggleSave} onView={setSelectedBuddy} isSaved={view === 'saved'} hasCriteria={hasCriteria} onReset={clearFilters} onDiscover={() => chooseView('discover')} />}
        <ProfilePanel profile={profile} onEdit={onEdit} />
      </div>
      <div className={`buddy-toast${feedback ? ' is-visible' : ''}`} role="status">{feedback}</div>
      <BuddyFilterDialog open={filterOpen} filters={draftFilters} options={filterOptions} resultCount={previewCount} onChange={setDraftFilters} onClose={() => setFilterOpen(false)} onReset={() => setDraftFilters(emptyBuddyFilters())} onApply={() => { setAppliedFilters(draftFilters); if (view !== 'saved') setView('all'); setFilterOpen(false) }} />
      {selectedBuddy && <BuddyDialog key={selectedBuddy.id} buddy={selectedBuddy} profile={profile} saved={savedIds.includes(selectedBuddy.id)} onSave={toggleSave} onClose={() => setSelectedBuddy(null)} />}
    </main>
  )
}