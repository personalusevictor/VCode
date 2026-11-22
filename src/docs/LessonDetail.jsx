import React from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { toggleArchive, useArchive } from "../workspace/archive";
import CodeBlock from "./components/CodeBlock";

export function LessonObjectives({ objectives }) {
  if (!objectives?.length) return null;
  return (
    <div className="lesson-objectives">
      <h3>Al terminar podrás</h3>
      <ul className="doc-tips">
        {objectives.map((objective) => (
          <li key={objective}>{objective}</li>
        ))}
      </ul>
    </div>
  );
}

export function LessonConcepts({ items, language }) {
  return items?.map(({ title, body, example }) => (
    <div className="lesson-concept" key={title}>
      <h3>{title}</h3>
      {body.map((paragraph, line) => (
        <p key={line}>{paragraph}</p>
      ))}
      {example && <CodeBlock language={language} code={example} />}
    </div>
  ));
}

export function LessonPractice({ practice, language }) {
  return (
    <section
      id="doc-practice"
      data-section="practice"
      className="doc-article-section lesson-practice"
    >
      <h2>{practice.title}</h2>
      <p>{practice.prompt}</p>
      <ol className="doc-tips">
        {practice.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {practice.expected && (
        <CodeBlock language="Salida esperada" code={practice.expected} />
      )}
      {practice.hint && (
        <details>
          <summary>Ver una pista</summary>
          <p>{practice.hint}</p>
        </details>
      )}
      <details>
        <summary>Ver la solución</summary>
        <p>{practice.answer}</p>
        {practice.code && (
          <CodeBlock language={language} code={practice.code} />
        )}
      </details>
    </section>
  );
}

export function LessonReferences({ references }) {
  if (!references?.length) return null;
  return (
    <div className="doc-related lesson-references">
      {references.map(({ title, href, detail }) => (
        <a key={href} href={href}>
          <span>
            <strong>{title}</strong>
            <small>{detail}</small>
          </span>
          <ArrowUpRight size={17} />
        </a>
      ))}
    </div>
  );
}

export function LessonFinish({ entry, next, previous }) {
  const done = useArchive().done.includes(entry.id);
  const [error, setError] = React.useState(false);
  const href = next
    ? `#lesson/${next.language}/${next.number}`
    : `#course/${entry.language}`;

  return (
    <div className="lesson-finish">
      <div className="lesson-finish-status">
        <button
          className={done ? "work-secondary" : "work-primary"}
          aria-pressed={done}
          onClick={() => setError(!toggleArchive("done", entry.id))}
        >
          <Check size={16} />{" "}
          {done ? "Lección completada" : "Marcar como completada"}
        </button>
        {error && <p role="alert">No se pudo guardar el avance.</p>}
      </div>
      <nav
        className="lesson-finish-navigation"
        aria-label="Navegar por el curso"
      >
        {previous && (
          <a
            href={`#lesson/${previous.language}/${previous.number}`}
            rel="prev"
          >
            <ArrowLeft size={16} />
            <span>
              <small>Lección anterior</small>
              <strong>{previous.title}</strong>
            </span>
          </a>
        )}
        <a
          href={href}
          rel={next ? "next" : undefined}
          className="lesson-finish-next"
        >
          <span>
            <small>{next ? "Siguiente lección" : "Has llegado al final"}</small>
            <strong>{next ? next.title : "Volver al temario"}</strong>
          </span>
          <ArrowRight size={16} />
        </a>
      </nav>
    </div>
  );
}
