import React, { useEffect, useState } from "react";
import { usePageTitle } from "../app/pageTitle";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { TechIcon } from "../app/Brand";
import { languageName } from "./taxonomy";
import { documentationUrl } from "./routes";
import { rememberEntry } from "../lib/readingHistory";
import CodeBlock from "./components/CodeBlock";
import ReferenceLessons from "./components/ReferenceLessons";
import { ReferenceBody, ReferenceSection } from "./components/ReferenceSection";
import LearningActions from "../workspace/LearningActions";
import WebReferenceDetails from "./WebReferenceDetails";
import { hasWebReference, loadWebReference } from "./web-reference";
import { webExampleById } from "./web-examples";

const statusNames = {
  experimental: "Experimental",
  deprecated: "En desuso",
  "non-standard": "Fuera del estándar",
};

const attributions = {
  react: [
    "React",
    "el equipo y los colaboradores de React",
    "CC BY 4.0",
    "https://creativecommons.org/licenses/by/4.0/",
  ],
  typescript: [
    "TypeScript Handbook",
    "Microsoft y sus colaboradores",
    "CC BY 4.0",
    "https://creativecommons.org/licenses/by/4.0/",
  ],
  sql: [
    "Documentación de SQLite",
    "el equipo de SQLite",
    "Dominio público",
    "https://www.sqlite.org/copyright.html",
  ],
  mdn: [
    "MDN Web Docs",
    "los colaboradores de Mozilla",
    "CC BY-SA 2.5",
    "https://creativecommons.org/licenses/by-sa/2.5/",
  ],
};

export default function SymbolReader({ id, original, section }) {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(false);
  const web = hasWebReference(id);
  const example = details?.example || webExampleById(id);
  const entry = original || details;
  usePageTitle(entry?.title || "Referencia");
  useEffect(() => {
    if (entry)
      rememberEntry({
        ...entry,
        id,
        href: `#symbol/${id}`,
        kind: "reference",
        summary: entry.summary || entry.detail || entry.intro?.[0],
      });
  }, [id, entry]);
  useEffect(() => {
    if (!web) return;
    let active = true;
    loadWebReference(id).then(
      (data) => {
        if (!active) return;
        if (data) setDetails(data);
        else setError(true);
      },
      () => {
        if (active) setError(true);
      },
    );
    return () => {
      active = false;
    };
  }, [id, web]);
  if (!entry)
    return (
      <section className="symbol-reader">
        <p role="status">
          {error ? "No se pudo cargar esta ficha." : "Cargando la referencia…"}
        </p>
        {error && <a href="#docs">Volver a la búsqueda</a>}
      </section>
    );
  const attribution =
    details?.provider === "ecmascript"
      ? null
      : attributions[entry.language] ||
        (["html", "css", "javascript"].includes(entry.language)
          ? attributions.mdn
          : null);
  const [credit, author, license, licenseUrl] = attribution || [];
  const index = documentationUrl({
    language: entry.language,
    kind: "reference",
  });
  const sample = example && (
    <ReferenceSection id="example" title={example.title} label="Ejemplo">
      <p>{example.description}</p>
      {example.markup && <CodeBlock language="HTML" code={example.markup} />}
      <CodeBlock
        language={languageName(example.language)}
        code={example.code}
      />
      {example.files &&
        Object.entries(example.files).map(([filename, code]) => (
          <React.Fragment key={filename}>
            <h3>
              <code>{filename}</code>
            </h3>
            <CodeBlock
              language={
                filename.endsWith(".json")
                  ? "JSON"
                  : languageName(example.language)
              }
              code={code}
            />
          </React.Fragment>
        ))}
      {example.expected && (
        <>
          <h3>Salida esperada</h3>
          <CodeBlock language="Salida" code={example.expected} />
        </>
      )}
    </ReferenceSection>
  );
  return (
    <article className="symbol-reader reference-sheet">
      <nav className="doc-breadcrumb" aria-label="Ruta de navegación">
        <a href="#docs">Buscar</a>
        <span>/</span>
        <a href={index}>{languageName(entry.language)}</a>
        <span>/</span>
        <span aria-current="page">{entry.description}</span>
      </nav>
      <header className="doc-article-header">
        <div className="doc-article-eyebrow">
          <TechIcon id={entry.language} />
          <span>
            {entry.description}
            {details?.environment ? ` · ${details.environment}` : ""}
          </span>
        </div>
        <h1 className="doc-tag-title">{entry.title}</h1>
        {details?.status?.length > 0 && (
          <p className="doc-reference-status">
            {details.status
              .map((flag) => statusNames[flag])
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        {entry.detail && (!details || details.locale !== "es") && (
          <p>{entry.detail}</p>
        )}
        {!entry.detail && !web && entry.summary && (
          <p lang="en">{entry.summary}</p>
        )}
        {details?.locale === "en-US" && (
          <small className="doc-original-language">
            Referencia ampliada en inglés
          </small>
        )}
        {details && (
          <div lang={details.locale} className="doc-reference-intro">
            {details.intro.map((paragraph, index) =>
              paragraph === entry.detail && details.locale !== "es" ? null : (
                <p key={index}>{paragraph}</p>
              ),
            )}
          </div>
        )}

        <LearningActions
          id={entry.id}
          language={entry.language}
          canEdit={Boolean(
            (example && example.runnable !== false) ||
            (entry.example && ["css", "sql", "html"].includes(entry.language)),
          )}
        />
      </header>
      {web && !details && (
        <p role="status">
          {error
            ? "No se pudo cargar la ficha ampliada. Puedes consultar su fuente al final."
            : "Cargando la referencia ampliada…"}
        </p>
      )}
      <ReferenceBody
        href={`#symbol/${id}`}
        content={details || entry}
        section={section}
      >
        {details ? (
          <WebReferenceDetails
            data={details}
            language={languageName(entry.language)}
          >
            {sample}
          </WebReferenceDetails>
        ) : (
          sample
        )}
        {entry.example && !example && (
          <ReferenceSection id="example" title="Ejemplo">
            <CodeBlock
              language={languageName(entry.language)}
              code={entry.example}
            />
          </ReferenceSection>
        )}
        {entry.contexts?.length > 0 && (
          <ReferenceSection id="contexts" title="Valores por elemento">
            <dl className="doc-attributes attr-contexts">
              {entry.contexts.map(
                (
                  { elements, purpose, values, source, locale = "en", event },
                  index,
                ) => (
                  <div key={index}>
                    <dt>
                      <a href={source} target="_blank" rel="noreferrer">
                        {elements
                          .map((element) =>
                            /^[a-z][a-z0-9-]*$/.test(element)
                              ? `<${element}>`
                              : element === "HTML elements"
                                ? "Elementos HTML"
                                : element,
                          )
                          .join(", ")}
                      </a>
                    </dt>
                    <dd>
                      <p lang={locale}>{purpose}</p>
                      {event && (
                        <a href={event.href} target="_blank" rel="noreferrer">
                          Evento <code>{event.name}</code>{" "}
                          <ArrowUpRight size={14} />
                        </a>
                      )}
                      {values && (
                        <p
                          lang={values === "Boolean attribute" ? "es" : locale}
                        >
                          {values === "Boolean attribute"
                            ? "Atributo booleano. Su presencia equivale a verdadero."
                            : values}
                        </p>
                      )}
                    </dd>
                  </div>
                ),
              )}
            </dl>
          </ReferenceSection>
        )}
        {entry.group === "html-events" && (
          <div className="doc-note">
            <p>
              También puedes conectar el evento desde JavaScript con{" "}
              <code>addEventListener()</code>.
            </p>
            <a
              className="work-link"
              href="#symbol/javascript-api-addEventListener()"
            >
              Consultar addEventListener() <ArrowUpRight size={14} />
            </a>
          </div>
        )}
        {entry.appliesTo?.length > 0 && (
          <ReferenceSection id="applies" title="Dónde se aplica">
            <div className="work-actions">
              {entry.appliesTo.map((element) =>
                /^[a-z][a-z0-9-]*$/.test(element) ? (
                  <a
                    className="work-secondary"
                    key={element}
                    href={`#reference/tag-${element}`}
                  >{`<${element}>`}</a>
                ) : (
                  <span className="work-muted" key={element}>
                    {element === "HTML elements" ? "Elementos HTML" : element}
                  </span>
                ),
              )}
            </div>
          </ReferenceSection>
        )}
        {entry.syntax && (
          <ReferenceSection
            id="grammar"
            title="Sintaxis admitida en la especificación"
            label="Gramática"
          >
            <CodeBlock language="Gramática CSS" code={entry.syntax} />
          </ReferenceSection>
        )}
        {(entry.initial || entry.inherited || entry.alias) && (
          <ReferenceSection id="property" title="Detalles de la propiedad">
            <dl className="doc-attributes">
              {entry.initial && (
                <div>
                  <dt>Valor inicial</dt>
                  <dd>{entry.initial}</dd>
                </div>
              )}
              {entry.inherited && (
                <div>
                  <dt>Se hereda</dt>
                  <dd>
                    {entry.inherited === "yes"
                      ? "Sí"
                      : entry.inherited === "no"
                        ? "No"
                        : entry.inherited}
                  </dd>
                </div>
              )}
              {entry.alias && (
                <div>
                  <dt>Alias de</dt>
                  <dd>
                    {entry.relatedReference ? (
                      <a href={`#symbol/${entry.relatedReference.id}`}>
                        {entry.alias}
                      </a>
                    ) : (
                      entry.alias
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </ReferenceSection>
        )}
        {entry.relatedReference && !entry.alias && (
          <ReferenceSection id="canonical" title="Referencia principal">
            <a
              className="work-link"
              href={`#symbol/${entry.relatedReference.id}`}
            >
              {entry.relatedReference.title} <ArrowUpRight size={14} />
            </a>
          </ReferenceSection>
        )}
        <ReferenceLessons
          href={`#symbol/${id}`}
          language={entry.language}
          linkedLesson={details?.guide}
        />
      </ReferenceBody>
      <div className="doc-source">
        {details?.documentationSource && (
          <a
            href={details.documentationSource}
            target="_blank"
            rel="noreferrer"
          >
            {details.inheritedDocumentation
              ? "Contrato heredado · OpenJDK 21"
              : entry.language === "java"
                ? "Documentación de OpenJDK 21"
                : "Documentación de cppreference"}{" "}
            <ArrowUpRight size={15} />
          </a>
        )}
        {details?.specification && (
          <a href={details.specification} target="_blank" rel="noreferrer">
            Especificación del lenguaje <ArrowUpRight size={15} />
          </a>
        )}
        {entry.language === "css" && (
          <span>
            El índice incluye borradores. Comprueba la compatibilidad antes de
            usar una función nueva.
          </span>
        )}
        {entry.contexts?.length > 0 && (
          <span>
            Valores adaptados del{" "}
            <a
              href="https://html.spec.whatwg.org/multipage/indices.html#attributes-3"
              target="_blank"
              rel="noreferrer"
            >
              estándar HTML del WHATWG
            </a>
            .{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC BY 4.0
            </a>
            .
          </span>
        )}
        {web && attribution && (
          <span>
            Adaptado de{" "}
            <a
              href={details?.source || entry.source}
              target="_blank"
              rel="noreferrer"
            >
              {credit}
            </a>{" "}
            por {author}.{" "}
            <a href={licenseUrl} target="_blank" rel="noreferrer">
              {license}
            </a>
            .
          </span>
        )}
        {(!web ||
          !attribution ||
          (entry.source && entry.source !== details?.source)) && (
          <a href={entry.source} target="_blank" rel="noreferrer">
            {details?.specification
              ? "Documentación de apoyo"
              : "Consultar la fuente original"}
            <ArrowUpRight size={15} />
          </a>
        )}
      </div>
      <a className="work-secondary" href={index}>
        <ArrowLeft size={16} /> Ver referencias de{" "}
        {languageName(entry.language)}
      </a>
    </article>
  );
}
