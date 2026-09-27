import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './CampusMap.css'

const UBC_CENTER = [49.2668, -123.246]
// This bounds the full UBC Vancouver campus footprint, including the south campus area.
const UBC_CAMPUS_BOUNDS = L.latLngBounds(
  [49.2425, -123.263],
  [49.274, -123.227],
)
const TILE_URL = import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

function flagEmoji(countryCode) {
  if (!/^[A-Z]{2}$/.test(countryCode || '')) return '🌐'
  return [...countryCode].map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0))).join('')
}

function timeLabel(event) {
  const start = new Date(event.startsAt).toLocaleString('en', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  const end = new Date(event.endsAt).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })
  return `${start} – ${end}`
}

function popupContent(event, isGoing, onGoing) {
  const card = document.createElement('div')
  card.className = 'hangout-popup'
  const label = document.createElement('span')
  label.className = 'hangout-popup-label'
  label.textContent = 'CAMPUS HANGOUT'
  const title = document.createElement('strong')
  title.textContent = event.title
  const author = document.createElement('span')
  author.className = 'hangout-popup-author'
  author.textContent = `${flagEmoji(event.author?.nationality)}  ${event.author?.name || 'UBC student'}`
  const time = document.createElement('span')
  time.className = 'hangout-popup-time'
  time.textContent = timeLabel(event)
  const place = document.createElement('span')
  place.className = 'hangout-popup-place'
  place.textContent = event.displayLocation || event.location
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `hangout-rsvp-button${isGoing ? ' is-going' : ''}`
  button.textContent = isGoing ? '✓  You’re going' : 'I’m going'
  button.setAttribute('aria-pressed', String(isGoing))
  button.disabled = isGoing
  button.addEventListener('click', (clickEvent) => {
    clickEvent.stopPropagation()
    onGoing(event)
  })
  card.append(label, title, author, time, place, button)
  return card
}

export default function CampusMap({ events, goingIds, selectedEventId, onSelectEvent, onGoing }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return undefined
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      maxBounds: UBC_CAMPUS_BOUNDS,
      maxBoundsViscosity: 1,
      minZoom: 14,
    }).setView(UBC_CENTER, 14)
    L.tileLayer(TILE_URL, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
    }).addTo(map)
    mapRef.current = map
    markersRef.current = L.featureGroup().addTo(map)
    const frame = window.requestAnimationFrame(() => map.invalidateSize())
    return () => {
      window.cancelAnimationFrame(frame)
      map.remove()
      mapRef.current = null
      markersRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = markersRef.current
    if (!map || !layer) return
    layer.clearLayers()
    const markers = new Map()

    events.forEach((event) => {
      const marker = L.marker([event.latitude, event.longitude], {
        title: event.title,
        alt: event.title,
        icon: L.divIcon({
          className: 'hangout-map-icon',
          html: '<span aria-hidden="true"></span>',
          iconSize: [34, 42],
          iconAnchor: [17, 39],
          popupAnchor: [0, -34],
        }),
      })
        .bindPopup(() => popupContent(event, goingIds.has(event.id), onGoing), { maxWidth: 270, minWidth: 220, className: 'hangout-leaflet-popup' })
        .addTo(layer)
      marker.on('click', () => onSelectEvent(event.id))
      markers.set(event.id, marker)
    })

    const selected = markers.get(selectedEventId)
    if (selected) {
      map.flyTo(selected.getLatLng(), 16, { duration: 0.45 })
      selected.openPopup()
    } else if (layer.getLayers().length) {
      map.fitBounds(layer.getBounds().pad(0.18), { maxZoom: 15 })
    } else {
      map.setView(UBC_CENTER, 14)
    }
  }, [events, goingIds, selectedEventId, onGoing, onSelectEvent])

  return <div ref={containerRef} className="campus-map-canvas" role="application" aria-label="Interactive map of UBC campus hangouts" />
}
