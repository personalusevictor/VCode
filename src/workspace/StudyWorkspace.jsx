import React, { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Check,
  ChevronRight,
  Code2,
  Download,
  FlaskConical,
  Folder,
  PenLine,
  ScanSearch,
  Upload,
  Wrench,
} from "lucide-react";
import { TechIcon } from "../app/Brand";
import { courses } from "../lib/catalog";
import useKnowledge from "../lib/useKnowledge";
import { courseGuides, guides } from "../lib/curriculum";
import { readHistory } from "../lib/readingHistory";
import {
  download,
  importArchive,
  toggleArchive,
  updateArchive,
  useArchive,
} from "./archive";
import { learningPaths, projects, sources } from "./study-data";
import { formats } from "./formats";
import { practiceById, practiceForLanguage, practiceUrl } from "./practice";
import { projectWorkshop } from "./project-workshops";
import CodeBlock from "../docs/components/CodeBlock";

function Intro({ title, children, action }) {
  return (
    <div className="work-intro">
      <div>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
        {action}
      </div>
    </div>
  );
}
function SectionTitle({ children, link, label }) {
  return (
    <div className="work-section-title">
      <h2>{children}</h2>
      {link && (
        <a href={link}>
          {label} <ArrowRight size={16} />
        </a>
      )}
    </div>
  );
}
function Card({ href, icon: Icon, title, children }) {
  return (
    <a className="work-card" href={href}>
      <span className="work-card-icon">
        <Icon size={23} strokeWidth={1.55} />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{children}</small>
      </span>
      <ArrowUpRight size={18} />
    </a>
  );
}
function Courses({ done }) {
  const lastGuide = readHistory().find(
    (entry) => entry.kind === "guide" && !done.includes(entry.id),
  );
  return (
    <>
      <header className="learn-heading">
        <h1>Lenguajes</h1>
      </header>
      {lastGuide && (
        <a className="learn-resume" href={lastGuide.href}>
          <BookOpen size={20} />
          <span>
            <small>Retomar en {lastGuide.description}</small>
            <strong>{lastGuide.title}</strong>
          </span>
          <ArrowRight size={18} />
        </a>
      )}
      <div className="learn-catalog">
        {[
          [
            "Web e interfaces",
            ["html", "css", "javascript", "typescript", "react"],
          ],
          ["Servidor y datos", ["php", "sql"]],
          ["Programación general", ["java", "cpp"]],
        ].map(([title, ids]) => (
          <section className="learn-group" key={title}>
            <h2>{title}</h2>
            {ids.map((id) => {
              const course = courses.find((item) => item.id === id);
              const count = course.lessons.filter((lesson) =>
                done.includes(lesson.id),
              ).length;
              return (
                <a
                  className={`learn-card accent-${id}`}
                  key={id}
                  href={`#course/${id}`}
                >
                  <TechIcon id={id} />
                  <div className="learn-card-copy">
                    <h3>{course.name}</h3>
                    <p>{course.description}</p>
                  </div>
                  <span className="learn-card-meta">
                    <span>
                      {count > 0
                        ? `${count} de ${course.lessons.length}`
                        : `${course.lessons.length} lecciones`}
                    </span>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </span>
                </a>
              );
            })}
          </section>
        ))}
      </div>
    </>
  );
}
function Course({ course, done }) {
  const items = courseGuides(course.id);
  const lastGuide = readHistory().find(
    (entry) =>
      entry.kind === "guide" &&
      entry.language === course.id &&
      !done.includes(entry.id),
  );
  const remaining =
    items.find(({ id }) => id === lastGuide?.id) ||
    items.find(({ id }) => !done.includes(id));
  const complete = items.filter(({ id }) => done.includes(id)).length;
  const next = remaining || items[0];
  return (
    <>
      <header className={`course-overview accent-${course.id}`}>
        <div className="course-overview-copy">
          <div className="course-name">
            <TechIcon id={course.id} />
            <h1>{course.name}</h1>
          </div>
          <p>{course.description}</p>
        </div>
        <div className="course-next">
          <a
            className="work-primary"
            href={`#lesson/${course.id}/${next.number}`}
          >
            <span>
              <small>
                {complete || lastGuide
                  ? remaining
                    ? "Continuar"
                    : "Volver al inicio del curso"
                  : "Primera lección"}
              </small>
              <strong>{next.title}</strong>
            </span>
            <ArrowRight size={17} />
          </a>
          <div className="course-progress">
            <span>
              <strong>{complete}</strong> de {items.length} completadas
            </span>
            <progress
              value={complete}
              max={items.length}
              aria-label="Progreso del curso"
            />
          </div>
        </div>
      </header>
      <nav className="course-tools" aria-label="Acciones del curso">
        <a href={`#practice/${course.id}`}>
          <PenLine size={17} /> Ejercicios <ArrowUpRight size={14} />
        </a>
        <a
          href={`#projects/${course.id}`}
          aria-label={`${projects[course.id][0]} · Proyecto guiado`}
        >
          <Wrench size={17} /> Proyecto <ArrowUpRight size={14} />
        </a>
        <a href={`#docs/${course.id}//reference`}>
          <ScanSearch size={17} /> Referencias <ArrowUpRight size={14} />
        </a>
      </nav>
      <section className="course-syllabus">
        <SectionTitle>Temario</SectionTitle>
        {["Fundamentos", "Intermedio", "Avanzado"].map((level) => {
          const lessons = items.filter((item) => item.level === level);
          if (!lessons.length) return null;
          return (
            <section className="course-unit" key={level}>
              <div className="course-unit-head">
                <h3>{level}</h3>
                <span>
                  {lessons.length}{" "}
                  {lessons.length === 1 ? "lección" : "lecciones"}
                </span>
              </div>
              <ol>
                {lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <a href={`#lesson/${course.id}/${lesson.number}`}>
                      <span className="course-item-number">
                        {done.includes(lesson.id) ? (
                          <>
                            <Check size={16} />
                            <span className="sr-only">Completada</span>
                          </>
                        ) : (
                          String(items.indexOf(lesson) + 1).padStart(2, "0")
                        )}
                      </span>
                      <strong>{lesson.title}</strong>
                      <small>{lesson.minutes} min</small>
                      <ChevronRight size={16} />
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </section>
    </>
  );
}
function Paths() {
  return (
    <>
      <Intro title="Recorridos">
        Combina lenguajes según lo que quieres construir.
      </Intro>
      <div className="work-paths">
        {learningPaths.map((path) => (
          <section className="work-panel" key={path.title}>
            <h2>{path.title}</h2>
            <p>{path.description}</p>
            <ol>
              {path.languages.map((id) => (
                <li key={id}>
                  <a href={`#course/${id}`}>
                    <TechIcon id={id} />{" "}
                    {courses.find((item) => item.id === id).name}{" "}
                    <ArrowRight size={15} />
                  </a>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </>
  );
}
function LanguageFilter({ page, language }) {
  return (
    <nav className="work-tabbar" aria-label="Filtrar por lenguaje">
      <a href={`#${page}`} aria-current={language ? undefined : "page"}>
        Todos
      </a>
      {courses.map(({ id, name }) => (
        <a
          key={id}
          href={`#${page}/${id}`}
          aria-current={id === language ? "page" : undefined}
        >
          {name}
        </a>
      ))}
    </nav>
  );
}
function CompletionButton({ id, children }) {
  const done = useArchive().done.includes(id);
  const [error, setError] = useState(false);
  return (
    <div className="completion-control">
      <button
        className="work-secondary"
        aria-pressed={done}
        onClick={() => setError(!toggleArchive("done", id))}
      >
        <Check size={16} />
        {done ? "Completado" : children}
      </button>
      {error && <p role="alert">No se pudo guardar el avance.</p>}
    </div>
  );
}
function Practice({ language }) {
  const archive = useArchive();
  return (
    <>
      <Intro title="Práctica">
        Empieza con un ejemplo incompleto, pon a prueba tu solución y guarda tu
        borrador para retomarlo después.
      </Intro>
      <LanguageFilter page="practice" language={language} />
      {courses
        .filter(({ id }) => !language || id === language)
        .map(({ id, name }) => (
          <section className="work-section work-practice" key={id}>
            <SectionTitle link={`#course/${id}`} label="Ver curso">
              {name}
            </SectionTitle>
            <div className="practice-grid">
              {practiceForLanguage(id).map((exercise) => (
                <article className="work-panel exercise" key={exercise.id}>
                  <div>
                    <h3>{exercise.title}</h3>
                    <p>{exercise.brief}</p>
                  </div>
                  <div className="work-actions">
                    <a className="work-secondary" href={practiceUrl(exercise)}>
                      {archive.practiceDrafts[exercise.id]
                        ? "Continuar"
                        : "Practicar"}
                      <ArrowUpRight size={15} />
                      <span className="sr-only"> {exercise.title}</span>
                    </a>
                    {archive.done.includes(exercise.id) && (
                      <span className="practice-done">
                        <Check size={15} /> Resuelto
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
    </>
  );
}
function Projects({ language, done }) {
  const archive = useArchive();
  if (!language)
    return (
      <>
        <Intro title="Proyectos">
          Construye algo completo y comprueba el resultado con un plan de
          trabajo.
        </Intro>
        <div className="work-courses">
          {courses.map(({ id, name }) => (
            <a
              className={`work-course accent-${id}`}
              key={id}
              href={`#projects/${id}`}
            >
              <div className="work-course-top">
                <span className="work-course-mark">
                  <TechIcon id={id} />
                </span>
                <ArrowUpRight size={20} />
              </div>
              <div>
                <h2>{projects[id][0]}</h2>
                <p>{projects[id][1]}</p>
              </div>
              <div className="work-course-foot">
                <span>{name}</span>
                {done.includes(`project-${id}`) && (
                  <span>
                    <Check size={14} /> Terminaste
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      </>
    );
  const [title, description, steps] = projects[language];
  const workshop = projectWorkshop(language);
  const hasDraft = Boolean(archive.projectDrafts[language]);
  const href = `#playground?language=${language}&example=workshop-${language}`;
  return (
    <>
      <Intro
        title={title}
        action={
          <a className="work-primary project-open" href={href}>
            <FlaskConical size={17} />{" "}
            {hasDraft ? "Continuar mi proyecto" : "Abrir punto de partida"}
          </a>
        }
      >
        {description}
      </Intro>
      <div className="course-layout">
        <section>
          <div className="work-panel project-brief">
            <h2>Qué vas a construir</h2>
            <p>{workshop.brief}</p>
            {workshop.filePlan && (
              <dl className="project-files">
                {Object.entries(workshop.filePlan).map(([file, purpose]) => (
                  <div key={file}>
                    <dt>
                      <code>{file}</code>
                    </dt>
                    <dd>{purpose}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <SectionTitle>Plan de trabajo</SectionTitle>
          <ol className="project-steps">
            {steps.map((step, index) => (
              <li key={step}>
                <label>
                  <input
                    type="checkbox"
                    checked={done.includes(`step-${language}-${index}`)}
                    onChange={() =>
                      toggleArchive("done", `step-${language}-${index}`)
                    }
                  />
                  {step}
                </label>
              </li>
            ))}
          </ol>
          <div className="work-panel project-checks">
            <h2>Comprueba el resultado</h2>
            <ul>
              {workshop.checks.map((check) => (
                <li key={check}>{check}</li>
              ))}
            </ul>
            <details>
              <summary>Ver solución de referencia</summary>
              <div className="project-solution">
                <CodeBlock
                  code={workshop.solution}
                  language={workshop.mainFile || formats[language].file}
                />
                {Object.entries(workshop.solutionFiles || {}).map(
                  ([file, code]) => (
                    <CodeBlock key={file} code={code} language={file} />
                  ),
                )}
                {workshop.markup && (
                  <CodeBlock code={workshop.markup} language="vista.html" />
                )}
              </div>
              <a className="work-secondary" href={`${href}-solution`}>
                Ejecutar solución <ArrowUpRight size={15} />
              </a>
            </details>
          </div>
          <CompletionButton id={`project-${language}`}>
            Marcar proyecto como completo
          </CompletionButton>
        </section>
        <aside className="course-aside">
          <Card
            icon={Code2}
            href={`#course/${language}`}
            title="Repasar el curso"
          >
            Vuelve a una lección y continúa cuando la necesites.
          </Card>
          <Card icon={Folder} href="#progress" title="Mi archivo">
            Recupera tus proyectos guardados y exporta el avance.
          </Card>
        </aside>
      </div>
    </>
  );
}

function Archive() {
  const archive = useArchive();
  const [notes, setNotes] = useState(archive.notes);
  const [message, setMessage] = useState("");
  const { data, error, retry } = useKnowledge(
    { ids: archive.favorites },
    archive.favorites.length > 0,
  );
  const saved = data?.items || [];
  const done = archive.done
    .map((id) => guides.find((entry) => entry.id === id))
    .filter(Boolean);
  const practiceDrafts = Object.keys(archive.practiceDrafts)
    .map(practiceById)
    .filter(Boolean);
  return (
    <>
      <Intro
        title="Mi archivo"
        action={
          <div className="work-actions">
            <button
              className="work-secondary"
              onClick={() =>
                download(
                  "vcode-archivo.json",
                  JSON.stringify({ version: 1, archive }, null, 2),
                  "application/json",
                )
              }
            >
              <Download size={16} /> Exportar
            </button>
            <label className="work-secondary archive-import">
              <Upload size={16} /> Importar
              <input
                type="file"
                accept="application/json,.json"
                aria-label="Importar copia de Mi archivo"
                onChange={async (event) => {
                  const file = event.target.files[0];
                  event.target.value = "";
                  if (!file) return;
                  try {
                    const ok =
                      file.size <= 1500000 && importArchive(await file.text());
                    setMessage(
                      ok
                        ? "Copia incorporada. Se conservaron los borradores existentes."
                        : "El archivo no es una copia válida de VCode.",
                    );
                  } catch {
                    setMessage("No se pudo leer la copia.");
                  }
                }}
              />
            </label>
          </div>
        }
      >
        Tus notas, referencias y avances se guardan en este navegador.
      </Intro>
      <p role="status" className="work-muted">
        {message}
      </p>
      <div className="archive-grid">
        <section className="work-panel">
          <h2>Notas</h2>
          <textarea
            aria-label="Mis notas"
            placeholder="Escribe algo que quieras recordar…"
            value={notes}
            maxLength={100000}
            onChange={(event) => setNotes(event.target.value)}
          />
          <button
            className="work-primary"
            onClick={() =>
              setMessage(
                updateArchive((current) => ({ ...current, notes }))
                  ? "Notas guardadas."
                  : "No se pudieron guardar las notas.",
              )
            }
          >
            Guardar notas
          </button>
        </section>
        <section className="work-panel">
          <h2>Borradores</h2>
          {practiceDrafts.length > 0 && (
            <ul className="work-link-list">
              {practiceDrafts.map((exercise) => (
                <li key={exercise.id}>
                  <a href={practiceUrl(exercise)}>
                    {exercise.title} <ArrowUpRight size={16} />
                  </a>
                </li>
              ))}
            </ul>
          )}
          {Object.keys(archive.projectDrafts).length > 0 && (
            <ul className="work-link-list">
              {Object.keys(archive.projectDrafts).map((language) => (
                <li key={language}>
                  <a
                    href={`#playground?language=${language}&example=workshop-${language}`}
                  >
                    {projects[language][0]} <ArrowUpRight size={16} />
                  </a>
                </li>
              ))}
            </ul>
          )}
          {Object.keys(archive.drafts).length ? (
            <ul className="work-link-list">
              {Object.keys(archive.drafts).map((id) => (
                <li key={id}>
                  <a href={`#playground?language=${id}`}>
                    {formats[id].file}
                    <ArrowUpRight size={16} />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            !Object.keys(archive.projectDrafts).length &&
            !practiceDrafts.length && (
              <p>
                Guarda código desde el{" "}
                <a className="work-link" href="#playground">
                  laboratorio
                </a>{" "}
                para volver a editarlo aquí.
              </p>
            )
          )}
        </section>
        <section className="work-panel">
          <h2>Referencias guardadas</h2>
          {archive.favorites.length > 0 && !data ? (
            <>
              <p role="status">
                {error
                  ? "No se pudieron cargar las referencias guardadas."
                  : "Cargando tus referencias…"}
              </p>
              {error && (
                <button className="work-secondary" onClick={retry}>
                  Volver a intentar
                </button>
              )}
            </>
          ) : saved.length ? (
            <ul className="work-link-list">
              {saved.map((entry) => (
                <li key={entry.id}>
                  <a href={entry.href}>
                    {entry.title}
                    <ArrowUpRight size={16} />
                  </a>
                  <button
                    className="work-icon"
                    aria-label={`Retirar ${entry.title}`}
                    onClick={() => toggleArchive("favorites", entry.id)}
                  >
                    <Bookmark size={16} fill="currentColor" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Guarda una entrada desde el lector para encontrarla aquí.</p>
          )}
        </section>
        <section className="work-panel">
          <h2>Avances</h2>
          <p>
            {done.length} lecciones ·{" "}
            {archive.done.filter((id) => id.startsWith("exercise-")).length}{" "}
            ejercicios ·{" "}
            {archive.done.filter((id) => id.startsWith("project-")).length}{" "}
            proyectos
          </p>
          {done.length > 0 && (
            <ul className="work-link-list">
              {done
                .slice(-10)
                .reverse()
                .map((entry) => (
                  <li key={entry.id}>
                    <a href={`#lesson/${entry.language}/${entry.number}`}>
                      {entry.title}
                      <ArrowUpRight size={16} />
                    </a>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
function Resources() {
  return (
    <>
      <Intro title="Fuentes y créditos">
        La documentación de referencia que acompaña a los cursos de VCode.
      </Intro>
      <div className="work-courses">
        {courses.map(({ id, name }) => {
          const [title, href] = sources[id];
          return (
            <a
              className="work-card"
              href={href}
              target="_blank"
              rel="noreferrer"
              key={id}
            >
              <span className="work-card-icon">
                <TechIcon id={id} />
              </span>
              <span>
                <strong>{name}</strong>
                <small>{title}</small>
              </span>
              <ArrowUpRight size={17} />
            </a>
          );
        })}
      </div>
      <section className="work-section work-panel">
        <h2>Créditos</h2>
        <p>
          Diseño y desarrollo de VCode por Víctor Martín Pérez. Iconos de Lucide
          y marcas de los lenguajes para identificar cada materia. El catálogo
          CSS utiliza datos de W3C Webref. Ejecuta SQL con SQLite a través de
          sql.js.
        </p>
      </section>
    </>
  );
}
export default function StudyWorkspace({ page, course }) {
  const { done } = useArchive();
  const language = course?.id;
  let content;
  switch (page) {
    case "courses":
      content = <Courses done={done} />;
      break;
    case "course":
      content = course && <Course course={course} done={done} />;
      break;
    case "paths":
      content = <Paths />;
      break;
    case "practice":
      content = <Practice language={language} />;
      break;
    case "projects":
      content = <Projects language={language} done={done} />;
      break;
    case "progress":
      content = <Archive />;
      break;
    case "resources":
      content = <Resources />;
      break;
    case "contact":
      content = (
        <Intro title="Contacto">
          Para señalar una errata o proponer un tema, contacta con{" "}
          <a className="work-link" href="mailto:personalusevictor@gmail.com">
            Víctor Martín Pérez
          </a>
          .
        </Intro>
      );
      break;
  }
  return (
    content || (
      <Intro
        title="Página no encontrada"
        action={
          <a className="work-primary" href="#home">
            Volver al inicio <ArrowRight size={16} />
          </a>
        }
      >
        Puede que la dirección haya cambiado.
      </Intro>
    )
  );
}
