export function validatePredictForm({ lat, lng, footTraffic, infraScore, competitors }) {
  const errors = {}

  if (lat === '' || lat === null || lat === undefined) {
    errors.lat = 'Latitude is required'
  } else if (isNaN(parseFloat(lat)) || parseFloat(lat) < -3.0 || parseFloat(lat) > -1.0) {
    errors.lat = 'Latitude must be within Rwanda (-3.0 to -1.0)'
  }

  if (lng === '' || lng === null || lng === undefined) {
    errors.lng = 'Longitude is required'
  } else if (isNaN(parseFloat(lng)) || parseFloat(lng) < 28.8 || parseFloat(lng) > 30.9) {
    errors.lng = 'Longitude must be within Rwanda (28.8 to 30.9)'
  }

  if (footTraffic !== '') {
    const v = parseFloat(footTraffic)
    if (isNaN(v) || v < 0 || v > 10) errors.footTraffic = 'Must be between 0 and 10'
  }

  if (infraScore !== '') {
    const v = parseFloat(infraScore)
    if (isNaN(v) || v < 0 || v > 10) errors.infraScore = 'Must be between 0 and 10'
  }

  if (competitors !== '') {
    const v = parseInt(competitors)
    if (isNaN(v) || v < 0 || v > 100) errors.competitors = 'Must be between 0 and 100'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}