import React, { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

function Highlight({ code }) {
  const parts = code.split(
    /("[^"\n]*"|'[^'\n]*'|<!--[\s\S]*?-->|\/\/[^\n]*|\b(?:const|let|function|return|import|from|export|if|else|async|await|SELECT|FROM|WHERE|JOIN|class|public|new)\b|<\/?[\w-]+|\b\d+(?:\.\d+)?\b)/g,
  );
  return parts.map((part, index) => (
    <span
      key={index}
      className={
        /^['"]/.test(part)
          ? "syntax-string"
          : /^<!--|^\/\//.test(part)
            ? "syntax-comment"
            : /^<|^(const|let|function|return|import|from|export|if|else|async|await|SELECT|FROM|WHERE|JOIN|class|public|new)$/.test(
                  part,
                )
              ? "syntax-keyword"
              : /^\d/.test(part)
                ? "syntax-number"
                : undefined
      }
    >
      {part}
    </span>
  ));
}

export default function CodeBlock({ code, language = "HTML" }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const pre = useRef();
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setError("");
    } catch {
      setError("Selecciona el código para copiarlo.");
      pre.current?.focus();
    }
  }
  return (
    <div className="reference-code">
      <div className="reference-code-toolbar">
        <span>{language}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copiar código ${language}`}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}{" "}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre ref={pre} tabIndex={0} aria-label={`Código ${language}`}>
        <code>
          <Highlight code={code} />
        </code>
      </pre>
      <span className={error ? "code-feedback" : "sr-only"} role="status">
        {error || (copied ? "Código copiado al portapapeles." : "")}
      </span>
    </div>
  );
}
