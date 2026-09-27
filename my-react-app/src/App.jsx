import { useEffect, useRef, useState } from 'react'
import { ArrowIcon, BuddyMark, CloseIcon } from './components/Icons'
import ProfileAvatar from './components/ProfileAvatar'
import ChangePasswordDialog from './components/ChangePasswordDialog'
import CreateProfile from './pages/CreateProfile'
import SignIn from './pages/SignIn'
import MainPage from './pages/MainPage'
import { clearActiveProfile, normalizeProfile, readActiveProfile, saveActiveProfile } from './lib/profileSession'
import { getThemeStyle } from './lib/theme'
import './App.css'
import './theme.css'
import './enhancements.css'

function readRoute() {
  const path = window.location.hash.slice(1) || '/'
  return ['/create-profile', '/sign-in', '/main', '/edit-profile'].includes(path) ? path : '/'
}

function Welcome() {
  return (
    <main className="hero">
      <div className="hero-content">
        <div className="hero-copy">
          <p className="eyebrow"><span className="hero-eyebrow-mark" aria-hidden="true" />UBC international student community</p>
          <h2>Find your people.<br /><span className="hero-title-accent">Feel at home.</span></h2>
          <p className="hero-description">A new country feels smaller when you know someone. Meet fellow students through shared backgrounds, classes, languages, and interests.</p>
          <div className="welcome-actions">
            <a className="welcome-primary" href="#/create-profile">Create your profile<ArrowIcon /></a>
            <a className="sign-in-button" href="#/sign-in">Already a member? <strong>Sign in</strong></a>
          </div>
          <ul className="hero-highlights" aria-label="Ways to connect">
            <li><span aria-hidden="true">✳</span>Shared roots</li>
            <li><span aria-hidden="true">↗</span>New interests</li>
            <li><span aria-hidden="true">⌂</span>One campus</li>
          </ul>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <svg className="buddy-illustration" viewBox="0 0 480 420" fill="none">
            <path d="M77 226c-6-74 42-142 113-161 65-17 133 5 174 53 43 51 47 131 12 191-35 61-101 91-173 78-75-14-120-79-126-161Z" fill="#F8EEDB" />
            <path d="M118 180c41-70 122-100 202-72 44 15 76 49 91 92" stroke="#E0D1B8" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 9" />
            <path d="M89 275c43 63 114 94 190 77 41-9 77-34 99-69" stroke="#E0D1B8" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 9" />
            <circle cx="247" cy="206" r="108" fill="#F4C542" />
            <circle cx="214" cy="190" r="5" fill="#684C08" />
            <circle cx="278" cy="190" r="5" fill="#684C08" />
            <path d="M215 222c9 13 22 19 34 19s25-6 34-19" stroke="#684C08" strokeWidth="6" strokeLinecap="round" />
            <g transform="rotate(-12 122 146)">
              <circle cx="122" cy="146" r="47" fill="#D96D5D" />
              <circle cx="108" cy="139" r="3.5" fill="#fff" />
              <circle cx="136" cy="139" r="3.5" fill="#fff" />
              <path d="M109 157c4 6 8 9 13 9s10-3 13-9" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
            </g>
            <g transform="rotate(12 373 275)">
              <circle cx="373" cy="275" r="57" fill="#3765C9" />
              <circle cx="356" cy="267" r="4" fill="#fff" />
              <circle cx="390" cy="267" r="4" fill="#fff" />
              <path d="M357 288c5 7 10 10 16 10s12-3 17-10" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
            </g>
            <circle cx="345" cy="103" r="18" fill="#B9CFB4" />
            <path d="m344 99 3 4-3 5" stroke="#456747" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m85 90 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1 4-8Z" fill="#E6B43B" />
            <circle cx="402" cy="160" r="5" fill="#D96D5D" />
            <circle cx="110" cy="322" r="6" fill="#3765C9" />
          </svg>
          <p className="hero-visual-caption"><span>Different stories.</span> One campus community.</p>
        </div>
      </div>
    </main>
  )
}

export default function App() {
  const [route, setRoute] = useState(readRoute)
  const [profile, setProfile] = useState(readActiveProfile)
  const [notice, setNotice] = useState('')
  const [draftColor, setDraftColor] = useState(null)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const navigateWorkspace = useRef(null)
  const activeRoute = profile
    ? ['/create-profile', '/sign-in', '/'].includes(route) ? '/main' : route
    : ['/main', '/edit-profile'].includes(route) ? '/sign-in' : route
  const isForm = ['/create-profile', '/edit-profile'].includes(activeRoute)
  const isPersonalTheme = isForm || activeRoute === '/main'
  const themeColor = isForm
    ? draftColor ?? (activeRoute === '/edit-profile' ? profile.favoriteColor : '')
    : profile?.favoriteColor

  useEffect(() => {
    const handleRoute = () => {
      setDraftColor(null)
      setRoute(readRoute())
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    window.addEventListener('hashchange', handleRoute)
    return () => window.removeEventListener('hashchange', handleRoute)
  }, [])

  useEffect(() => {
    if (!accountMenuOpen) return undefined
    const closeOnOutsideClick = (event) => {
      if (!event.target.closest('.dashboard-account-menu')) setAccountMenuOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setAccountMenuOpen(false)
    }
    document.addEventListener('click', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('click', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [accountMenuOpen])

  function completeProfile(nextProfile) {
    const normalized = normalizeProfile(nextProfile)
    const saved = saveActiveProfile(normalized)
    setProfile(normalized)
    setNotice(saved ? '' : 'Your profile is available for this visit. Browser storage is unavailable.')
    window.location.hash = '/main'
  }

  function updateProfile(changes) {
    const updated = normalizeProfile({ ...profile, ...changes })
    const saved = saveActiveProfile(updated)
    setProfile(updated)
    setNotice(saved ? 'Profile updated.' : 'Profile updated for this visit. Browser storage is unavailable.')
    window.location.hash = '/main'
  }

  async function handleSignIn(username, password) {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to sign in.')
    }

    const normalized = normalizeProfile(payload.user)
    const saved = saveActiveProfile(normalized)
    setProfile(normalized)
    setNotice(saved ? '' : 'You were signed in for this visit only.')
    window.location.hash = '/main'
  }

  function signOut() {
    setAccountMenuOpen(false)
    clearActiveProfile()
    setProfile(null)
    setNotice('')
    window.location.hash = '/'
  }

  return (
    <div className={`home${activeRoute === '/' ? ' welcome-home' : ''}${isForm ? ' onboarding-shell' : activeRoute === '/main' ? ' dashboard-shell' : ''}${isPersonalTheme ? ` personal-theme${themeColor ? '' : ' theme-unselected'}` : ''}`} style={isPersonalTheme ? getThemeStyle(themeColor) : undefined}>
      <a className="skip-navigation" href="#main-content" onClick={(event) => { event.preventDefault(); const main = document.querySelector('main'); main?.setAttribute('tabindex', '-1'); main?.focus() }}>Skip to content</a>
      <header className="site-header">
        <a className="brand" href={profile ? '#/main' : '#/'} aria-label="InterBuddies home"><BuddyMark className="brand-mark" /><h1>InterBuddies</h1></a>
        {isForm && <span className="header-note">{activeRoute === '/edit-profile' ? 'Make it feel like you.' : 'A little closer to your people.'}</span>}
        {activeRoute === '/main' && <nav className="dashboard-account-nav" aria-label="Your account"><div className="dashboard-account-menu"><button className="dashboard-account-link" aria-expanded={accountMenuOpen} aria-haspopup="true" onClick={() => setAccountMenuOpen((open) => !open)}><ProfileAvatar profile={profile} size="small" /><span>{profile.name}</span></button>{accountMenuOpen && <div className="dashboard-account-dropdown"><button className="dashboard-account-action" onClick={() => { setAccountMenuOpen(false); navigateWorkspace.current?.('profile') }}>My profile</button><button className="dashboard-account-action" onClick={() => { setAccountMenuOpen(false); setChangePasswordOpen(true) }}>Change password</button><button className="dashboard-sign-out" onClick={signOut}>Sign out</button></div>}</div></nav>}
      </header>
      {notice && activeRoute === '/main' && <div className="profile-update-notice"><span role="status">{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notification"><CloseIcon /></button></div>}
      {activeRoute === '/' && <Welcome />}
      {activeRoute === '/create-profile' && <CreateProfile key="create" onComplete={completeProfile} onColorChange={setDraftColor} onExit={() => { window.location.hash = '/' }} />}
      {activeRoute === '/edit-profile' && <CreateProfile key="edit" mode="edit" initialProfile={profile} onComplete={updateProfile} onColorChange={setDraftColor} onExit={() => { window.location.hash = '/main' }} />}
      {activeRoute === '/sign-in' && <SignIn onSignIn={handleSignIn} />}
      {activeRoute === '/main' && <MainPage key={profile.id || profile.username} profile={profile} onEdit={() => { window.location.hash = '/edit-profile' }} registerNavigate={(callback) => { navigateWorkspace.current = callback }} />}
      {changePasswordOpen && profile && <ChangePasswordDialog username={profile.username} onClose={() => setChangePasswordOpen(false)} onChanged={() => setNotice('Password changed successfully.')} />}
      <footer className="site-footer">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
        A little hello can go a long way.
      </footer>
    </div>
  )
}
