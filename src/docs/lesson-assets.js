const assetUrls = import.meta.glob("../assets/lesson-media/*", {
  eager: true,
  query: "?url",
  import: "default",
});
const pending = new Map();

export function lessonAssetUrl(filename) {
  return assetUrls[`../assets/lesson-media/${filename}`];
}

async function readAsset(filename) {
  const url = lessonAssetUrl(filename);
  if (!url) throw new Error(`No encontramos el recurso ${filename}.`);
  if (url.startsWith("data:")) return url;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar ${filename}.`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function asDataUrl(filename) {
  if (!pending.has(filename))
    pending.set(
      filename,
      readAsset(filename).catch((error) => {
        pending.delete(filename);
        throw error;
      }),
    );
  return pending.get(filename);
}

export async function inlineLessonAssets(markup, filenames) {
  const entries = await Promise.all(
    filenames.map(async (filename) => [filename, await asDataUrl(filename)]),
  );
  const urls = new Map(entries);
  const template = document.createElement("template");
  template.innerHTML = markup;
  for (const node of template.content.querySelectorAll(
    "[src], [poster], [srcset]",
  )) {
    for (const attribute of ["src", "poster"]) {
      const url = urls.get(node.getAttribute(attribute));
      if (url) node.setAttribute(attribute, url);
    }
    const candidates = node.getAttribute("srcset");
    if (candidates)
      node.setAttribute(
        "srcset",
        candidates
          .split(/([\s,]+)/)
          .map((value) => urls.get(value) ?? value)
          .join(""),
      );
  }
  return template.innerHTML;
}
