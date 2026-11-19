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
import { knowledgeIndex } from "../lib/catalog";
import { rememberEntry } from "../lib/readingHistory";
import { usePreferences } from "../app/Preferences";
import {
  references,
  guides,
  referenceById,
  groupLabel,
  languageName,
} from "./catalog";
import Sidebar from "./components/Sidebar";
import Example from "./components/Example";
import CodeBlock from "./components/CodeBlock";

const sources = {
  html: "https://developer.mozilla.org/es/docs/Web/HTML",
  css: "https://developer.mozilla.org/es/docs/Web/CSS",
  javascript: "https://developer.mozilla.org/es/docs/Web/JavaScript/Guide",
  react: "https://react.dev/learn",
  php: "https://www.php.net/manual/es/",
  java: "https://dev.java/learn/",
  sql: "https://www.postgresql.org/docs/current/tutorial.html",
};
const sectionsFor = (reference) =>
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
        ["notes", "Ten en cuenta"],
        ["related", "Seguir consultando"],
      ];

export default function DocumentationReader({ entry, isReference, section }) {
  const language = isReference ? "html" : entry.language;
  const href = isReference
    ? `#reference/${entry.id}`
    : `#lesson/${language}/${entry.number}`;
  const sections = sectionsFor(isReference);
  const [active, setActive] = useState(sections[0][0]);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const root = useRef();
  const { reducedMotion } = usePreferences();
  const related = isReference
    ? entry.related.map(referenceById).filter(Boolean)
    : guides
        .filter((item) => item.language === language && item.id !== entry.id)
        .slice(
          Math.max(0, entry.number - 2),
          Math.max(0, entry.number - 2) + 3,
        );
  const collection = isReference
    ? references
    : guides.filter((item) => item.language === language);
  const position = collection.findIndex((item) => item.id === entry.id);
  const previous = collection[position - 1],
    next = collection[position + 1];
  const entryUrl = (item) =>
    isReference
      ? `#reference/${item.id}`
      : `#lesson/${item.language}/${item.number}`;

  useEffect(() => {
    rememberEntry(entry.id, knowledgeIndex);
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
    event.preventDefault();
    document.getElementById(`doc-${id}`)?.scrollIntoView({
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

  return (
    <div className="doc-reader-layout" ref={root}>
      <aside className="doc-reader-sidebar">
        <Sidebar entry={entry} isReference={isReference} />
      </aside>
      <article className="doc-reader" data-section-link={Boolean(section)}>
        <nav className="doc-breadcrumb" aria-label="Ruta de navegación">
          <a href="#docs">Consultar</a>
          <span>/</span>
          <a href={`#docs/${language}`}>{languageName(language)}</a>
          <span>/</span>
          <span aria-current="page">{isReference ? entry.title : "Guía"}</span>
        </nav>
        <details className="doc-mobile-index">
          <summary>
            <List size={16} /> Índice de {languageName(language)}
          </summary>
          <Sidebar entry={entry} isReference={isReference} />
        </details>
        <header className="doc-article-header">
          <div className="doc-article-eyebrow">
            <TechIcon id={language} />
            <span>
              {isReference ? groupLabel(entry.group) : `${entry.level} · Guía`}
            </span>
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
          {copyError && (
            <p className="doc-copy-error" role="status">
              Puedes copiar el enlace desde la barra de direcciones.
            </p>
          )}
        </header>
        {!isReference && (
          <section
            id="doc-concept"
            data-section="concept"
            className="doc-article-section"
          >
            <h2>El concepto</h2>
            {entry.body.slice(1).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </section>
        )}
        <section
          id="doc-example"
          data-section="example"
          className="doc-article-section"
        >
          <div className="doc-section-heading">
            <h2>{isReference ? "Así se utiliza" : "Código de referencia"}</h2>
            <span>{isReference ? "HTML" : languageName(language)}</span>
          </div>
          {isReference ? (
            <Example entry={entry} />
          ) : (
            <CodeBlock code={entry.code} language={languageName(language)} />
          )}
        </section>
        {isReference ? (
          <>
            <section
              id="doc-attributes"
              data-section="attributes"
              className="doc-article-section"
            >
              <h2>Atributos que conviene conocer</h2>
              <p className="doc-section-intro">
                También admite los atributos globales, como id y class.
              </p>
              <dl className="doc-attributes">
                {entry.attributes.map((attribute) => (
                  <div key={attribute.name}>
                    <dt>
                      <code>{attribute.name}</code>
                    </dt>
                    <dd>{attribute.description}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section
              id="doc-usage"
              data-section="usage"
              className="doc-article-section"
            >
              <h2>Uso y accesibilidad</h2>
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
          <h2>
            {isReference ? "Conecta los conceptos" : "Seguir consultando"}
          </h2>
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
        <div className="doc-source">
          <span>Para ampliar o comprobar un detalle</span>
          <a
            href={isReference ? entry.source : sources[language]}
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentación oficial <ArrowUpRight size={14} />
            <span className="sr-only"> (abre otra pestaña)</span>
          </a>
          {entry.spec && (
            <a href={entry.spec} target="_blank" rel="noopener noreferrer">
              Estándar HTML <ArrowUpRight size={14} />
              <span className="sr-only"> (abre otra pestaña)</span>
            </a>
          )}
        </div>
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
      </article>
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
    </div>
  );
}
