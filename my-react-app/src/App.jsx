import { useEffect, useState } from 'react'
import { ArrowIcon, BuddyMark, CloseIcon } from './components/Icons'
import ProfileAvatar from './components/ProfileAvatar'
import CreateProfile from './pages/CreateProfile'
import SignIn from './pages/SignIn'
import MainPage from './pages/MainPage'
import { clearActiveProfile, DEV_PROFILE, normalizeProfile, readActiveProfile, saveActiveProfile } from './lib/profileSession'
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
      <svg className="buddy-illustration" viewBox="0 0 180 110" fill="none" aria-hidden="true">
        <path d="M18 101c32 6 102 6 143-1" stroke="#cbd8ed" strokeWidth="2" strokeLinecap="round" />
        <g transform="rotate(-12 60 58)">
          <rect x="20" y="15" width="78" height="83" rx="37" fill="#f4c542" stroke="#dfa917" strokeWidth="1.5" />
          <path d="M45 51v5m24-5v5m-23 14c6 7 15 7 22 0" stroke="#684c08" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g transform="rotate(12 125 62)">
          <rect x="86" y="22" width="75" height="79" rx="36" fill="#2457d6" />
          <path d="M111 56v5m23-5v5m-23 12c6 7 15 7 22 0" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        </g>
        <path d="m126 5-1 7m16-5-5 6M5 44l7 2" stroke="#cc3344" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="eyebrow">A simple hello. A new connection.</p>
      <h2>Meet your next<br /><span>buddy.</span></h2>
      <p className="hero-description">Someone to talk to. Something in common.<br />Start with a hello and see where it goes.</p>
      <a className="welcome-primary" href="#/create-profile">Create profile<ArrowIcon /></a>
      <a className="sign-in-button" href="#/sign-in">Sign in</a>
      <p className="hero-note">New faces. Real connections. Just be you.</p>
    </main>
  )
}

export default function App() {
  const [route, setRoute] = useState(readRoute)
  const [profile, setProfile] = useState(readActiveProfile)
  const [notice, setNotice] = useState('')
  const [draftColor, setDraftColor] = useState(null)
  const activeRoute = ['/main', '/edit-profile'].includes(route) && !profile ? '/sign-in' : route
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

  function signInAsDev() {
    const previous = readActiveProfile()
    completeProfile(previous?.isDev ? previous : DEV_PROFILE)
  }

  function signOut() {
    clearActiveProfile()
    setProfile(null)
    setNotice('')
    window.location.hash = '/'
  }

  return (
    <div className={`home${isForm ? ' onboarding-shell' : activeRoute === '/main' ? ' dashboard-shell' : ''}${isPersonalTheme ? ` personal-theme${themeColor ? '' : ' theme-unselected'}` : ''}`} style={isPersonalTheme ? getThemeStyle(themeColor) : undefined}>
      <a className="skip-navigation" href="#main-content" onClick={(event) => { event.preventDefault(); const main = document.querySelector('main'); main?.setAttribute('tabindex', '-1'); main?.focus() }}>Skip to content</a>
      <header className="site-header">
        <a className="brand" href={profile ? '#/main' : '#/'} aria-label="InterBuddies home"><BuddyMark className="brand-mark" /><h1>InterBuddies</h1></a>
        {isForm && <span className="header-note">{activeRoute === '/edit-profile' ? 'Make it feel like you.' : 'A little closer to your people.'}</span>}
        {activeRoute === '/main' && <nav className="dashboard-account-nav" aria-label="Your account"><button className="dashboard-account-link" onClick={() => { window.location.hash = '/edit-profile' }} aria-label="Edit your profile"><ProfileAvatar profile={profile} size="small" /><span>{profile.name}</span></button><button className="dashboard-sign-out" onClick={signOut}>Sign out</button></nav>}
      </header>
      {notice && activeRoute === '/main' && <div className="profile-update-notice"><span role="status">{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notification"><CloseIcon /></button></div>}
      {activeRoute === '/' && <Welcome />}
      {activeRoute === '/create-profile' && <CreateProfile key="create" onComplete={completeProfile} onColorChange={setDraftColor} onExit={() => { window.location.hash = '/' }} />}
      {activeRoute === '/edit-profile' && <CreateProfile key="edit" mode="edit" initialProfile={profile} onComplete={updateProfile} onColorChange={setDraftColor} onExit={() => { window.location.hash = '/main' }} />}
      {activeRoute === '/sign-in' && <SignIn onSignIn={signInAsDev} />}
      {activeRoute === '/main' && <MainPage key={profile.id || profile.username} profile={profile} onEdit={() => { window.location.hash = '/edit-profile' }} />}
      <footer className="site-footer">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
        A little hello can go a long way.
      </footer>
    </div>
  )
}
