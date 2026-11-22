import React from "react";
import referenceLessons from "../../data/reference-lessons.json";
import { LessonReferences } from "../LessonDetail";
import { ReferenceSection } from "./ReferenceSection";

export default function ReferenceLessons({ href, language, linkedLesson }) {
  const choices = (referenceLessons[href] || []).filter(
    (guide) => guide.language !== language || guide.number !== linkedLesson,
  );
  if (!choices.length) return null;
  return (
    <ReferenceSection
      id="lessons"
      title="Aprende con esta referencia"
      label="Guías"
    >
      <LessonReferences
        references={choices.map((guide) => ({
          title: guide.title,
          href: `#lesson/${guide.language}/${guide.number}`,
          detail: `${guide.level} · ${guide.minutes} min`,
        }))}
      />
    </ReferenceSection>
  );
}
