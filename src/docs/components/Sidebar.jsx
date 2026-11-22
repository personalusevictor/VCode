import React from "react";
import { ArrowLeft, BookOpen, ChevronDown } from "lucide-react";
import { groups, languageName } from "../taxonomy";
import { references } from "../catalog";
import { courseGuides } from "../../lib/curriculum";

export default function Sidebar({ entry }) {
  return (
    <nav className="reader-navigation" aria-label="Temario">
      <a className="reader-back" href={`#course/${entry.language}`}>
        <ArrowLeft size={14} /> Ver temario
      </a>
      <div className="reader-navigation-title">
        <BookOpen size={16} /> {languageName(entry.language)}
      </div>
      {courseGuides(entry.language).map((item, index) => (
        <a
          className="reader-guide-link"
          key={item.id}
          href={`#lesson/${item.language}/${item.number}`}
          aria-current={item.id === entry.id ? "page" : undefined}
        >
          <span>{String(index + 1).padStart(2, "0")}</span>
          {item.title}
        </a>
      ))}
    </nav>
  );
}

export function ReferenceSidebar({ entry }) {
  return (
    <nav className="reference-categories" aria-label="Índice de elementos HTML">
      <div className="reference-rail-title">Referencia HTML</div>
      {groups.map(([id, label]) => (
        <details key={id} open={id === entry.group}>
          <summary>
            {label} <ChevronDown size={13} aria-hidden="true" />
          </summary>
          <ul>
            {references
              .filter((item) => item.group === id)
              .map((item) => (
                <li key={item.id}>
                  <a
                    href={`#reference/${item.id}`}
                    aria-current={item.id === entry.id ? "page" : undefined}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
          </ul>
        </details>
      ))}
      <a className="reference-index-link" href="#docs/html//reference">
        Ver todo HTML
      </a>
    </nav>
  );
}
