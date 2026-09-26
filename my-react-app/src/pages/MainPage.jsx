import { useEffect, useRef, useState } from 'react'
import { ArrowIcon, BuddyMark, CloseIcon, EditIcon } from '../components/Icons'
import ProfileAvatar from '../components/ProfileAvatar'
import CountryFlag from '../components/CountryFlag'
import countries from '../data/countries.json'
import { SOCIAL_PLATFORMS } from '../data/socialPlatforms'
import ubcOptions from '../data/ubcOptions.json'
import { LANGUAGES, PROFILE_COLORS } from '../data/profileOptions'
import { SAMPLE_BUDDIES } from '../data/sampleBuddies'
import { emptyBuddyFilters, getBuddyMatches, getFilteredBuddies, getSharedProfileTraits } from '../lib/buddies'
import { getAge, HOBBIES, SPORTS } from '../lib/profile'
import './MainPage.css'

const countryName = (code) => countries.find((country) => country.code === code)?.name || 'Not selected'
const yearName = (year) => ({ 1: '1st year', 2: '2nd year', 3: '3rd year', 4: '4th year', 5: '5th year', 6: '6th year' })[year] || 'Year not selected'

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

function BuddyCard({ buddy, category, onView, showScore = false }) {
  const shared = category === 'nationality' ? [countryName(buddy.nationality)] : buddy.shared
  return (
    <article className="buddy-card">
      <div className="buddy-card-heading">
        <ProfileAvatar profile={buddy} />
        <div><h4>{buddy.name}</h4><p>@{buddy.username}</p></div>
        <CountryFlag code={buddy.nationality} />
      </div>
      <p className="buddy-major">{buddy.major}</p>
      <p className="buddy-campus">{yearName(buddy.year)} <span aria-hidden="true">&middot;</span> {buddy.residence}</p>
      {showScore && <p className="buddy-common-count">{buddy.commonCount} {buddy.commonCount === 1 ? 'detail' : 'details'} in common</p>}
      <Tags values={shared.slice(0, 2)} className="shared-tags" />
      <button className="view-buddy" onClick={() => onView(buddy)}>View profile <ArrowIcon /></button>
    </article>
  )
}

function BuddyColumn({ title, category, description, matches, profile, onView }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? matches : matches.slice(0, 3)
  const emptyMessage = category === 'nationality'
    ? `No sample buddies from ${countryName(profile.nationality)} yet.`
    : !profile[category]?.length
      ? `Add ${category} to your profile to see what you have in common.`
      : `No sample buddies share your ${category} yet.`
  return (
    <section className={`buddy-column buddy-column--${category}`} aria-labelledby={`${category}-title`}>
      <header className="buddy-column-header">
        <div className="category-icon">{category === 'nationality' ? <CountryFlag code={profile.nationality} /> : <CategoryIcon category={category} />}</div>
        <div className="column-title-line"><h3 id={`${category}-title`}>{title}</h3><span>{matches.length}</span></div>
        <p>{description}</p>
      </header>
      <div className="buddy-list">
        {visible.map((buddy) => <BuddyCard key={buddy.id} buddy={buddy} category={category} onView={onView} />)}
        {!matches.length && <div className="buddy-empty"><p>{emptyMessage}</p><a href="#/edit-profile">Edit profile <span aria-hidden="true">&rarr;</span></a></div>}
      </div>
      {matches.length > 3 && <button className="column-more" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Show fewer' : `See all ${matches.length} buddies`}</button>}
    </section>
  )
}

function MultiFilterGroup({ title, options, selected, onChange }) {
  const [query, setQuery] = useState('')
  const filtered = options.filter((option) => option.toLocaleLowerCase('en').includes(query.trim().toLocaleLowerCase('en')))
  return (
    <details className="buddy-filter-group" defaultOpen={selected.length > 0}>
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

function BuddyFilterDialog({ open, filters, options, onChange, onClose, onReset, onApply }) {
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
        <p className="buddy-filter-description">Choose profile details to narrow the list. Different sections work together; selections in one section match any choice. With no filters, you’ll see everyone.</p>
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
            <button type="submit" className="filter-submit">Filter buddies <ArrowIcon /></button>
          </div>
        </form>
      </div>
    </dialog>
  )
}

function BuddyResults({ matches, filters, onEditFilters, onClearFilters, onView }) {
  const selected = [
    filters.nationality && countryName(filters.nationality),
    filters.major,
    filters.year && yearName(filters.year),
    filters.residence,
    ...filters.sports,
    ...filters.hobbies,
    ...filters.languages,
    ...filters.socialMedia,
  ].filter(Boolean)
  return (
    <section className="buddy-filter-results" aria-labelledby="filtered-buddies-title">
      <div className="discovery-heading">
        <div><h2 id="filtered-buddies-title">Matching buddies</h2><p>Ranked by how many profile details you have in common.</p></div>
        <span className="sample-badge">{matches.length} sample {matches.length === 1 ? 'profile' : 'profiles'}</span>
      </div>
      {selected.length > 0 && <div className="buddy-filter-summary"><span>Filters</span><Tags values={selected} /></div>}
      <div className="buddy-results-grid">
        {matches.map((buddy) => <BuddyCard key={buddy.id} buddy={buddy} category="filtered" onView={onView} showScore />)}
        {!matches.length && <div className="buddy-filter-empty"><h3>No profiles match those filters yet.</h3><p>Try removing a filter to see more sample buddies.</p></div>}
      </div>
      <div className="buddy-results-actions"><button className="dashboard-secondary" onClick={onClearFilters}>Clear filters</button><button className="filter-edit-button" onClick={onEditFilters}>Change filters</button></div>
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
          <div><dt>Languages</dt><dd>{profile.languages?.join(', ') || 'Not added'}</dd></div>
          <div><dt>Profile color</dt><dd className="profile-color-detail"><span style={{ background: profile.favoriteColor }} aria-hidden="true" />{colorName}</dd></div>
        </dl>
      </div>
      <div className="profile-interests"><h3>Sports</h3><Tags values={profile.sports} /><h3>Hobbies</h3><Tags values={profile.hobbies} /></div>
      {profile.socialMedia?.length > 0 && <div className="profile-socials"><h3>Find me on</h3>{profile.socialMedia.map(({ platform, username }) => <p key={platform}><span>{platform}</span><span>{username ? `@${username.replace(/^@/, '')}` : 'No username added'}</span></p>)}</div>}
      <p className="profile-session-note">Profile edits are saved for this browser session.</p>
    </aside>
  )
}

function BuddyDialog({ buddy, profile, onClose }) {
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
        <dl className="buddy-dialog-details"><div><dt>Studies</dt><dd>{buddy.major} &middot; {yearName(buddy.year)}</dd></div><div><dt>Residence</dt><dd>{buddy.residence}</dd></div><div><dt>Languages</dt><dd>{buddy.languages.join(', ')}</dd></div></dl>
        <div className="buddy-shared"><h3>You have in common</h3><Tags values={[...new Set(shared)]} empty="A new perspective to share." /></div>
        <p className="sample-profile-note">Sample profile for this preview. Messaging is not available yet.</p>
        <div className="buddy-dialog-actions"><button className="dashboard-secondary" onClick={onClose}>Back to buddies</button></div>
      </div>
    </dialog>
  )
}

export default function MainPage({ profile, onEdit }) {
  const [selectedBuddy, setSelectedBuddy] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState(emptyBuddyFilters)
  const [appliedFilters, setAppliedFilters] = useState(emptyBuddyFilters)
  const [hasFiltered, setHasFiltered] = useState(false)
  const titleRef = useRef(null)
  const matches = getBuddyMatches(profile)
  const filteredBuddies = getFilteredBuddies(profile, appliedFilters)
  const filterOptions = {
    nationality: [...countries].sort((a, b) => a.name.localeCompare(b.name, 'en')),
    major: [...new Set([...ubcOptions.majors.map(({ name }) => name), ...SAMPLE_BUDDIES.map((buddy) => buddy.major), profile.major])].filter(Boolean).sort((a, b) => a.localeCompare(b, 'en')),
    residence: [...new Set([...ubcOptions.residences.map(({ name }) => name), ...SAMPLE_BUDDIES.map((buddy) => buddy.residence), 'Off campus / commuting', profile.residence])].filter(Boolean).sort((a, b) => a.localeCompare(b, 'en')),
  }

  useEffect(() => { titleRef.current?.focus({ preventScroll: true }) }, [])

  function findBuddy() {
    setDraftFilters({
      ...appliedFilters,
      sports: [...appliedFilters.sports],
      hobbies: [...appliedFilters.hobbies],
      languages: [...appliedFilters.languages],
      socialMedia: [...appliedFilters.socialMedia],
    })
    setFilterOpen(true)
  }

  function applyFilters() {
    setAppliedFilters({
      ...draftFilters,
      sports: [...draftFilters.sports],
      hobbies: [...draftFilters.hobbies],
      languages: [...draftFilters.languages],
      socialMedia: [...draftFilters.socialMedia],
    })
    setHasFiltered(true)
    setFilterOpen(false)
  }

  function clearFilters() {
    setDraftFilters(emptyBuddyFilters())
    setAppliedFilters(emptyBuddyFilters())
    setHasFiltered(false)
    setFilterOpen(false)
  }

  function viewBuddy(buddy) {
    setSelectedBuddy(buddy)
  }

  return (
    <main className="dashboard">
      <section className="dashboard-intro" aria-labelledby="dashboard-title">
        <p className="eyebrow">Different stories. A little common ground.</p>
        <h2 id="dashboard-title" ref={titleRef} tabIndex={-1}>Your next hello starts here.</h2>
        <p>Find someone who feels a little like home. Or brings a whole new perspective.</p>
        <button className="find-buddy-button" onClick={findBuddy}><BuddyMark />find buddy<ArrowIcon /></button>
        <p className="no-suggestions">Choose a major, year, sport, nationality, or other profile detail.</p>
      </section>
      <div className="dashboard-grid">
        {hasFiltered ? (
          <BuddyResults matches={filteredBuddies} filters={appliedFilters} onEditFilters={findBuddy} onClearFilters={clearFilters} onView={viewBuddy} />
        ) : (
          <section className="buddy-discovery" aria-labelledby="discovery-title">
            <div className="discovery-heading"><div><h2 id="discovery-title">A few things in common</h2><p>A familiar place, a favorite game, or something you love.</p></div><span className="sample-badge">Sample buddies</span></div>
            <div className="buddy-columns">
              <BuddyColumn title="Nationality" category="nationality" description={`A little closer to ${countryName(profile.nationality)}.`} matches={matches.nationality} profile={profile} onView={viewBuddy} />
              <BuddyColumn title="Sport" category="sports" description="A teammate for your next game." matches={matches.sports} profile={profile} onView={viewBuddy} />
              <BuddyColumn title="Hobbies" category="hobbies" description="Good company for your favorite things." matches={matches.hobbies} profile={profile} onView={viewBuddy} />
            </div>
          </section>
        )}
        <ProfilePanel profile={profile} onEdit={onEdit} />
      </div>
      <BuddyFilterDialog open={filterOpen} filters={draftFilters} options={filterOptions} onChange={setDraftFilters} onClose={() => setFilterOpen(false)} onReset={() => setDraftFilters(emptyBuddyFilters())} onApply={applyFilters} />
      {selectedBuddy && <BuddyDialog buddy={selectedBuddy} profile={profile} onClose={() => setSelectedBuddy(null)} />}
    </main>
  )
}
