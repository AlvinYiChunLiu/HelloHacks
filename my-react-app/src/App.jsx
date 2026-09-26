import { useEffect, useRef, useState } from 'react'
import { ArrowIcon, BuddyMark } from './components/Icons'
import CreateProfile from './pages/CreateProfile'
import SignIn from './pages/SignIn'
import './App.css'

const DEV_SESSION_KEY = 'interbuddies.dev-preview'
const DEV_PROFILE = { name: 'Dev', username: 'dev', isDev: true }

function readDevProfile() {
  try {
    return sessionStorage.getItem(DEV_SESSION_KEY) === 'dev' ? DEV_PROFILE : null
  } catch {
    return null
  }
}

function readRoute() {
  const path = window.location.hash.slice(1) || '/'
  return ['/create-profile', '/sign-in', '/main'].includes(path) ? path : '/'
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

function Placeholder({ route, profile }) {
  const titleRef = useRef(null)
  const signingIn = route === '/sign-in'
  useEffect(() => { titleRef.current?.focus() }, [route])
  return (
    <main className="placeholder-page">
      <BuddyMark className="placeholder-mark" />
      <p className="eyebrow">{signingIn || profile?.isDev ? 'Welcome back' : profile ? 'Profile created' : 'Your buddy space'}</p>
      <h2 ref={titleRef} tabIndex={-1}>{signingIn ? 'Sign in is coming next.' : profile ? `You’re all set, ${profile.name}.` : 'Good company is on its way.'}</h2>
      <p>{signingIn ? 'This is where you’ll sign in to your InterBuddies profile.' : profile && !profile.isDev ? 'Your profile is saved. Your main page will be here soon.' : 'Your InterBuddies main page will be here soon.'}</p>
      <a className="sign-in-button" href="#/">Back to start</a>
    </main>
  )
}

export default function App() {
  const [route, setRoute] = useState(readRoute)
  const [createdProfile, setCreatedProfile] = useState(readDevProfile)

  useEffect(() => {
    const handleRoute = () => {
      setRoute(readRoute())
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    window.addEventListener('hashchange', handleRoute)
    return () => window.removeEventListener('hashchange', handleRoute)
  }, [])

  function completeProfile(profile) {
    try {
      sessionStorage.removeItem(DEV_SESSION_KEY)
    } catch { /* The preview can also run with browser storage disabled. */ }
    setCreatedProfile(profile)
    window.location.hash = '/main'
  }

  function signInAsDev() {
    try {
      sessionStorage.setItem(DEV_SESSION_KEY, 'dev')
    } catch { /* Keep the preview session in React state if storage is unavailable. */ }
    setCreatedProfile(DEV_PROFILE)
    window.location.hash = '/main'
  }

  return (
    <div className={`home${route === '/create-profile' ? ' onboarding-shell' : ''}`}>
      <header className="site-header">
        <a className="brand" href="#/" aria-label="InterBuddies start page"><BuddyMark className="brand-mark" /><h1>InterBuddies</h1></a>
        {route === '/create-profile' && <span className="header-note">A little closer to your people.</span>}
      </header>
      {route === '/' && <Welcome />}
      {route === '/create-profile' && <CreateProfile onComplete={completeProfile} onExit={() => { window.location.hash = '/' }} />}
      {route === '/sign-in' && <SignIn onSignIn={signInAsDev} />}
      {route === '/main' && <Placeholder route={route} profile={createdProfile} />}
      <footer className="site-footer">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
        A little hello can go a long way.
      </footer>
    </div>
  )
}
