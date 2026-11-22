import examples from "./data/web-examples.json";

const samples = new Map(examples.map((example) => [example.id, example]));
export const webExampleById = (id) => samples.get(id);
