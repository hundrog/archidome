// composables/useFuzzCoords.ts
export function useFuzzCoords() {
  /**
   * Desplaza las coordenadas un máximo de `radiusKm` en dirección aleatoria.
   * Usa distribución uniforme dentro del círculo (no solo en el perímetro).
   *
   * @param lat       Latitud original
   * @param lng       Longitud original
   * @param radiusKm  Radio máximo de desplazamiento en km (default 0.5km)
   */
  function fuzzCoords(
    lat: number,
    lng: number,
    radiusKm: number = 0.5,
  ): { lat: number; lng: number } {
    // 1 grado de latitud ≈ 111.32 km (constante)
    // 1 grado de longitud ≈ 111.32 * cos(lat) km (varía según latitud)
    const latDegPerKm = 1 / 111.32;
    const lngDegPerKm = 1 / (111.32 * Math.cos((lat * Math.PI) / 180));

    // Punto aleatorio uniforme dentro del círculo
    // sqrt(u) para distribución uniforme (sin concentración en el centro)
    const u = Math.random();
    const v = Math.random();
    const w = radiusKm * Math.sqrt(u);
    const t = 2 * Math.PI * v;

    return {
      lat: lat + w * Math.cos(t) * latDegPerKm,
      lng: lng + w * Math.sin(t) * lngDegPerKm,
    };
  }

  return { fuzzCoords };
}
