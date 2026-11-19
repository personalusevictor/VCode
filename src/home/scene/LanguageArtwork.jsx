import React, { lazy, Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
const LanguageSculpture = lazy(() => import("./LanguageSculpture.jsx"));
export default function LanguageArtwork({ course, paused = false }) {
  return (
    <a
      className="language-artwork language-artwork-sculpture sculpture-entry"
      href={`#course/${course.id}`}
      aria-label={`Aprende ${course.name}`}
    >
      <Suspense fallback={null}>
        <LanguageSculpture key={course.id} id={course.id} paused={paused} />
      </Suspense>
      <span className="sculpture-open">
        Aprende {course.name}
        <ArrowUpRight size={14} />
      </span>
    </a>
  );
}
