import initSqlJs from "sql.js";
import wasm from "sql.js/dist/sql-wasm.wasm?url";
import { sqlSeed } from "./formats";
import { bindSqlParameters } from "./sql-parameters";

const tableLimit = 12;
const rowLimit = 200;
let runtime;

self.onmessage = async ({ data: { code, parameters } }) => {
  let db;
  try {
    if (!runtime) self.postMessage({ phase: "Preparando SQLite…" });
    const SQL = await (runtime ??= initSqlJs({ locateFile: () => wasm }).catch(
      (error) => {
        runtime = undefined;
        throw error;
      },
    ));
    db = new SQL.Database();
    db.exec(sqlSeed);
    const tables = [];
    let omitted = 0;
    const position = { anonymous: 0 };
    for (const statement of db.iterateStatements(code)) {
      const valuesToBind = bindSqlParameters(
        statement.getSQL(),
        parameters,
        position,
      );
      if (valuesToBind.length) statement.bind(valuesToBind);
      const columns = statement.getColumnNames();
      const showTable = columns.length > 0 && tables.length < tableLimit;
      const values = [];
      let truncated = false;
      while (statement.step()) {
        if (!showTable) continue;
        if (values.length < rowLimit) values.push(statement.get());
        else truncated = true;
      }
      if (showTable) tables.push({ columns, values, truncated });
      else if (columns.length) omitted++;
    }
    self.postMessage({ tables, omitted });
  } catch (error) {
    self.postMessage({ error: error.message });
  } finally {
    db?.close();
  }
};
