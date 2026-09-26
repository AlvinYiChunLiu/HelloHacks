import { useEffect, useRef, useState } from 'react'
import { ArrowIcon } from '../components/Icons'
import SearchSelect from '../components/SearchSelect'
import ProfileColorPicker from '../components/ProfileColorPicker'
import ProfilePicturePicker from '../components/ProfilePicturePicker'
import ProfileAvatar from '../components/ProfileAvatar'
import { readRegistrationDraft, saveRegistrationDraft, clearRegistrationDraft } from '../lib/registrationDraft'
import LanguagePicker from '../components/LanguagePicker'
import countries from '../data/countries.json'
import ubcOptions from '../data/ubcOptions.json'
import { SOCIAL_PLATFORMS } from '../data/socialPlatforms'
import { emptyProfile, getAge, HOBBIES, profileChanges, profileDraft, registrationPayload, SPORTS, stepForField, UNIVERSITY, validateStep } from '../lib/profile'
import './CreateProfile.css'

const STEPS = [
  { label: 'Your color', title: 'What’s your favorite color?', description: 'Pick a color and make InterBuddies feel like you.' },
  { label: 'About you', title: 'A little about you.', description: 'Every friendship starts with an introduction.' },
  { label: 'Nationality', title: 'Where are you from?', description: 'Share your nationality and the languages you speak.' },
  { label: 'Campus life', title: 'Find your common ground.', description: 'Let’s start with where you study and call home.' },
  { label: 'Your interests', title: 'What makes you, you?', description: 'Pick the things you enjoy. You can choose as many as you like.' },
  { label: 'Social media', title: 'Where can people find you?', description: 'Choose any social platforms you use and add your username for each.' },
  { label: 'Account details', title: 'One last thing.', description: 'Choose a password to finish creating your profile.' },
]
const searchable = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en')
const alphabetical = (a, b) => a.label.localeCompare(b.label, 'en')
const countryOptions = countries.map(({ code, name }) => ({ value: code, label: name })).sort(alphabetical)
const residenceOptions = [
  ...ubcOptions.residences.map(({ name }) => ({ value: name, label: name })),
  { value: 'Off campus / commuting', label: 'Off campus / commuting' },
].sort(alphabetical)
const majorOptions = [
  ...ubcOptions.majors.map(({ name }) => ({ value: name, label: name })),
  { value: 'Undeclared / exploring majors', label: 'Undeclared / exploring majors' },
].sort(alphabetical)
const validationOptions = { countries, residences: residenceOptions, majors: majorOptions }
const YEARS = ['1st year', '2nd year', '3rd year', '4th year', '5th year', '6th year']

function birthdayForAge(value) {
  const years = Number(value)
  if (!Number.isInteger(years) || years < 16 || years > 100) return ''
  const today = new Date()
  const year = today.getFullYear() - years
  const month = today.getMonth()
  const day = Math.min(today.getDate(), new Date(year, month + 1, 0).getDate())
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function Field({ name, label, error, hint, children }) {
  return (
    <div className={`form-field${error ? ' has-error' : ''}`}>
      <label id={`${name}-label`} htmlFor={name}>{label}</label>
      {children}
      {error ? <p className="field-error" id={`${name}-error`}>{error}</p> : hint && <p className="field-hint" id={`${name}-hint`}>{hint}</p>}
    </div>
  )
}

function InterestGroup({ title, description, options, selected, onChange }) {
  return (
    <fieldset className="interest-group">
      <legend>{title}<span>{selected.length ? `${selected.length} selected` : 'Optional'}</span></legend>
      <p className="field-hint">{description}</p>
      <div className="interest-options">
        {options.map((option) => (
          <label className={`interest-chip${selected.includes(option) ? ' is-selected' : ''}`} key={option}>
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option])}
            />
            <span>{option}</span><span className="chip-symbol" aria-hidden="true">{selected.includes(option) ? '\u2713' : '+'}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function SocialMediaPicker({ selected, onChange }) {
  const [query, setQuery] = useState('')
  const matches = SOCIAL_PLATFORMS.filter((platform) => searchable(platform).includes(searchable(query.trim())))

  function toggle(platform) {
    onChange(selected.some((item) => item.platform === platform)
      ? selected.filter((item) => item.platform !== platform)
      : [...selected, { platform, username: '' }])
  }

  function updateUsername(platform, username) {
    onChange(selected.map((item) => item.platform === platform ? { ...item, username } : item))
  }

  return (
    <div className="social-media-fields">
      <div className="form-field">
        <label htmlFor="social-search">Social media</label>
        <p className="field-hint">Search and select all the platforms you’d like to share.</p>
        <input id="social-search" type="search" autoComplete="off" placeholder="Search social media…" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <fieldset className="social-platform-picker">
        <legend className="sr-only">Choose social media platforms</legend>
        <div className="social-platform-options">
          {matches.map((platform) => {
            const checked = selected.some((item) => item.platform === platform)
            return (
              <label className={`social-platform-option${checked ? ' is-selected' : ''}`} key={platform}>
                <input type="checkbox" checked={checked} onChange={() => toggle(platform)} />
                <span>{platform}</span><span aria-hidden="true">{checked ? '✓' : '+'}</span>
              </label>
            )
          })}
          {!matches.length && <p className="select-empty" role="status">No matches. Try another search.</p>}
        </div>
      </fieldset>
      {selected.length > 0 && (
        <div className="social-username-list" aria-label="Usernames for selected social media">
          <p className="social-selection-count">Add your usernames</p>
          {selected.map(({ platform, username }) => {
            const id = `social-${SOCIAL_PLATFORMS.indexOf(platform)}`
            return (
              <div className="social-username-field" key={platform}>
                <label htmlFor={id}>{platform}</label>
                <div className="social-username-input">
                  <span aria-hidden="true">@</span>
                  <input id={id} name={id} autoCapitalize="none" autoComplete="off" spellCheck={false} maxLength={100} placeholder="your_username" value={username} onChange={(event) => updateUsername(platform, event.target.value)} />
                  <button type="button" onClick={() => toggle(platform)} aria-label={`Remove ${platform}`}>Remove</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function CreateProfile({ onComplete, onExit, onColorChange, initialProfile, mode = 'create' }) {
  const isEditing = mode === 'edit'
  const steps = isEditing ? STEPS.slice(0, -1) : STEPS
  const [restoredDraft, setRestoredDraft] = useState(() => isEditing ? null : readRegistrationDraft())
  const [profile, setProfile] = useState(() => isEditing ? profileDraft(initialProfile) : restoredDraft?.profile || emptyProfile())
  const [ageInput, setAgeInput] = useState(() => {
    const initialBirthday = isEditing ? initialProfile?.birthday : restoredDraft?.profile?.birthday
    const initialAge = getAge(initialBirthday)
    return initialAge === null ? '' : String(initialAge)
  })
  const [step, setStep] = useState(isEditing ? 1 : restoredDraft?.step || 0)
  const [furthestStep, setFurthestStep] = useState(restoredDraft?.step || 0)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [preparingPhoto, setPreparingPhoto] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const titleRef = useRef(null)
  const formRef = useRef(null)
  const requestRef = useRef(null)
  const current = steps[step]
  const age = getAge(profile.birthday)

  useEffect(() => {
    onColorChange?.(profile.favoriteColor)
  }, [onColorChange, profile.favoriteColor])

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [step])

  useEffect(() => () => {
    requestRef.current?.abort()
    requestRef.current = null
  }, [])

  function moveToStep(nextStep) {
    setStep(nextStep)
    setFurthestStep((previous) => Math.max(previous, nextStep))
  }

  useEffect(() => {
    if (!isEditing && profile.favoriteColor) saveRegistrationDraft(profile, step)
  }, [isEditing, profile, step])

  function startOver() {
    clearRegistrationDraft()
    setProfile(emptyProfile())
    setAgeInput('')
    setStep(0)
    setFurthestStep(0)
    setErrors({})
    setServerError('')
    setRestoredDraft(null)
  }
  function update(field, value) {
    setProfile((previous) => ({ ...previous, [field]: value }))
    setErrors((previous) => ({ ...previous, [field]: undefined }))
    setServerError('')
  }

  function inputProps(field, hint = false) {
    return {
      id: field,
      name: field,
      value: profile[field],
      onChange: (event) => update(field, event.target.value),
      'aria-invalid': Boolean(errors[field]),
      'aria-describedby': errors[field] ? `${field}-error` : hint ? `${field}-hint` : undefined,
      required: true,
    }
  }

  function goBack() {
    setErrors({})
    setServerError('')
    if (isEditing || step === 0) onExit()
    else moveToStep(step - 1)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting || preparingPhoto) return
    const nextErrors = validateStep(step, profile, validationOptions)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      formRef.current?.querySelector(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus()
      return
    }
    if (!isEditing && step < steps.length - 1) {
      setServerError('')
      moveToStep(step + 1)
      return
    }
    for (let previousStep = 0; previousStep < steps.length; previousStep += 1) {
      const previousErrors = validateStep(previousStep, profile, validationOptions)
      if (Object.keys(previousErrors).length) {
        setErrors(previousErrors)
        moveToStep(previousStep)
        return
      }
    }

    if (isEditing) {
      onComplete(profileChanges(profile))
      return
    }

    setSubmitting(true)
    setServerError('')
    const controller = new AbortController()
    requestRef.current = controller
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationPayload(profile)),
        signal: controller.signal,
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        if (result?.field === 'email') {
          setErrors({ username: 'That username is already in use. Please choose another.' })
          moveToStep(1)
        } else if (result?.field && Object.hasOwn(profile, result.field)) {
          setErrors({ [result.field]: result.error || 'Please check this field.' })
          moveToStep(stepForField(result.field))
        } else {
          setServerError(result?.error || 'We couldn’t create your profile. Please try again.')
        }
        return
      }
      if (!result?.profile?.id) throw new Error('Unexpected registration response')
      clearRegistrationDraft()
      const changes = profileChanges(profile)
      onComplete({ ...result.profile, favoriteColor: changes.favoriteColor, languages: changes.languages, gender: changes.gender, avatar: changes.avatar, socialMedia: changes.socialMedia })
    } catch {
      if (requestRef.current === controller) setServerError('We couldn’t connect. Please try again in a moment.')
    } finally {
      window.clearTimeout(timeout)
      requestRef.current = null
      setSubmitting(false)
    }
  }

  return (
    <main className="onboarding-main">
      <aside className="onboarding-intro" aria-label={isEditing ? 'Edit profile sections' : 'Profile creation progress'}>
        <p className="eyebrow">{isEditing ? 'Make it yours' : 'Your people are out there'}</p>
        <h2>{isEditing ? <>A little more<br />like you.</> : <>Make yourself<br />at home.</>}</h2>
        <p>{isEditing ? 'Update your details and help your buddies get to know you.' : 'A few details to help your next buddy get to know you.'}</p>
        <ol className="step-list">
          {steps.map((item, index) => (
            <li key={item.label} className={index === step ? 'is-current' : index < step ? 'is-complete' : ''} aria-current={index === step ? 'step' : undefined}>
              <span className="step-number" aria-hidden="true">{index < step ? '\u2713' : `0${index + 1}`}</span>
              {isEditing || index <= furthestStep ? <button type="button" className="edit-section-button" disabled={submitting || preparingPhoto} onClick={() => { moveToStep(index); setErrors({}) }}>{item.label}</button> : <span>{item.label}</span>}
              <span className="sr-only">{index < step ? ' — completed' : index === step ? ' — current step' : ''}</span>
            </li>
          ))}
        </ol>
        {(profile.name || profile.avatar) && <div className="onboarding-profile-preview"><ProfileAvatar profile={profile} /><div><strong>{profile.name || 'Your profile'}</strong><span>{profile.username ? `@${profile.username}` : 'Make it feel like you.'}</span></div></div>}
        <p className="onboarding-aside-note">A simple hello can be the start of something good.</p>
      </aside>

      <section className="onboarding-card" aria-labelledby="step-title">
        <div className="step-caption"><span>{isEditing ? 'Section' : 'Step'} {step + 1} of {steps.length}</span><span>{isEditing ? 'Edit your profile' : step === 4 || step === 5 ? 'Optional' : 'Create your profile'}</span></div>
        <div className="step-progress" role="progressbar" aria-label={isEditing ? 'Edit profile' : 'Profile creation'} aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={step + 1} aria-valuetext={`Step ${step + 1} of ${steps.length}: ${current.label}`}><span style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
        <h2 id="step-title" ref={titleRef} tabIndex={-1}>{current.title}</h2>
        <p className="step-description">{current.description}</p>

        {restoredDraft && <div className="draft-restored" role="status"><span>Welcome back. Your draft is ready to continue.</span><button type="button" disabled={submitting || preparingPhoto} onClick={startOver}>Start over</button></div>}
        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          {Object.values(errors).some(Boolean) && <p className="sr-only" role="alert">Please check the highlighted fields.</p>}
          <fieldset className="step-fields" disabled={submitting} key={step}>
            <legend className="sr-only">{current.label}</legend>
            {step === 0 && <ProfileColorPicker value={profile.favoriteColor} onChange={(value) => update('favoriteColor', value)} error={errors.favoriteColor} />}
            {step === 1 && (
              <div className="fields-grid">
                <Field name="name" label="Name" error={errors.name}>
                  <input {...inputProps('name')} autoComplete="name" maxLength={80} placeholder="Your name" />
                </Field>
                <Field name="username" label="Username" error={errors.username} hint="3–24 letters, numbers, or underscores.">
                  <div className="username-input"><span aria-hidden="true">@</span><input {...inputProps('username', true)} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={24} placeholder="your_username" /></div>
                </Field>
                  <Field name="birthday" label="Age" error={errors.birthday} hint="We’ll use an approximate birthday based on the age you enter.">
                  <div className="age-entry"><input {...inputProps('birthday', true)} type="number" min="16" max="100" step="1" autoComplete="off" placeholder="e.g. 19" value={ageInput} onChange={(event) => { setAgeInput(event.target.value); update('birthday', birthdayForAge(event.target.value)) }} /><span>years old</span></div>
                </Field>
                <ProfilePicturePicker value={profile.avatar} onChange={(value) => update('avatar', value)} profileName={profile.name} color={profile.favoriteColor} onPreparingChange={setPreparingPhoto} />
                <fieldset className="gender-picker" aria-describedby={errors.gender ? 'gender-error' : 'gender-hint'}>
                  <legend>Gender</legend>
                  <div className="gender-options">
                    {[['male', 'Male'], ['female', 'Female'], ['prefer-not-to', 'Prefer not to']].map(([value, label]) => (
                      <label key={value} className={`gender-option${profile.gender === value ? ' is-selected' : ''}`}>
                        <input type="radio" name="gender" value={value} checked={profile.gender === value} onChange={() => update('gender', value)} aria-invalid={Boolean(errors.gender)} required />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.gender ? <p className="field-error" id="gender-error">{errors.gender}</p> : <p className="field-hint" id="gender-hint">Choose “Prefer not to” to keep gender off your profile.</p>}
                </fieldset>
              </div>
            )}
            {step === 2 && (
              <div className="fields-grid">
                <Field name="nationality" label="Nationality" error={errors.nationality}>
                  <SearchSelect id="nationality" name="nationality" options={countryOptions} value={profile.nationality} onChange={(value) => update('nationality', value)} placeholder="Search countries…" error={errors.nationality} />
                </Field>
                <LanguagePicker value={profile.languages} onChange={(value) => update('languages', value)} error={errors.languages} />
              </div>
            )}
            {step === 3 && (
              <div className="fields-grid">
                <Field name="university" label="University" error={errors.university} hint="Starting with the Vancouver campus.">
                  <select {...inputProps('university', true)}><option value={UNIVERSITY}>{UNIVERSITY}</option></select>
                </Field>
                <Field name="residence" label="Residence" error={errors.residence}>
                  <select {...inputProps('residence')}><option value="" disabled>Choose your residence</option>{residenceOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select>
                </Field>
                <Field name="year" label="Year of study" error={errors.year}>
                  <select {...inputProps('year')}><option value="" disabled>Choose your year</option>{YEARS.map((year, index) => <option key={year} value={index + 1}>{year}</option>)}</select>
                </Field>
                <Field name="major" label="Major" error={errors.major}>
                  <SearchSelect id="major" name="major" options={majorOptions} value={profile.major} onChange={(value) => update('major', value)} placeholder="Search UBC majors…" error={errors.major} />
                </Field>
              </div>
            )}
            {step === 4 && (
              <div className="interest-fields">
                <InterestGroup title="Hobbies" description="How do you like to spend your free time?" options={HOBBIES} selected={profile.hobbies} onChange={(value) => update('hobbies', value)} />
                <InterestGroup title="Sports" description="Playing, watching, or trying something new." options={SPORTS} selected={profile.sports} onChange={(value) => update('sports', value)} />
              </div>
            )}
            {step === 5 && (
              <SocialMediaPicker selected={profile.socialMedia} onChange={(value) => update('socialMedia', value)} />
            )}
            {step === 6 && (
              <div className="fields-grid">
                <div className="registration-review">
                  <div className="review-identity"><ProfileAvatar profile={profile} /><div><strong>{profile.name}</strong><span>@{profile.username}</span></div><button type="button" onClick={() => moveToStep(1)}>Review details</button></div>
                  <dl><div><dt>From</dt><dd>{countries.find((country) => country.code === profile.nationality)?.name}</dd></div><div><dt>Languages</dt><dd>{profile.languages.join(', ')}</dd></div><div><dt>Studies</dt><dd>{profile.major} &middot; Year {profile.year}</dd></div><div><dt>Interests</dt><dd>{[...profile.hobbies, ...profile.sports].join(', ') || 'You can add these later'}</dd></div></dl>
                </div>
                <Field name="password" label="Password" error={errors.password} hint="Choose a password with at least 8 characters.">
                  <div className="password-input"><input {...inputProps('password', true)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} placeholder="Create a password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? 'Hide' : 'Show'}</button></div>
                </Field>
                <div className="signup-summary"><span className="summary-check" aria-hidden="true">&#10003;</span><p>Looking good, <strong>{profile.name.trim()}</strong>.<br />Your profile is almost ready.</p></div>
              </div>
            )}
          </fieldset>
          {serverError && <p className="form-error" role="alert">{serverError}</p>}
          <div className="onboarding-actions">
            <button type="button" className="back-button" onClick={goBack} disabled={submitting || preparingPhoto}><span aria-hidden="true">&#8592;</span> {isEditing ? 'Cancel' : 'Back'}</button>
            <button type="submit" className="continue-button" disabled={submitting || preparingPhoto}>{submitting ? 'Creating profile…' : isEditing ? 'Save changes' : step === steps.length - 1 ? 'Create profile' : 'Continue'}{!submitting && <ArrowIcon />}</button>
          </div>
          {!isEditing && step === 4 && <button type="button" className="skip-button" onClick={() => {
            setProfile((previous) => ({ ...previous, hobbies: [], sports: [] }))
            setErrors({})
            setServerError('')
            moveToStep(5)
          }}>Skip for now</button>}
          {!isEditing && step === 5 && <button type="button" className="skip-button" onClick={() => {
            update('socialMedia', [])
            setErrors({})
            setServerError('')
            moveToStep(6)
          }}>Skip for now</button>}
        </form>
      </section>
    </main>
  )
}
