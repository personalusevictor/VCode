import React, { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import CodeBlock from "./CodeBlock";
import { usePreferences } from "../../app/Preferences";
import { inlineLessonAssets, lessonAssetUrl } from "../lesson-assets";

const previewStyle = `*{box-sizing:border-box}body{margin:0;padding:28px;background:#faf9f5;color:#262b34;font:15px/1.65 system-ui,sans-serif}h1,h2,h3{font-size:22px;line-height:1.3;letter-spacing:-.04em}h1,h2,h3,p{margin:0 0 12px}figure{margin:0 0 18px}img,video{display:block;max-inline-size:100%;block-size:auto}figcaption{margin-block-start:8px}p:last-child{margin:0}details{border-bottom:1px solid #d8d9d2;padding:15px 0}details:first-child{border-top:1px solid #d8d9d2}summary{cursor:pointer;font-weight:600}details p{padding-top:10px;color:#666c70}a{color:#343df0;margin-right:18px}label{display:block;font-size:13px;margin-bottom:8px}input,textarea,select{max-width:100%;padding:10px 12px;border:1px solid #cdd0c8;border-radius:8px;font:inherit;background:white;color:inherit}button{padding:11px 18px;border:0;border-radius:8px;background:#343df0;color:white;font:inherit;margin:5px 8px 5px 0}table{border-collapse:collapse;width:100%}th,td{padding:10px;text-align:left;border-bottom:1px solid #d8d9d2}caption{text-align:left;font-weight:600;margin-bottom:12px}pre{font:13px/1.6 monospace;overflow:auto}footer{font-size:13px;color:#666c70;margin-top:18px}ul{padding-left:22px}:focus-visible{outline:2px solid #343df0;outline-offset:5px}`;

export default function Example({ entry }) {
  const { theme } = usePreferences();
  const [variant, setVariant] = useState(0);
  const [revision, setRevision] = useState(0);
  const examples = [
    { label: "Básico", code: entry.code },
    ...(entry.extraExample ? [entry.extraExample] : []),
  ];
  const current = examples[variant];
  const resources = entry.resources;
  const [resourcePreview, setResourcePreview] = useState(null);
  useEffect(() => {
    if (!resources?.length || !entry.preview) return;
    let active = true;
    inlineLessonAssets(current.code, resources).then(
      (markup) => {
        if (active) setResourcePreview({ code: current.code, markup });
      },
      (error) => {
        if (active)
          setResourcePreview({ code: current.code, error: error.message });
      },
    );
    return () => {
      active = false;
    };
  }, [entry.preview, resources, current.code, revision]);
  const preview = resources?.length
    ? resourcePreview?.code === current.code && resourcePreview
    : { markup: current.code };
  const darkStyle =
    theme === "dark"
      ? ":root{color-scheme:dark}body{background:#1a2029;color:#e8ece7}details,details:first-child,th,td{border-color:#333c45}details p,footer{color:#aeb7c0}input,textarea,select{background:#242d39;color:#e8ece7;border-color:#414b59}button{background:#a1aaff;color:#171e48}a{color:#a1aaff}"
      : "";
  const height =
    entry.previewHeight ??
    (entry.id === "tag-details"
      ? variant
        ? 250
        : 175
      : entry.id === "tag-textarea"
        ? 280
        : 210);
  const document = `<!doctype html><html lang="es"><head><meta charset="utf-8"><base href="about:srcdoc"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; media-src data:; form-action 'none'; base-uri 'none'"><style>${previewStyle}${darkStyle}</style></head><body>${preview?.markup ?? ""}</body></html>`;
  return (
    <div className="reference-example">
      {examples.length > 1 && (
        <div
          className="example-variants"
          role="group"
          aria-label="Variantes del ejemplo"
        >
          {examples.map((example, index) => (
            <button
              key={example.label}
              aria-pressed={variant === index}
              onClick={() => setVariant(index)}
            >
              {example.label}
            </button>
          ))}
        </div>
      )}
      {entry.preview && (
        <div className="reference-preview">
          <div className="preview-caption">
            <span>Resultado en el navegador</span>
            <button
              aria-label="Restablecer ejemplo"
              onClick={() => setRevision((value) => value + 1)}
            >
              <RotateCcw size={14} />
            </button>
          </div>
          {preview?.markup ? (
            <iframe
              key={`${variant}-${revision}`}
              title={`Vista previa de ${entry.title}`}
              style={{ "--preview-height": `${height}px` }}
              sandbox=""
              srcDoc={document}
            />
          ) : (
            <p className="preview-status" role="status">
              {preview?.error || "Cargando el recurso del ejemplo…"}
            </p>
          )}
        </div>
      )}
      <CodeBlock key={variant} code={current.code} />
      {resources?.length > 0 && (
        <div
          className="work-actions lesson-resources"
          aria-label="Archivos del ejemplo"
        >
          {resources.map((filename) => (
            <a
              className="work-secondary"
              key={filename}
              href={lessonAssetUrl(filename)}
              download={filename}
            >
              Descargar {filename}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
