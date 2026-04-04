// server/api/reverse-geocode.get.ts
export default defineEventHandler(async (event) => {
  const { lat, lng } = getQuery(event)

  if (!lat || !lng) {
    throw createError({ statusCode: 400, message: 'Coordenadas requeridas' })
  }

  const latNum = parseFloat(lat as string)
  const lngNum = parseFloat(lng as string)

  if (isNaN(latNum) || isNaN(lngNum) ||
      latNum < -90 || latNum > 90 ||
      lngNum < -180 || lngNum > 180) {
    throw createError({ statusCode: 400, message: 'Coordenadas inválidas' })
  }

  const params = new URLSearchParams({
    lat:    String(latNum),
    lon:    String(lngNum),
    format: 'json',
    zoom:   '10' // nivel ciudad, no calle
  })

  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params}`,
    {
      headers: {
        'User-Agent':      'TuApp/1.0 (tuapp@email.com)',
        'Accept-Language': 'es'
      }
    }
  )

  const data = await res.json()
  if (!data || data.error) {
    return { found: false, locationName: null }
  }

  // Extraer solo ciudad/estado, no dirección exacta
  const addr = data.address
  const locationName = [
    addr.city ?? addr.town ?? addr.village ?? addr.county,
    addr.state
  ].filter(Boolean).join(', ')

  return { found: true, locationName }
})