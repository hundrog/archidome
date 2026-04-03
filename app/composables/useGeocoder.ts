// composables/useGeocoder.ts
export function useGeocoder() {
  const loading = ref(false)
  const error   = ref<string | null>(null)

  async function geocode(query: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
    loading.value = true
    error.value   = null

    try {
      const params = new URLSearchParams({
        q:              query,
        format:         'json',
        limit:          '1',
        addressdetails: '1'
      })

      const res  = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { 'Accept-Language': 'es', 'User-Agent': 'TuApp/1.0' }
      })
      const data = await res.json()

      if (!data.length) {
        error.value = 'No se encontró la ubicación'
        return null
      }

      const place = data[0]
      return {
        lat:         parseFloat(place.lat),
        lng:         parseFloat(place.lon),
        displayName: place.display_name
      }
    } catch (e) {
      error.value = 'Error al buscar la ubicación'
      return null
    } finally {
      loading.value = false
    }
  }

  return { geocode, loading, error }
}
