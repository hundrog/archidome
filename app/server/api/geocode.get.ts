// server/api/geocode.get.ts
export default defineEventHandler(async (event) => {
  const { q } = getQuery(event);

  if (typeof q !== 'string' || q.startsWith("http") || q.includes("://") || q.includes("localhost")) {
    throw createError({ statusCode: 400, message: "Query inválida" });
  }

  if (!q || q.trim().length < 3) {
    throw createError({ statusCode: 400, message: "Query demasiado corta" });
  }

  if (q.length > 200) {
    throw createError({ statusCode: 400, message: "Query demasiado larga" });
  }

  try {
    const params = new URLSearchParams({
      q: q.trim(),
      format: "json",
      limit: "1",
      addressdetails: "1",
    });

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "User-Agent": "TuApp/1.0 (tuapp@email.com)", // 🔧 Cambia esto
          "Accept-Language": "es",
        },
      },
    );

    if (!res.ok) {
      throw createError({
        statusCode: 502,
        message: "Error al contactar el geocoder",
      });
    }

    const data = await res.json();

    if (!data.length) {
      return { found: false, result: null };
    }

    const place = data[0];
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);

    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw createError({
        statusCode: 502,
        message: "Respuesta inválida del geocoder",
      });
    }
    return {
      found: true,
      result: {
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        displayName: place.display_name,
      },
    };
  } catch (err: any) {
    console.error(
      `[geocode] error ip=${getRequestHeader(event, "x-forwarded-for")} q=${q}`,
      err,
    );
    if (err.statusCode) throw err;
    throw createError({
      statusCode: 500,
      message: "Error interno del geocoder",
    });
  }
});
