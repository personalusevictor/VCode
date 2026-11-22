import React from "react";
import { techIcon } from "../lib/catalog";

export function Mark({ className = "" }) {
  return (
    <svg className={`mark ${className}`} viewBox="0 0 64 64" aria-hidden="true">
      <path
        fill="var(--blue)"
        d="M8 9h32v12H20v22h20v12H8ZM46 9h13L39 55H26Z"
      />
    </svg>
  );
}

export function TechIcon({ id, className = "" }) {
  return (
    <img
      className={`tech-icon ${className}`}
      src={techIcon(id)}
      alt=""
      width="40"
      height="40"
    />
  );
}
