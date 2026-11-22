import { useEffect, useState } from "react";

export default function useSettledQuery(query) {
  const [settled, setSettled] = useState(query);

  useEffect(() => {
    if (query === settled) return;
    const timer = setTimeout(() => setSettled(query), 160);
    return () => clearTimeout(timer);
  }, [query, settled]);

  return [settled, setSettled];
}
