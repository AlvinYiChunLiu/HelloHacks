import './ProfileAvatar.css'

export default function ProfileAvatar({ profile, size = 'medium' }) {
  const color = /^#[0-9a-f]{6}$/i.test(profile?.favoriteColor || '') ? profile.favoriteColor : '#2457d6'
  const initials = (profile?.name || 'You').trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join('').toUpperCase()
  return (
    <span className={`profile-avatar profile-avatar--${size}`} style={{ '--profile-color': color }} role="img" aria-label={`${profile?.name || 'Your'} profile icon`}>
      <span aria-hidden="true">{initials}</span>
    </span>
  )
}