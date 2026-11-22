import React, { useId } from "react";
import { Braces, ChevronDown } from "lucide-react";
import ChoiceMenu from "../app/ChoiceMenu";
import { allowsRequestBody, phpMethods } from "./php-request";

export default function PhpRequest({ request, onChange, initiallyOpen }) {
  const id = useId();

  return (
    <details className="lab-php-request" open={initiallyOpen || undefined}>
      <summary>
        <Braces size={16} aria-hidden="true" />
        <span>Petición HTTP</span>
        <code className="lab-php-method" aria-hidden="true">
          {request.method}
        </code>
        <ChevronDown size={16} aria-hidden="true" />
      </summary>
      <div className="lab-php-fields">
        <div className="lab-php-field">
          <span>Método</span>
          <ChoiceMenu
            label="Método"
            value={request.method}
            options={phpMethods.map((method) => [method, method])}
            onChange={(value) => onChange("method", value)}
          />
        </div>
        <div className="lab-php-field">
          <label htmlFor={`${id}-query`}>Parámetros de URL</label>
          <input
            id={`${id}-query`}
            value={request.query}
            maxLength={2000}
            placeholder="curso=php"
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => onChange("query", event.target.value)}
          />
        </div>
        {allowsRequestBody(request.method) && (
          <>
            <div className="lab-php-field">
              <span>Formato del cuerpo</span>
              <ChoiceMenu
                label="Formato del cuerpo"
                value={request.format}
                options={[
                  ["form", "Formulario"],
                  ["json", "JSON"],
                ]}
                onChange={(value) => onChange("format", value)}
              />
            </div>
            <div className="lab-php-field">
              <label htmlFor={`${id}-body`}>Cuerpo de la petición</label>
              <textarea
                id={`${id}-body`}
                value={request.body}
                maxLength={8000}
                rows={3}
                placeholder={
                  request.format === "json"
                    ? '{"curso":"php"}'
                    : "email=ana%40ejemplo.test"
                }
                spellCheck={false}
                onChange={(event) => onChange("body", event.target.value)}
              />
            </div>
          </>
        )}
      </div>
    </details>
  );
}
