import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function ClickCapture({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) })
  return null
}

export default function KigaliMap({ selectedLat, selectedLng, onMapClick, score }) {
  const center = [-1.9441, 30.0619]

  const scoreColor =
    score >= 0.70 ? '#22c55e' :
    score >= 0.45 ? '#f59e0b' :
    score != null  ? '#ef4444' :
                     '#3b5bdb'

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickCapture onMapClick={onMapClick} />

      {selectedLat && selectedLng && (
        <>
          <Marker position={[selectedLat, selectedLng]} icon={selectedIcon}>
            <Popup>
              <strong>Selected location</strong><br />
              {selectedLat.toFixed(4)}, {selectedLng.toFixed(4)}<br />
              {score != null && <span>Score: {Math.round(score * 100)}/100</span>}
            </Popup>
          </Marker>
          <Circle
            center={[selectedLat, selectedLng]}
            radius={300}
            pathOptions={{ color: scoreColor, fillColor: scoreColor, fillOpacity: 0.10, weight: 1.5 }}
          />
        </>
      )}
    </MapContainer>
  )
}
