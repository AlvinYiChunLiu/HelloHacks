import { useState } from 'react'
import countries from '../data/countries.json'

export default function CountryFlag({ code, className = '' }) {
  const [failedCode, setFailedCode] = useState('')
  const country = countries.find((item) => item.code === code)
  if (!country || failedCode === code) {
    return <span className={`country-flag country-flag-fallback ${className}`} role="img" aria-label={country ? `${country.name} flag unavailable` : 'Country not selected'}>{country?.code || '--'}</span>
  }
  return (
    <img
      className={`country-flag ${className}`}
      src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
      width="40"
      height="30"
      alt={`${country.name} flag`}
      referrerPolicy="no-referrer"
      onError={() => setFailedCode(code)}
    />
  )
}