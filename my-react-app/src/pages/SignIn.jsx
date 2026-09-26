import { useEffect, useRef, useState } from 'react'
import { ArrowIcon, BuddyMark } from '../components/Icons'
import './SignIn.css'

export default function SignIn({ onSignIn }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const titleRef = useRef(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  function handleSubmit(event) {
    event.preventDefault()
    if (username.trim() !== 'dev' || password !== 'dev') {
      setError('For this preview, use dev as both your username and password.')
      return
    }
    setPassword('')
    onSignIn()
  }

  return (
    <main className="placeholder-page">
      <BuddyMark className="placeholder-mark" />
      <p className="eyebrow">Welcome back</p>
      <h2 ref={titleRef} tabIndex={-1}>Sign in.</h2>
      <p>For testing, use <strong>dev</strong> for both fields.</p>
      <form className="dev-sign-in" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="sign-in-username">Username</label>
          <input
            id="sign-in-username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={username}
            aria-describedby={error ? 'sign-in-error' : undefined}
            aria-invalid={Boolean(error)}
            onChange={(event) => { setUsername(event.target.value); setError('') }}
          />
        </div>
        <div className="form-field">
          <label htmlFor="sign-in-password">Password</label>
          <div className="password-input"><input
            id="sign-in-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            aria-describedby={error ? 'sign-in-error' : undefined}
            aria-invalid={Boolean(error)}
            onChange={(event) => { setPassword(event.target.value); setError('') }}
          /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div>
        </div>
        {error && <p className="form-error" id="sign-in-error" role="alert">{error}</p>}
        <button className="continue-button" type="submit">Sign in<ArrowIcon /></button>
      </form>
      <button className="demo-entry" type="button" onClick={onSignIn}>Explore with the dev profile <ArrowIcon /></button>
      <a className="sign-in-button" href="#/">Back to start</a>
    </main>
  )
}