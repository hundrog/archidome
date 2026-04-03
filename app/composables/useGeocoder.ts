// composables/useGeocoder.ts
export function useGeocoder() {
  const loading = ref(false)
  const error   = ref<string | null>(null)

  async function geocode(query: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
    loading.value = true
    error.value   = null

    try {
      // Llama al server endpoint interno en lugar de Nominatim directo
      const data = await $fetch<{
        found: boolean
        result: { lat: number; lng: number; displayName: string } | null
      }>('/api/geocode', { query: { q: query } })

      if (!data.found || !data.result) {
        error.value = 'No se encontró la ubicación'
        return null
      }

      return data.result
    } catch (err: any) {
      error.value = err?.data?.message ?? 'Error al buscar la ubicación'
      return null
    } finally {
      loading.value = false
    }
  }

  return { geocode, loading, error }
}