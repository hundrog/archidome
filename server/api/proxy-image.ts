export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query.url as string;

  if (!url) return { error: 'No URL provided' };

  const response = await $fetch.raw(url);
  const blob = await response.blob();

  setResponseHeader(event, 'Content-Type', blob.type);
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*');
  
  return blob;
});