import React, { useEffect, useState } from "react";
import { usePageTitle } from "../app/pageTitle";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  FlaskConical,
} from "lucide-react";
import ChoiceMenu from "../app/ChoiceMenu";
import { TechIcon } from "../app/Brand";
import { rememberEntry } from "../lib/readingHistory";
import LearningActions from "../workspace/LearningActions";
import CodeBlock from "./components/CodeBlock";
import ReferenceLessons from "./components/ReferenceLessons";
import ReferenceMembers from "./components/ReferenceMembers";
import { ReferenceBody, ReferenceSection } from "./components/ReferenceSection";
import { documentationUrl } from "./routes";
import { loadPhpReference } from "./php-reference";

const phpIndex = documentationUrl({ language: "php", kind: "reference" });

function Information({ id, title, lines }) {
  if (!lines?.length) return null;
  return (
    <ReferenceSection id={id} title={title}>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </ReferenceSection>
  );
}

function Arguments({ signatures, notes }) {
  const params = new Map();
  for (const signature of signatures) {
    for (const item of signature.parameters) {
      const previous = params.get(item.name) || [];
      if (
        !previous.some(
          (variant) =>
            variant.type === item.type &&
            variant.optional === item.optional &&
            variant.default === item.default &&
            variant.variadic === item.variadic &&
            variant.byReference === item.byReference,
        )
      ) {
        params.set(item.name, [...previous, item]);
      }
    }
  }
  return (
    <ReferenceSection id="parameters" title="Parámetros">
      {params.size === 0 ? (
        <p>No recibe parámetros.</p>
      ) : (
        <>
          {notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
          <dl className="doc-attributes php-argument-list">
            {[...params].map(([name, variants]) => (
              <div key={name}>
                <dt>
                  <code>{name}</code>
                </dt>
                <dd>
                  {variants.map((item, ordinal) => (
                    <div className="php-argument-variant" key={ordinal}>
                      <div className="php-argument-meta">
                        {item.type && <code>{item.type}</code>}
                        <span>
                          {item.variadic
                            ? "Variable"
                            : item.optional
                              ? "Opcional"
                              : "Obligatorio"}
                        </span>
                        {item.byReference && <span>Por referencia</span>}
                        {Object.hasOwn(item, "default") && item.default && (
                          <span>
                            Predeterminado <code>{item.default}</code>
                          </span>
                        )}
                      </div>
                      {item.notes.map((note) => (
                        <p key={note}>{note}</p>
                      ))}
                    </div>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </ReferenceSection>
  );
}

function ReferenceExample({ example, entryId, variant }) {
  return (
    <div className="php-example">
      {example.title && <h3>{example.title}</h3>}
      <CodeBlock
        language={example.files ? "programa.php" : "PHP"}
        code={example.code}
      />
      {Object.entries(example.files || {}).map(([name, code]) => (
        <CodeBlock key={name} language={name} code={code} />
      ))}
      {example.output && (
        <div className="php-expected">
          <span>Salida esperada</span>
          <pre>{example.output}</pre>
        </div>
      )}
      {example.runnable && (
        <a
          className="work-secondary"
          href={`#playground?language=php&example=${encodeURIComponent(entryId)}&variant=${variant}`}
        >
          <FlaskConical size={16} /> Probar en el laboratorio
        </a>
      )}
    </div>
  );
}

function SubjectDetails({ entry }) {
  return (
    <>
      {entry.declaration && (
        <ReferenceSection
          id="declaration"
          title={entry.label === "Sintaxis PHP" ? "Sintaxis" : "Declaración"}
        >
          <CodeBlock language="PHP" code={entry.declaration} />
        </ReferenceSection>
      )}
      {entry.typeName && (
        <ReferenceSection id="type" title="Tipo">
          <p>
            <code>{entry.typeName}</code>
          </p>
        </ReferenceSection>
      )}
      <Information id="usage" title="Cómo funciona" lines={entry.description} />
      {entry.methodLinks?.length > 0 && (
        <ReferenceMembers
          sectionId="members"
          title="Métodos"
          filterLabel="Filtrar métodos"
          className="php-members"
          items={entry.methodLinks}
        />
      )}
      {entry.fields?.length > 0 && (
        <ReferenceSection id="fields" title="Claves documentadas">
          <dl className="doc-attributes">
            {entry.fields.map(({ name, notes }) => (
              <div key={name}>
                <dt>
                  <code>{name}</code>
                </dt>
                <dd>
                  {notes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </ReferenceSection>
      )}
    </>
  );
}

function PhpArticle({ entry, section }) {
  const [variant, setVariant] = useState(0);
  const example = entry.examples[variant];
  const alias = entry.aliasLink;
  return (
    <article className="symbol-reader php-reference reference-sheet">
      <nav className="doc-breadcrumb" aria-label="Ruta de navegación">
        <a href="#docs">Buscar</a>
        <span>/</span>
        <a href={phpIndex}>PHP</a>
        <span>/</span>
        <a
          href={documentationUrl({
            language: "php",
            kind: "reference",
            category: entry.group,
          })}
        >
          {entry.group}
        </a>
      </nav>
      <header className="doc-article-header">
        <div className="doc-article-eyebrow">
          <TechIcon id="php" />
          <span>
            {entry.alias
              ? "Alias"
              : entry.label ||
                (entry.title.includes("::") ? "Método PHP" : "Función PHP")}
          </span>
        </div>
        <h1 className="doc-tag-title">{entry.title}</h1>
        <p lang={entry.locale}>{entry.summary}</p>
        {entry.version && <p className="php-version">{entry.version}</p>}
        {entry.locale === "en" && (
          <p className="work-muted">
            Algunos detalles de esta ficha se muestran en inglés.
          </p>
        )}
        <LearningActions
          id={entry.id}
          language="php"
          canEdit={example?.runnable}
          labHref={`#playground?language=php&example=${encodeURIComponent(entry.id)}&variant=${variant}`}
        />
      </header>
      <ReferenceBody
        href={`#symbol/${entry.id}`}
        content={entry}
        section={section}
      >
        <div lang={entry.locale}>
          {entry.aliasDocumentation && (
            <div lang={entry.aliasDocumentation.locale}>
              <Information
                id="alias-usage"
                title="Qué hace la operación"
                lines={entry.aliasDocumentation.description}
              />
              <Information
                id="alias-return"
                title="Qué devuelve la operación"
                lines={entry.aliasDocumentation.returns}
              />
            </div>
          )}
          {entry.parameterUses?.length > 0 && (
            <ReferenceSection
              id="used-in-parameters"
              title="Dónde aparece en parámetros"
            >
              <dl className="doc-attributes">
                {entry.parameterUses.map(
                  ({ id, title, parameter, note, locale }) => (
                    <div key={`${id}/${parameter}`}>
                      <dt>
                        <a href={`#symbol/${id}?section=parameters`}>
                          <code>{title}</code>
                        </a>
                        {" · "}
                        <code>{parameter}</code>
                      </dt>
                      <dd lang={locale}>{note}</dd>
                    </div>
                  ),
                )}
              </dl>
            </ReferenceSection>
          )}
          {entry.returnUses?.length > 0 && (
            <ReferenceSection id="used-as-return" title="Dónde se devuelve">
              <dl className="doc-attributes">
                {entry.returnUses.map(({ id, title, meaning }) => (
                  <div key={id}>
                    <dt>
                      <a href={`#symbol/${id}`}>
                        <code>{title}</code>
                      </a>
                    </dt>
                    <dd>{meaning}</dd>
                  </div>
                ))}
              </dl>
            </ReferenceSection>
          )}
          {entry.alias ? (
            <ReferenceSection id="alias" title="Referencia principal">
              {alias ? (
                <a className="work-secondary" href={`#symbol/${alias.id}`}>
                  Consultar {alias.title} <ArrowRight size={16} />
                </a>
              ) : (
                <p>
                  Consulta el manual para ver la referencia de{" "}
                  <code>{entry.alias}</code>.
                </p>
              )}
            </ReferenceSection>
          ) : entry.label ? (
            <SubjectDetails entry={entry} />
          ) : (
            <>
              <ReferenceSection id="signature" title="Firma">
                <CodeBlock
                  language="PHP"
                  code={entry.signatures
                    .map(({ code, modifiers = [] }) =>
                      [...modifiers, code].join(" "),
                    )
                    .join("\n\n")}
                />
              </ReferenceSection>
              <Information
                id="usage"
                title="Cómo funciona"
                lines={entry.description.filter(
                  (line) => line !== entry.summary,
                )}
              />
              <Arguments
                signatures={entry.signatures}
                notes={entry.argumentNotes}
              />
              {!entry.title.endsWith("::__construct()") &&
                !entry.title.endsWith("::__destruct()") && (
                  <ReferenceSection id="returns" title="Valores devueltos">
                    {entry.returnValues.length > 0 ? (
                      <dl className="doc-attributes">
                        {entry.returnValues.map(({ value, meaning, id }) => (
                          <div key={value}>
                            <dt>
                              <code>
                                {id ? (
                                  <a href={`#symbol/${id}`}>{value}</a>
                                ) : (
                                  value
                                )}
                              </code>
                            </dt>
                            <dd>{meaning}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : entry.returns.length > 0 ? (
                      entry.returns.map((line) => <p key={line}>{line}</p>)
                    ) : (
                      <p>
                        Tipo de retorno{" "}
                        <code>
                          {[
                            ...new Set(
                              entry.signatures
                                .map((item) => item.returnType)
                                .filter(Boolean),
                            ),
                          ].join(" | ") || "sin declarar"}
                        </code>
                        .
                      </p>
                    )}
                  </ReferenceSection>
                )}
            </>
          )}
          {example && (
            <ReferenceSection
              id="example"
              title={entry.examples.length === 1 ? "Ejemplo" : "Ejemplos"}
            >
              {entry.examples.length > 1 && (
                <div className="php-example-choice">
                  <ChoiceMenu
                    label="Ejemplo PHP"
                    value={variant}
                    options={entry.examples.map((item, index) => [
                      index,
                      item.title || `Ejemplo ${index + 1}`,
                    ])}
                    onChange={setVariant}
                  />
                </div>
              )}
              <ReferenceExample
                key={variant}
                example={example}
                entryId={entry.id}
                variant={variant}
              />
            </ReferenceSection>
          )}
          <Information
            id="errors"
            title="Errores y excepciones"
            lines={entry.errors}
          />
          <Information id="caveats" title="Ten en cuenta" lines={entry.notes} />
        </div>
        {entry.connections?.length > 0 && (
          <ReferenceSection
            id="related"
            title="Entradas relacionadas"
            label="Relacionado"
          >
            <div className="work-actions">
              {entry.connections.map((item) => (
                <a
                  className="work-secondary"
                  key={item.id}
                  href={`#symbol/${item.id}`}
                >
                  <code>{item.title}</code>
                  <ArrowUpRight size={15} />
                </a>
              ))}
            </div>
          </ReferenceSection>
        )}
        <ReferenceLessons href={`#symbol/${entry.id}`} />
      </ReferenceBody>
      <div className="doc-source">
        <span>Contenido adaptado del Manual de PHP</span>
        <a href={entry.source} target="_blank" rel="noreferrer">
          Manual oficial <ArrowUpRight size={15} />
        </a>
        <a
          href="https://creativecommons.org/licenses/by/3.0/"
          target="_blank"
          rel="noreferrer"
        >
          CC BY 3.0 <ArrowUpRight size={15} />
        </a>
      </div>
      <a className="work-secondary" href={phpIndex}>
        <ArrowLeft size={16} /> Volver a las referencias de PHP
      </a>
    </article>
  );
}

export default function PhpReference({ id, section }) {
  const [entry, setEntry] = useState(undefined);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  usePageTitle(
    entry?.title ||
      (entry === null ? "Referencia no encontrada" : "Referencia PHP"),
  );
  useEffect(() => {
    let active = true;
    loadPhpReference(id).then(
      (value) => {
        if (!active) return;
        if (value) {
          rememberEntry({
            id,
            title: value.title,
            href: `#symbol/${id}`,
            language: "php",
            kind: "reference",
            description:
              value.label ||
              (value.title.includes("::") ? "Método PHP" : "Función PHP"),
            summary: value.summary,
          });
        }
        setEntry(value);
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [id, attempt]);

  if (entry) return <PhpArticle entry={entry} section={section} />;
  if (entry === null)
    return (
      <section className="doc-not-found">
        <h1>No encontramos esta entrada</h1>
        <a className="button" href={phpIndex}>
          Volver a las referencias de PHP
        </a>
      </section>
    );
  return (
    <section className="symbol-reader">
      {failed ? (
        <div className="doc-note">
          <p role="alert">No se pudo abrir esta ficha.</p>
          <button
            className="work-secondary"
            onClick={() => {
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          >
            Volver a intentar
          </button>
        </div>
      ) : (
        <p role="status">Cargando la referencia…</p>
      )}
    </section>
  );
}
