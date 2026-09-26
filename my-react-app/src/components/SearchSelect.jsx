import { useEffect, useId, useState } from 'react'

function searchable(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en')
}

export default function SearchSelect({ id, name, options, value, onChange, placeholder, error, hintId }) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const selected = options.find((option) => option.value === value)
  const search = searchable(query.trim())
  const matches = options.filter((option) => !search || query === selected?.label || searchable(`${option.label} ${option.value}`).includes(search))
  const activeOption = matches[activeIndex]

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex, listId])

  function choose(option) {
    onChange(option.value)
    setQuery(option.label)
    setOpen(false)
  }

  function moveTo(index) {
    const next = Math.max(0, Math.min(matches.length - 1, index))
    setActiveIndex(next)
    document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: 'nearest' })
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setQuery('')
        setOpen(true)
        setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)))
      } else {
        moveTo(activeIndex + (event.key === 'ArrowDown' ? 1 : -1))
      }
    } else if (event.key === 'Enter' && open) {
      event.preventDefault()
      if (activeOption) choose(activeOption)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    } else if (event.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div className="search-select" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
    }}>
      <div className="search-input-wrap">
        <input
          id={id}
          name={name}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-activedescendant={open && activeOption ? `${listId}-${activeIndex}` : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hintId}
          autoComplete="off"
          spellCheck={false}
          required
          placeholder={placeholder}
          value={open ? query : selected?.label || ''}
          onFocus={() => {
            setQuery(selected?.label || '')
            setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)))
            setOpen(true)
          }}
          onClick={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
            setOpen(true)
            onChange('')
          }}
          onKeyDown={handleKeyDown}
        />
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      {open && (
        <div className="select-popover">
          <ul id={listId} role="listbox" aria-labelledby={`${id}-label`} className="select-options">
            {matches.map((option, index) => (
              <li
                id={`${listId}-${index}`}
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                className={index === activeIndex ? 'is-active' : ''}
                onPointerDown={(event) => event.preventDefault()}
                onPointerMove={() => setActiveIndex(index)}
                onClick={() => choose(option)}
              >
                <span>{option.label}</span>
                {option.value === value && <span aria-hidden="true">&#10003;</span>}
              </li>
            ))}
          </ul>
          {!matches.length && <p className="select-empty" role="status">No matches. Try another search.</p>}
        </div>
      )}
    </div>
  )
}
