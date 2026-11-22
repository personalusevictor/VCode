import workshops from "./project-workshops.json";

export const projectWorkshop = (language) =>
  Object.hasOwn(workshops, language) ? workshops[language] : null;

export function workshopExample(id) {
  const route = /^workshop-([a-z]+)(-solution)?$/.exec(id || "");
  if (!route) return null;
  const [, language, solution] = route;
  const workshop = projectWorkshop(language);
  if (!workshop) return null;
  return {
    language,
    project: language,
    solution: Boolean(solution),
    code: solution ? workshop.solution : workshop.starter,
    files: solution ? workshop.solutionFiles : workshop.starterFiles,
    markup: workshop.markup,
    mode: workshop.mode,
  };
}
