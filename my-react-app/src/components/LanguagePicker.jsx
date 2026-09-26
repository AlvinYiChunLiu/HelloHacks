import { useState } from 'react'
import { LANGUAGES } from '../data/profileOptions'
import './LanguagePicker.css'

const searchable = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en')

export default function LanguagePicker({ value = [], onChange, error }) {
  const [query, setQuery] = useState('')
  const matches = LANGUAGES.filter((language) => searchable(language).includes(searchable(query.trim())))

  function toggle(language) {
    onChange(value.includes(language) ? value.filter((item) => item !== language) : [...value, language])
  }

  return (
    <div className="language-picker">
      <div className="form-field">
        <label htmlFor="languages">Languages you speak</label>
        <input id="languages" name="languages" type="search" autoComplete="off" placeholder="Search languages…" value={query} onChange={(event) => setQuery(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? 'languages-error' : 'languages-hint'} />
        <p id="languages-hint" className="field-hint">Select all the languages you speak.</p>
      </div>
      {value.length > 0 && <ul className="selected-languages" aria-label="Selected languages">{value.map((language) => <li key={language}><span>{language}</span><button type="button" onClick={() => toggle(language)} aria-label={`Remove ${language}`}><span aria-hidden="true">×</span></button></li>)}</ul>}
      <fieldset className="language-options">
        <legend className="sr-only">Choose languages</legend>
        <div className="language-options-scroll">
          {matches.map((language) => <label className={`language-option${value.includes(language) ? ' is-selected' : ''}`} key={language}><input type="checkbox" checked={value.includes(language)} onChange={() => toggle(language)} /><span>{language}</span></label>)}
          {!matches.length && <p className="select-empty" role="status">No matches. Try another search, or choose “Other language”.</p>}
        </div>
      </fieldset>
      <p className="language-selection-count" role="status">{value.length} {value.length === 1 ? 'language' : 'languages'} selected</p>
      {error && <p id="languages-error" className="field-error">{error}</p>}
    </div>
  )
}
