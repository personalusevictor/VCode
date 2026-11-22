import React, { lazy, Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { courses } from "../lib/catalog";
import { workspaceNames } from "./routes";

const StudyWorkspace = lazy(() => import("./StudyWorkspace"));
const Laboratory = lazy(() => import("./Laboratory"));

export default function Workspace({ route }) {
  const [page, requested] = route.split("?")[0].split("/");
  const course = courses.find(({ id }) => requested === id);
  const title = workspaceNames[page];
  const laboratory = page === "studio" || page === "playground";

  return (
    <div className="workspace">
      <nav className="work-breadcrumb" aria-label="Ruta de navegación">
        <a href="#home">Inicio</a>
        <ChevronRight size={14} />
        {course && page !== "course" ? (
          <a href={`#${page}`}>{title}</a>
        ) : course ? (
          <a href="#courses">Aprender</a>
        ) : null}
        {course && <ChevronRight size={14} />}
        <span aria-current="page">
          {course?.name || title || "Página desconocida"}
        </span>
      </nav>
      {laboratory ? (
        <Suspense fallback={<p role="status">Abriendo el laboratorio…</p>}>
          <Laboratory route={route} />
        </Suspense>
      ) : (
        <StudyWorkspace page={page} course={course} />
      )}
    </div>
  );
}
