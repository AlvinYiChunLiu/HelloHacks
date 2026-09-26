import { useEffect, useRef, useState } from 'react'
import { ArrowIcon } from '../components/Icons'
import SearchSelect from '../components/SearchSelect'
import countries from '../data/countries.json'
import ubcOptions from '../data/ubcOptions.json'
import { emptyProfile, getAge, HOBBIES, registrationPayload, SPORTS, stepForField, todayDate, UNIVERSITY, validateStep } from '../lib/profile'
import './CreateProfile.css'

const STEPS = [
  { label: 'About you', title: 'First, a little about you.', description: 'Every friendship starts with an introduction.' },
  { label: 'Campus life', title: 'Find your common ground.', description: 'Let’s start with where you study and call home.' },
  { label: 'Your interests', title: 'What makes you, you?', description: 'Pick the things you enjoy. You can choose as many as you like.' },
  { label: 'Social media', title: 'Where can people find you?', description: 'Choose any social platforms you use and add your username for each.' },
  { label: 'Account details', title: 'One last thing.', description: 'Choose a password to finish creating your profile.' },
]
const SOCIAL_PLATFORMS = [
  'YouTube', 'Facebook', 'Instagram', 'WhatsApp', 'TikTok', 'Facebook Messenger',
  'Snapchat', 'Telegram', 'Pinterest', 'X', 'LinkedIn', 'Reddit', 'WeChat',
  'Douyin', 'Threads', 'Discord', 'Twitch', 'LINE', 'Weibo', 'KakaoTalk',
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

export default function CreateProfile({ onComplete, onExit }) {
  const [profile, setProfile] = useState(emptyProfile)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const titleRef = useRef(null)
  const formRef = useRef(null)
  const requestRef = useRef(null)
  const current = STEPS[step]
  const age = getAge(profile.birthday)

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [step])

  useEffect(() => () => {
    requestRef.current?.abort()
    requestRef.current = null
  }, [])

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
    if (step === 0) onExit()
    else setStep(step - 1)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    const nextErrors = validateStep(step, profile, validationOptions)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      formRef.current?.elements.namedItem(Object.keys(nextErrors)[0])?.focus()
      return
    }
    if (step < 4) {
      setServerError('')
      setStep(step + 1)
      return
    }
    for (let previousStep = 0; previousStep < 4; previousStep += 1) {
      const previousErrors = validateStep(previousStep, profile, validationOptions)
      if (Object.keys(previousErrors).length) {
        setErrors(previousErrors)
        setStep(previousStep)
        return
      }
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
          setStep(0)
        } else if (result?.field && Object.hasOwn(profile, result.field)) {
          setErrors({ [result.field]: result.error || 'Please check this field.' })
          setStep(stepForField(result.field))
        } else {
          setServerError(result?.error || 'We couldn’t create your profile. Please try again.')
        }
        return
      }
      if (!result?.profile?.id) throw new Error('Unexpected registration response')
      onComplete({ ...result.profile, socialMedia: profile.socialMedia })
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
      <aside className="onboarding-intro" aria-label="Profile creation progress">
        <p className="eyebrow">Your people are out there</p>
        <h2>Make yourself<br />at home.</h2>
        <p>A few details to help your next buddy get to know you.</p>
        <ol className="step-list">
          {STEPS.map((item, index) => (
            <li key={item.label} className={index === step ? 'is-current' : index < step ? 'is-complete' : ''} aria-current={index === step ? 'step' : undefined}>
              <span className="step-number" aria-hidden="true">{index < step ? '\u2713' : `0${index + 1}`}</span>
              <span>{item.label}</span>
              <span className="sr-only">{index < step ? ' — completed' : index === step ? ' — current step' : ''}</span>
            </li>
          ))}
        </ol>
        <p className="onboarding-aside-note">A simple hello can be the start of something good.</p>
      </aside>

      <section className="onboarding-card" aria-labelledby="step-title">
        <div className="step-caption"><span>Step {step + 1} of 5</span><span>{step === 2 || step === 3 ? 'Optional' : 'Create your profile'}</span></div>
        <div className="step-progress" role="progressbar" aria-label="Profile creation" aria-valuemin={0} aria-valuemax={5} aria-valuenow={step + 1} aria-valuetext={`Step ${step + 1} of 5: ${current.label}`}><span style={{ width: `${(step + 1) * 20}%` }} /></div>
        <h2 id="step-title" ref={titleRef} tabIndex={-1}>{current.title}</h2>
        <p className="step-description">{current.description}</p>

        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          {Object.values(errors).some(Boolean) && <p className="sr-only" role="alert">Please check the highlighted fields.</p>}
          <fieldset className="step-fields" disabled={submitting}>
            <legend className="sr-only">{current.label}</legend>
            {step === 0 && (
              <div className="fields-grid">
                <Field name="name" label="Name" error={errors.name}>
                  <input {...inputProps('name')} autoComplete="name" maxLength={80} placeholder="Your name" />
                </Field>
                <Field name="username" label="Username" error={errors.username} hint="3–24 letters, numbers, or underscores.">
                  <div className="username-input"><span aria-hidden="true">@</span><input {...inputProps('username', true)} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={24} placeholder="your_username" /></div>
                </Field>
                <Field name="birthday" label="Birthday" error={errors.birthday}>
                  <div className="birthday-input"><input {...inputProps('birthday')} type="date" min="1900-01-01" max={todayDate()} autoComplete="bday" /><output className={`age-badge${age === null ? ' is-empty' : ''}`} htmlFor="birthday" aria-live="polite">{age === null ? 'Your age' : `${age} ${age === 1 ? 'year' : 'years'} old`}</output></div>
                </Field>
                <Field name="nationality" label="Nationality" error={errors.nationality}>
                  <SearchSelect id="nationality" name="nationality" options={countryOptions} value={profile.nationality} onChange={(value) => update('nationality', value)} placeholder="Search countries…" error={errors.nationality} />
                </Field>
              </div>
            )}
            {step === 1 && (
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
            {step === 2 && (
              <div className="interest-fields">
                <InterestGroup title="Hobbies" description="How do you like to spend your free time?" options={HOBBIES} selected={profile.hobbies} onChange={(value) => update('hobbies', value)} />
                <InterestGroup title="Sports" description="Playing, watching, or trying something new." options={SPORTS} selected={profile.sports} onChange={(value) => update('sports', value)} />
              </div>
            )}
            {step === 3 && (
              <SocialMediaPicker selected={profile.socialMedia} onChange={(value) => update('socialMedia', value)} />
            )}
            {step === 4 && (
              <div className="fields-grid">
                <Field name="password" label="Password" error={errors.password} hint="Choose a password with at least 8 characters.">
                  <div className="password-input"><input {...inputProps('password', true)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} placeholder="Create a password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? 'Hide' : 'Show'}</button></div>
                </Field>
                <div className="signup-summary"><span className="summary-check" aria-hidden="true">&#10003;</span><p>Looking good, <strong>{profile.name.trim()}</strong>.<br />Your profile is almost ready.</p></div>
              </div>
            )}
          </fieldset>
          {serverError && <p className="form-error" role="alert">{serverError}</p>}
          <div className="onboarding-actions">
            <button type="button" className="back-button" onClick={goBack} disabled={submitting}><span aria-hidden="true">&#8592;</span> Back</button>
            <button type="submit" className="continue-button" disabled={submitting}>{submitting ? 'Creating profile…' : step === 4 ? 'Create profile' : 'Continue'}{!submitting && <ArrowIcon />}</button>
          </div>
          {step === 2 && <button type="button" className="skip-button" onClick={() => {
            setProfile((previous) => ({ ...previous, hobbies: [], sports: [] }))
            setErrors({})
            setServerError('')
            setStep(3)
          }}>Skip for now</button>}
          {step === 3 && <button type="button" className="skip-button" onClick={() => {
            update('socialMedia', [])
            setErrors({})
            setServerError('')
            setStep(4)
          }}>Skip for now</button>}
        </form>
      </section>
    </main>
  )
}
