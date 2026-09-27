import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function searchable(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en')
}

export default function SearchSelect({ id, name, options, value, onChange, placeholder, error, hintId }) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [menuPosition, setMenuPosition] = useState(null)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const popoverRef = useRef(null)
  const selected = options.find((option) => option.value === value)
  const search = searchable(query.trim())
  const matches = options.filter((option) => !search || query === selected?.label || searchable(`${option.label} ${option.value}`).includes(search))
  const activeOption = matches[activeIndex]

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex, listId])

  useLayoutEffect(() => {
    if (!open || !inputRef.current || typeof window === 'undefined') return undefined

    function updateMenuPosition() {
      const inputBounds = inputRef.current?.getBoundingClientRect()
      if (!inputBounds) return
      setMenuPosition({
        top: inputBounds.bottom,
        left: inputBounds.left,
        width: inputBounds.width,
        maxHeight: Math.max(60, Math.min(220, window.innerHeight - inputBounds.bottom - 12)),
      })
    }

    updateMenuPosition()
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateMenuPosition)
    if (inputRef.current && resizeObserver) resizeObserver.observe(inputRef.current)

    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
      resizeObserver?.disconnect()
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    function closeOnOutsidePointer(event) {
      if (wrapperRef.current?.contains(event.target) || popoverRef.current?.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [open])

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
    <>
      <div
        ref={wrapperRef}
        className="search-select"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget) && !popoverRef.current?.contains(event.relatedTarget)) setOpen(false)
        }}
      >
        <div className="search-input-wrap">
          <input
            ref={inputRef}
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
      </div>
      {open && menuPosition && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          className="select-popover"
          style={{ top: menuPosition.top, left: menuPosition.left, width: menuPosition.width }}
        >
          <ul id={listId} role="listbox" aria-labelledby={`${id}-label`} className="select-options" style={{ maxHeight: menuPosition.maxHeight }}>
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
        </div>,
        document.body,
      )}
    </>
  )
}
