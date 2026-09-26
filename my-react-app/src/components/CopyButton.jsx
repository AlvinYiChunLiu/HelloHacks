import { useEffect, useRef, useState } from 'react'

export default function CopyButton({ text, label = 'Copy', className = '' }) {
  const [state, setState] = useState('idle')
  const timer = useRef(null)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copy() {
    window.clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
    } catch {
      setState('failed')
    }
    timer.current = window.setTimeout(() => setState('idle'), 3000)
  }

  return (
    <span className="copy-action">
      <button type="button" className={`copy-button ${className}`} onClick={copy} aria-label={state === 'copied' ? 'Copied to clipboard' : label}>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">{state === 'copied' ? <path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : <><rect x="7" y="7" width="9" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M12 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.5" /></>}</svg>
        <span>{state === 'copied' ? 'Copied!' : 'Copy'}</span>
      </button>
      <span className={state === 'failed' ? 'copy-error' : 'sr-only'} role="status">{state === 'failed' ? 'Could not copy. Select the text to copy it manually.' : state === 'copied' ? 'Copied to clipboard.' : ''}</span>
    </span>
  )
}