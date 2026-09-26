import { useEffect, useRef, useState } from 'react'
import { ArrowIcon, BuddyMark } from '../components/Icons'
import './SignIn.css'

export default function SignIn({ onSignIn }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!username.trim() || !password) {
      setError('Enter your username and password.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onSignIn(username.trim(), password)
      setPassword('')
    } catch (loginError) {
      setError(loginError?.message || 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="placeholder-page">
      <BuddyMark className="placeholder-mark" />
      <p className="eyebrow">Welcome back</p>
      <h2 ref={titleRef} tabIndex={-1}>Sign in.</h2>
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
        <button className="continue-button" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}<ArrowIcon /></button>
      </form>
      <a className="sign-in-button" href="#/">Back to start</a>
    </main>
  )
}