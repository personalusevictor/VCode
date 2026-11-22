export const phpMethods = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];
export const phpRequestFormats = {
  form: "application/x-www-form-urlencoded",
  json: "application/json",
};

export function readPhpRequest(input) {
  return {
    method: phpMethods.includes(input?.method) ? input.method : "GET",
    query: typeof input?.query === "string" ? input.query.slice(0, 2000) : "",
    format: Object.hasOwn(phpRequestFormats, input?.format)
      ? input.format
      : "form",
    body: typeof input?.body === "string" ? input.body.slice(0, 8000) : "",
  };
}

export const allowsRequestBody = (method) =>
  method !== "GET" && method !== "HEAD";
export const hasPhpRequest = (request) =>
  request.method !== "GET" || Boolean(request.query.trim());

export function phpRequestOptions(input, file) {
  const request = readPhpRequest(input);
  if (!hasPhpRequest(request)) return {};
  const { method, query, format, body } = request;
  const params = new URLSearchParams(query.trim()).toString();
  return {
    method,
    relativeUri: `/${file}${params ? `?${params}` : ""}`,
    ...(allowsRequestBody(method) && {
      headers: { "Content-Type": phpRequestFormats[format] },
      body,
    }),
  };
}
