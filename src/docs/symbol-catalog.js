import cssReferences from "./data/css-reference.json";
import standardIndexes from "./data/standard-indexes.json";
import quickReferences from "./data/quick-reference.json";

const symbols = new Map(
  [...standardIndexes, ...quickReferences, ...cssReferences].map((item) => [
    item.id,
    item,
  ]),
);

export const symbolById = (id) => symbols.get(id);
