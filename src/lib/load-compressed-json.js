export async function loadCompressedJson(file, base) {
  const response = await fetch(new URL(file, base));
  if (!response.ok || !response.body)
    throw new Error("No se pudo cargar el contenido.");
  if (response.headers.get("content-encoding") === "gzip")
    return response.json();
  const data = response.body.pipeThrough(new DecompressionStream("gzip"));
  return new Response(data).json();
}
