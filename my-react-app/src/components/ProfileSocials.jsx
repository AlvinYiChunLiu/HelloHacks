import CopyButton from './CopyButton'
import './ProfileSocials.css'

export default function ProfileSocials({ accounts = [], compact = false }) {
  const selected = accounts.filter((account) => account?.platform)
  if (!selected.length) return null
  const visible = compact ? selected.slice(0, 2) : selected

  return (
    <section className={`profile-socials${compact ? ' profile-socials--compact' : ''}`} aria-label="Social media">
      {!compact && <h3>Find me on</h3>}
      <ul>
        {visible.map(({ platform, username }) => (
          <li key={platform}>
            <span className="social-platform-name">{platform}</span>
            {username?.trim() && <div className="social-handle-group"><span className="social-platform-handle">@{username.trim().replace(/^@+/, '')}</span>{!compact && <CopyButton text={`@${username.trim().replace(/^@+/, '')}`} label={`Copy ${platform} username`} />}</div>}
          </li>
        ))}
      </ul>
      {compact && selected.length > visible.length && <span className="social-more">+{selected.length - visible.length} more in profile</span>}
    </section>
  )
}
