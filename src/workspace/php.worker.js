import { PHP, loadPHPRuntime } from "@php-wasm/universal";
import { getPHPLoaderModule } from "@php-wasm/web-8-3";
import { phpRequestOptions } from "./php-request";

self.onmessage = async ({ data: { source, file, files, request } }) => {
  let php;
  try {
    php = new PHP(await loadPHPRuntime(await getPHPLoaderModule()));
    let options = { code: source };
    if (Object.keys(files).length) {
      const directory = "/vcode-lab";
      php.mkdirTree(directory);
      for (const [name, content] of Object.entries(files))
        php.writeFile(`${directory}/${name}`, content);
      const scriptPath = `${directory}/${file}`;
      php.writeFile(scriptPath, source);
      options = { scriptPath, relativeUri: `/${file}` };
    }
    const result = await php.run({
      ...options,
      ...phpRequestOptions(request, file),
    });
    const headers = Object.entries(result.headers).flatMap(([name, values]) =>
      ["content-type", "allow", "location"].includes(name.toLowerCase()) &&
      Array.isArray(values)
        ? [[name, values.join(", ").slice(0, 1000)]]
        : [],
    );
    self.postMessage({
      output: result.text.slice(0, 20000),
      warnings: result.errors?.slice(0, 5000) || "",
      exitCode: result.exitCode,
      response: { status: result.httpStatusCode, headers },
    });
  } catch (error) {
    self.postMessage({ error: error.message });
  } finally {
    php?.exit();
  }
};
