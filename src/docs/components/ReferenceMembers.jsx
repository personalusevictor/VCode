import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { ReferenceSection } from "./ReferenceSection";

export default function ReferenceMembers({
  items,
  title,
  sectionId,
  filterLabel,
  className = "",
}) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const matches = items.filter(({ title, kind }) =>
    `${title} ${kind || ""}`.toLowerCase().includes(normalized),
  );
  if (!items.length) return null;
  return (
    <ReferenceSection
      id={sectionId}
      title={title}
      className={`reference-members ${className}`}
    >
      {items.length > 12 && (
        <input
          type="search"
          aria-label={filterLabel}
          placeholder={filterLabel}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      )}
      {matches.length ? (
        <ul className="work-link-list">
          {matches.map((item) => (
            <li key={item.id}>
              <a href={`#symbol/${item.id}`}>
                <span>
                  <code>{item.title}</code>
                  {item.kind && <small>{item.kind}</small>}
                </span>
                <ArrowUpRight size={15} />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p role="status">Ninguna entrada coincide.</p>
      )}
    </ReferenceSection>
  );
}
