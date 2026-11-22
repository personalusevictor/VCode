import { useEffect, useState } from "react";

let worker;
let serial = 0;
const requests = new Map();

function searchWorker() {
  if (worker) return worker;
  const instance = new Worker(
    new URL("./knowledge-query.worker.js", import.meta.url),
    { type: "module" },
  );
  instance.onmessage = ({ data }) => {
    requests.get(data.id)?.(data);
    requests.delete(data.id);
  };
  instance.onerror = () => {
    instance.terminate();
    worker = null;
    for (const notify of requests.values()) notify({ error: true });
    requests.clear();
  };
  worker = instance;
  return worker;
}

export default function useKnowledge(
  {
    language = "all",
    kind = "all",
    category = "all",
    query = "",
    limit = 24,
    includeCourses = false,
    ids,
  },
  enabled = true,
) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const key = enabled
    ? JSON.stringify({ language, kind, category, query, includeCourses, ids })
    : "";
  const scope = JSON.stringify([language, kind, category, includeCourses, ids]);
  const current =
    key && result?.key === key && result.attempt === attempt ? result : null;

  useEffect(() => {
    if (!key) {
      setResult(null);
      return;
    }
    const id = ++serial;
    try {
      const request = { ...JSON.parse(key), limit };
      const instance = searchWorker();
      requests.set(id, ({ result, error }) =>
        setResult({
          key,
          attempt,
          limit,
          query: request.query,
          scope,
          data: result,
          error,
        }),
      );
      instance.postMessage({
        id,
        request,
        base: new URL(import.meta.env.BASE_URL, location.href).href,
      });
      return () => {
        if (requests.delete(id) && worker === instance)
          instance.postMessage({ cancel: id });
      };
    } catch {
      requests.delete(id);
      setResult({ key, attempt, error: true });
    }
  }, [key, limit, attempt, scope]);

  return {
    data: current?.data,
    error: current?.error,
    previous: enabled && result?.scope === scope && result.data ? result : null,
    loading: enabled && !current?.error && current?.limit !== limit,
    retry: () => setAttempt((value) => value + 1),
  };
}
