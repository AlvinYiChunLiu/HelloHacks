import { useEffect, useRef, useState } from 'react'
import './ChangePasswordDialog.css'

export default function ChangePasswordDialog({ username, onClose, onChanged }) {
  const dialogRef = useRef(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => { if (dialog?.open) dialog.close() }
  }, [])

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (newPassword.length < 8 || newPassword.length > 128) {
      setError('Use a new password with 8 to 128 characters.')
      return
    }
    if (newPassword !== confirmation) {
      setError('The new passwords do not match.')
      return
    }
    if (newPassword === currentPassword) {
      setError('Choose a new password that differs from your current one.')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('http://localhost:5000/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, currentPassword, newPassword }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Unable to change your password.')
      onChanged()
      onClose()
    } catch (requestError) {
      setError(requestError.message || 'Unable to connect. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog ref={dialogRef} className="change-password-dialog" aria-labelledby="change-password-title" onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <form className="change-password-content" onSubmit={submit}>
        <button className="change-password-close" type="button" aria-label="Close" onClick={onClose}>×</button>
        <p className="eyebrow">ACCOUNT SECURITY</p>
        <h2 id="change-password-title">Change password</h2>
        <p className="change-password-description">Enter your current password, then choose a new one.</p>
        <label>Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label>
        <label>New password<input type="password" autoComplete="new-password" minLength={8} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></label>
        <label>Confirm new password<input type="password" autoComplete="new-password" minLength={8} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>
        {error && <p className="change-password-error" role="alert">{error}</p>}
        <div className="change-password-actions"><button type="button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Update password'}</button></div>
      </form>
    </dialog>
  )
}
