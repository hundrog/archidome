export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query.url as string;

  if (!url) throw createError({ statusCode: 400, message: 'URL requerida' });

  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type');

    // Headers vitales para que html-to-image no falle
    setResponseHeader(event, 'Content-Type', contentType || 'image/png');
    setResponseHeader(event, 'Access-Control-Allow-Origin', '*');
    setResponseHeader(event, 'Cache-Control', 'no-cache');

    return Buffer.from(buffer);
  } catch (e) {
    throw createError({ statusCode: 500, message: 'Error al obtener la imagen' });
  }
});