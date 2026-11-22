import React from "react";
import { ArrowUpRight } from "lucide-react";
import CodeBlock from "./components/CodeBlock";
import ReferenceMembers from "./components/ReferenceMembers";
import { ReferenceSection } from "./components/ReferenceSection";

function Paragraphs({ id, title, label, items, locale }) {
  if (!items?.length) return null;
  return (
    <ReferenceSection id={id} title={title} label={label}>
      {items.map((paragraph, index) => (
        <p key={index} lang={locale}>
          {paragraph}
        </p>
      ))}
    </ReferenceSection>
  );
}

function Definitions({ id, title, label, items, locale }) {
  if (!items?.length) return null;
  const structured = items.every(({ label }) => label);
  return (
    <ReferenceSection id={id} title={title} label={label}>
      {structured ? (
        <dl className="doc-attributes">
          {items.map(({ label, detail }, index) => (
            <div key={index}>
              <dt>{label}</dt>
              <dd lang={locale}>{detail}</dd>
            </div>
          ))}
        </dl>
      ) : (
        items.map(({ detail }, index) => (
          <p key={index} lang={locale}>
            {detail}
          </p>
        ))
      )}
    </ReferenceSection>
  );
}

export default function WebReferenceDetails({ data, language, children }) {
  return (
    <>
      {(data.owner || data.guide) && (
        <nav
          className="reference-bridges"
          aria-label="Contexto de la referencia"
        >
          {data.owner && (
            <a className="work-link" href={`#symbol/${data.owner.id}`}>
              {data.owner.title} <ArrowUpRight size={15} />
            </a>
          )}
          {data.guide && (
            <a
              className="work-link"
              href={`#lesson/${data.language}/${data.guide}`}
            >
              Guía del tema <ArrowUpRight size={15} />
            </a>
          )}
        </nav>
      )}
      {data.usage && (
        <ReferenceSection id="syntax" title="Sintaxis">
          <CodeBlock language={language} code={data.usage} />
        </ReferenceSection>
      )}
      {data.hierarchy?.length > 0 && (
        <ReferenceSection id="hierarchy" title="Herencia y contratos">
          <dl className="doc-attributes">
            {data.hierarchy.map(({ relation, types }) => (
              <div key={relation}>
                <dt>{relation}</dt>
                <dd className="reference-bridges">
                  {types.map(({ id, title }) => (
                    <a className="work-link" key={id} href={`#symbol/${id}`}>
                      <code>{title}</code> <ArrowUpRight size={14} />
                    </a>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </ReferenceSection>
      )}
      {data.signatures?.length > 0 && (
        <ReferenceSection
          id="signatures"
          title={
            data.signatures.length === 1 ? "Firma pública" : "Firmas públicas"
          }
          label="Firmas"
        >
          <CodeBlock language={language} code={data.signatures.join("\n\n")} />
        </ReferenceSection>
      )}
      <Definitions
        id="parameters"
        title="Parámetros"
        items={data.parameters}
        locale={data.locale}
      />
      <Definitions
        id="props"
        title="Propiedades del componente (props)"
        label="Props"
        items={data.props}
        locale={data.locale}
      />
      <Paragraphs
        id="caveats"
        title="Ten en cuenta"
        items={data.caveats}
        locale={data.locale}
      />
      <Paragraphs
        id="returns"
        title="Valor devuelto"
        items={data.returns}
        locale={data.locale}
      />
      <Definitions
        id="values"
        title="Valores"
        items={data.values}
        locale={data.locale}
      />
      <Definitions
        id="exceptions"
        title="Excepciones"
        items={data.exceptions}
        locale={data.locale}
      />
      <Paragraphs
        id="usage"
        title="Cómo funciona"
        items={data.body}
        locale={data.locale}
      />
      <Paragraphs
        id="accessibility"
        title="Accesibilidad"
        items={data.accessibility}
        locale={data.locale}
      />
      {children}
      {data.related?.length > 0 && (
        <ReferenceSection
          id="related"
          title="Referencias relacionadas"
          label="Relacionado"
        >
          <div className="reference-bridges">
            {data.related.map(({ id, title }) => (
              <a className="work-link" key={id} href={`#symbol/${id}`}>
                <code>{title}</code> <ArrowUpRight size={14} />
              </a>
            ))}
          </div>
        </ReferenceSection>
      )}
      {data.members?.length > 0 && (
        <ReferenceMembers
          items={data.members}
          sectionId="members"
          title="Miembros del tipo"
          filterLabel="Filtrar miembros"
        />
      )}
    </>
  );
}
