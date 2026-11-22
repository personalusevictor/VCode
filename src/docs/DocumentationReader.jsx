import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Link as LinkIcon,
  Check,
  List,
} from "lucide-react";
import { TechIcon } from "../app/Brand";
import { rememberEntry } from "../lib/readingHistory";
import { courseGuides } from "../lib/curriculum";
import { usePreferences } from "../app/Preferences";
import { references, guides, referenceById } from "./catalog";
import { groupLabel, languageName } from "./taxonomy";
import LearningActions from "../workspace/LearningActions";
import { sources } from "../workspace/study-data";
import { practiceForLanguage, practiceUrl } from "../workspace/practice";
import Sidebar, { ReferenceSidebar } from "./components/Sidebar";
import Example from "./components/Example";
import CssLessonPreview from "./components/CssLessonPreview";
import CodeBlock from "./components/CodeBlock";
import ReferenceLessons from "./components/ReferenceLessons";
import { ReferenceContents } from "./components/ReferenceSection";
import elementMeta from "./data/html-element-meta.json";
import attributeIds from "./data/html-attribute-ids.json";
import attributeBriefs from "./data/html-attribute-briefs.json";
import spanishBriefs from "./data/html-attribute-briefs-es.json";
import {
  LessonConcepts,
  LessonFinish,
  LessonObjectives,
  LessonPractice,
  LessonReferences,
} from "./LessonDetail";

const sectionsFor = (reference, practice) =>
  reference
    ? [
        ["example", "Ejemplo"],
        ["attributes", "Atributos"],
        ["usage", "Uso y accesibilidad"],
        ["related", "Relacionado"],
      ]
    : [
        ["concept", "El concepto"],
        ["example", "Código"],
        ...(practice ? [["practice", "Practica"]] : []),
        ["notes", "Ten en cuenta"],
        ["related", "Seguir consultando"],
      ];

export default function DocumentationReader({ entry, isReference, section }) {
  const language = isReference ? "html" : entry.language;
  const href = isReference
    ? `#reference/${entry.id}`
    : `#lesson/${language}/${entry.number}`;
  const sections = sectionsFor(isReference, entry.practice);
  const element = isReference && entry.id.slice(4);
  const described = isReference
    ? entry.attributes.flatMap((attribute) => {
        const names = attribute.name.split(" / ");
        return names.length > 1 &&
          names.every((name) => Object.hasOwn(attributeIds, name))
          ? names.map((name) => ({ name }))
          : [attribute];
      })
    : [];
  const attributes = isReference
    ? [
        ...described,
        ...(elementMeta[entry.id]?.attributes || [])
          .filter(
            (name) =>
              Object.hasOwn(attributeIds, name) &&
              !described.some((attribute) => attribute.name === name),
          )
          .map((name) => ({ name })),
      ].map((attribute) => {
        const { name, description } = attribute;
        if (description) return attribute;
        if (Object.hasOwn(spanishBriefs, name))
          return { ...attribute, description: spanishBriefs[name] };
        const brief = attributeBriefs[name];
        const definition =
          brief?.[element] ||
          brief?.["HTML elements"] ||
          Object.values(brief || {})[0];
        return definition
          ? { ...attribute, description: definition, locale: "en" }
          : attribute;
      })
    : [];
  const [active, setActive] = useState(sections[0][0]);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const root = useRef();
  const { reducedMotion } = usePreferences();
  const collection = isReference ? references : courseGuides(language);
  const position = collection.findIndex((item) => item.id === entry.id);
  const practice = isReference
    ? null
    : practiceForLanguage(language).find(
        ({ lesson }) => lesson === entry.number,
      );
  const related = isReference
    ? entry.related.map(referenceById).filter(Boolean)
    : collection
        .slice(Math.max(0, position - 1), position + 3)
        .filter((item) => item.id !== entry.id);
  const previous = collection[position - 1],
    next = collection[position + 1];
  const entryUrl = (item) =>
    isReference
      ? `#reference/${item.id}`
      : `#lesson/${item.language}/${item.number}`;

  useEffect(() => {
    rememberEntry({
      id: entry.id,
      title: entry.title,
      language,
      kind: isReference ? "reference" : "guide",
      href,
      description: isReference ? entry.description : entry.languageName,
      summary: isReference ? entry.detail : entry.body[0],
    });
    const node = root.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((item) => item.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.dataset.section);
      },
      { rootMargin: "-100px 0px -55% 0px", threshold: 0 },
    );
    node
      .querySelectorAll("[data-section]")
      .forEach((element) => observer.observe(element));
    let alive = true;
    if (sections.some(([id]) => id === section))
      document.fonts.ready.then(() => {
        if (alive)
          document
            .getElementById(`doc-${section}`)
            ?.scrollIntoView({ behavior: "instant", block: "start" });
      });
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [entry.id]);

  function move(event, id) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const target = document.getElementById(`doc-${id}`);
    if (!target) return;
    event.preventDefault();
    if (isReference) {
      event.currentTarget.closest("details")?.removeAttribute("open");
      target.querySelector("h2")?.focus({ preventScroll: true });
    }
    target.scrollIntoView({
      behavior: reducedMotion ? "instant" : "smooth",
      block: "start",
    });
    history.replaceState(null, "", `${href}?section=${id}`);
    setActive(id);
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }

  const contents = {
    items: sections.map(([id, label]) => ({ id, label })),
    active,
    sectionHref: (id) => `${href}?section=${id}`,
    onMove: move,
  };

  return (
    <div
      className={
        isReference ? "doc-reader-layout reference-layout" : "doc-reader-layout"
      }
      ref={root}
    >
      <aside className="doc-reader-sidebar">
        {isReference ? (
          <ReferenceSidebar entry={entry} />
        ) : (
          <Sidebar entry={entry} />
        )}
      </aside>
      <article
        className={
          isReference ? "doc-reader reference-sheet" : "doc-reader doc-guide"
        }
        data-section-link={Boolean(section)}
      >
        <nav className="doc-breadcrumb" aria-label="Ruta de navegación">
          <a href={isReference ? "#docs" : "#courses"}>
            {isReference ? "Buscar" : "Aprender"}
          </a>
          <span>/</span>
          <a href={`#${isReference ? "docs" : "course"}/${language}`}>
            {languageName(language)}
          </a>
          <span>/</span>
          <span aria-current="page">
            {isReference
              ? entry.title
              : `Lección ${position + 1} de ${collection.length}`}
          </span>
        </nav>
        <details
          className={
            isReference
              ? "doc-mobile-index reference-mobile-index"
              : "doc-mobile-index"
          }
        >
          <summary>
            <List size={16} aria-hidden="true" /> Índice de{" "}
            {languageName(language)}
          </summary>
          {isReference ? (
            <ReferenceSidebar entry={entry} />
          ) : (
            <Sidebar entry={entry} />
          )}
        </details>
        <header className="doc-article-header">
          <div className="doc-article-eyebrow">
            <TechIcon id={language} />
            <span>{isReference ? groupLabel(entry.group) : entry.level}</span>
            <button
              onClick={copyLink}
              aria-label="Copiar enlace de esta entrada"
            >
              {copied ? <Check size={15} /> : <LinkIcon size={15} />}
              <span>{copied ? "Enlace copiado" : "Copiar enlace"}</span>
            </button>
          </div>
          <h1 className={isReference ? "doc-tag-title" : ""}>{entry.title}</h1>
          <p>{isReference ? entry.detail : entry.body[0]}</p>
          <LearningActions
            id={entry.id}
            language={entry.labLanguage || language}
            isGuide={!isReference}
            canEdit={
              Boolean(entry.code) &&
              (entry.environment !== "server" || Boolean(entry.labCode))
            }
            labLabel={
              entry.labLanguage === "javascript"
                ? "Probar con JavaScript"
                : entry.labCode
                  ? "Probar componente cliente"
                  : undefined
            }
          />
          {copyError && (
            <p className="doc-copy-error" role="status">
              Puedes copiar el enlace desde la barra de direcciones.
            </p>
          )}
        </header>
        {isReference && <ReferenceContents {...contents} />}
        {!isReference && (
          <section
            id="doc-concept"
            data-section="concept"
            className="doc-article-section"
          >
            <h2>El concepto</h2>
            <LessonObjectives objectives={entry.objectives} />
            {entry.body.slice(1).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <LessonConcepts
              items={entry.concepts}
              language={languageName(language)}
            />
          </section>
        )}
        <section
          id="doc-example"
          data-section="example"
          className="doc-article-section"
        >
          <div className="doc-section-heading">
            <h2 tabIndex={isReference ? -1 : undefined}>
              {isReference ? "Así se utiliza" : "Código de referencia"}
            </h2>
            <span>{isReference ? "HTML" : languageName(language)}</span>
          </div>
          {isReference ? (
            <Example entry={entry} />
          ) : (
            <>
              {language === "css" && entry.markup && (
                <CssLessonPreview code={entry.code} markup={entry.markup} />
              )}
              {language === "html" && entry.preview ? (
                <Example entry={entry} />
              ) : (
                <CodeBlock
                  code={entry.code}
                  language={entry.mainFile || languageName(language)}
                />
              )}
              {entry.markup &&
                ["css", "javascript", "react"].includes(language) && (
                  <details className="lesson-markup">
                    <summary>Ver el HTML del ejemplo</summary>
                    <CodeBlock code={entry.markup} language="vista.html" />
                  </details>
                )}
              {Object.entries(entry.files || {}).map(([filename, code]) => (
                <CodeBlock key={filename} code={code} language={filename} />
              ))}
              {entry.exampleOutput && (
                <CodeBlock
                  code={entry.exampleOutput}
                  language="Salida esperada"
                />
              )}
            </>
          )}
        </section>
        {!isReference && entry.practice && (
          <LessonPractice
            practice={entry.practice}
            language={languageName(language)}
          />
        )}
        {isReference ? (
          <>
            <section
              id="doc-attributes"
              data-section="attributes"
              className="doc-article-section"
            >
              <h2 tabIndex={-1}>Atributos del elemento</h2>
              <p className="doc-section-intro">
                También admite atributos globales como{" "}
                <a className="work-link" href="#symbol/html-attribute-id">
                  id
                </a>{" "}
                y{" "}
                <a className="work-link" href="#symbol/html-attribute-class">
                  class
                </a>
                . Consulta también los{" "}
                <a
                  className="work-link"
                  href="#docs/html//reference?category=html-events"
                >
                  atributos de evento
                </a>
                .
              </p>
              <dl className="doc-attributes">
                {attributes.length === 0 && (
                  <p>Este elemento no declara atributos propios.</p>
                )}
                {attributes.map((attribute) => (
                  <div key={attribute.name}>
                    <dt>
                      {Object.hasOwn(attributeIds, attribute.name) ? (
                        <a href={`#symbol/${attributeIds[attribute.name]}`}>
                          <code>{attribute.name}</code>
                        </a>
                      ) : (
                        <code>{attribute.name}</code>
                      )}
                    </dt>
                    <dd lang={attribute.locale}>
                      {attribute.description || (
                        <a
                          href={attribute.source}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Definición en el estándar <ArrowUpRight size={12} />
                        </a>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
            <section
              id="doc-usage"
              data-section="usage"
              className="doc-article-section"
            >
              <h2 tabIndex={-1}>Uso y accesibilidad</h2>
              <ul className="doc-tips">
                {entry.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
              {entry.note && (
                <div className="doc-note">
                  <strong>Un detalle más</strong>
                  <p>{entry.note}</p>
                </div>
              )}
            </section>
          </>
        ) : (
          <section
            id="doc-notes"
            data-section="notes"
            className="doc-article-section"
          >
            <h2>Ten en cuenta</h2>
            <div className="doc-note">
              <p>
                {entry.note ||
                  "Lee el ejemplo completo y contrasta las opciones con la documentación oficial del lenguaje."}
              </p>
            </div>
          </section>
        )}
        <section
          id="doc-related"
          data-section="related"
          className="doc-article-section"
        >
          <h2 tabIndex={isReference ? -1 : undefined}>
            {isReference ? "Conecta los conceptos" : "Seguir consultando"}
          </h2>
          <LessonReferences references={entry.relatedReferences} />
          <div className="doc-related">
            {related.map((item) => (
              <a
                key={item.id}
                href={
                  isReference
                    ? `#reference/${item.id}`
                    : `#lesson/${item.language}/${item.number}`
                }
              >
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {isReference
                      ? item.description
                      : languageName(item.language)}
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </a>
            ))}
          </div>
          {isReference && (
            <a
              className="doc-guide-bridge"
              href={`#lesson/html/${entry.guide}`}
            >
              <span>
                Profundizar con una guía
                <strong>
                  {
                    guides.find(
                      (guide) =>
                        guide.language === "html" &&
                        guide.number === entry.guide,
                    )?.title
                  }
                </strong>
              </span>
              <ArrowRight size={18} />
            </a>
          )}
        </section>
        {isReference && (
          <ReferenceLessons
            href={href}
            language="html"
            linkedLesson={entry.guide}
          />
        )}
        {practice && (
          <a className="doc-guide-bridge" href={practiceUrl(practice)}>
            <span>
              Práctica
              <strong>{practice.title}</strong>
            </span>
            <ArrowRight size={18} />
          </a>
        )}
        <div className="doc-source">
          <span>Para ampliar o comprobar un detalle</span>
          <a
            href={entry.source || sources[language]?.[1]}
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentación oficial <ArrowUpRight size={14} />
            <span className="sr-only"> (abre otra pestaña)</span>
          </a>
          {entry.spec && entry.spec !== entry.source && (
            <a href={entry.spec} target="_blank" rel="noopener noreferrer">
              Estándar HTML <ArrowUpRight size={14} />
              <span className="sr-only"> (abre otra pestaña)</span>
            </a>
          )}
        </div>
        {isReference ? (
          <nav
            className="doc-pagination"
            aria-label="Entradas relacionadas en el índice"
          >
            {previous ? (
              <a href={entryUrl(previous)}>
                <ArrowLeft size={17} />
                <span>
                  <small>Anterior</small>
                  {previous.title}
                </span>
              </a>
            ) : (
              <span />
            )}
            {next && (
              <a href={entryUrl(next)}>
                <span>
                  <small>Siguiente</small>
                  {next.title}
                </span>
                <ArrowRight size={17} />
              </a>
            )}
          </nav>
        ) : (
          <LessonFinish entry={entry} previous={previous} next={next} />
        )}
      </article>
      {isReference ? (
        <ReferenceContents {...contents} rail />
      ) : (
        <aside className="doc-toc">
          <span>En esta página</span>
          <nav aria-label="En esta página">
            {sections.map(([id, label]) => (
              <a
                key={id}
                href={`${href}?section=${id}`}
                aria-current={active === id ? "location" : undefined}
                onClick={(event) => move(event, id)}
              >
                {label}
              </a>
            ))}
          </nav>
          <a className="doc-toc-index" href={`#docs/${language}`}>
            Ver índice de {languageName(language)} <ArrowUpRight size={14} />
          </a>
        </aside>
      )}
    </div>
  );
}
