import React from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { references, guides, groups, languageName } from "../catalog";

export default function Sidebar({ entry, isReference }) {
  return (
    <nav className="reader-navigation" aria-label="Índice de consulta">
      <a
        className="reader-back"
        href={`#docs/${isReference ? "html" : entry.language}`}
      >
        <ArrowLeft size={14} /> Volver al índice
      </a>
      <div className="reader-navigation-title">
        <BookOpen size={16} />{" "}
        {isReference ? "Referencia HTML" : languageName(entry.language)}
      </div>
      {isReference
        ? groups.map(([id, title]) => (
            <details key={id} open={id === entry.group}>
              <summary>{title}</summary>
              {references
                .filter((item) => item.group === id)
                .map((item) => (
                  <a
                    key={item.id}
                    href={`#reference/${item.id}`}
                    aria-current={item.id === entry.id ? "page" : undefined}
                  >
                    {item.title}
                    <span>{item.description}</span>
                  </a>
                ))}
            </details>
          ))
        : guides
            .filter((item) => item.language === entry.language)
            .map((item) => (
              <a
                className="reader-guide-link"
                key={item.id}
                href={`#lesson/${item.language}/${item.number}`}
                aria-current={item.id === entry.id ? "page" : undefined}
              >
                <span>{String(item.number).padStart(2, "0")}</span>
                {item.title}
              </a>
            ))}
    </nav>
  );
}
