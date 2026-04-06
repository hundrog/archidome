// composables/useGeolocation.ts
export function useGeolocation() {
  const coords = ref<{ lat: number; lng: number } | null>(null);
  const error = ref<string | null>(null);
  const loading = ref(false);

  async function request(): Promise<void> {
    if (!navigator?.geolocation) {
      error.value = "Tu navegador no soporta geolocalización";
      return;
    }

    loading.value = true;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          coords.value = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          loading.value = false;
          resolve();
        },
        () => {
          error.value = "No se pudo obtener tu ubicación";
          loading.value = false;
          resolve();
        },
        { timeout: 8000 },
      );
    });
  }

  return { coords, error, loading, request };
}
