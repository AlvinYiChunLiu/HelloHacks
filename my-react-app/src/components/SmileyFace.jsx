export default function SmileyFace({ expression = 'smile' }) {
  return (
    <svg className="smiley-face" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="27" fill="currentColor" opacity="0.16" />
      <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <g stroke="#293241" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {expression === 'calm' ? (
          <><path d="M19 27q4 5 8 0" /><path d="M37 27q4 5 8 0" /></>
        ) : (
          <>
            <path d="M23 25v3" />
            {expression === 'wink' ? <path d="M37 27q4-4 8 0" /> : <path d="M41 25v3" />}
          </>
        )}
        {expression === 'grin' ? (
          <path d="M19 36h26c-1 16-25 16-26 0Z" fill="#fff" />
        ) : expression === 'surprised' ? (
          <ellipse cx="32" cy="41" rx="5" ry="7" fill="#fff" />
        ) : (
          <path d={expression === 'calm' ? 'M25 39q7 5 14 0' : 'M21 37q11 13 22 0'} />
        )}
      </g>
    </svg>
  )
}
