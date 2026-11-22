const style = `
  :root { color-scheme: light; color: #1d2635; font: 16px/1.5 system-ui; }
  body { margin: 0; padding: 24px; background: #f5f7fb; }
  button { padding: 10px 16px; border: 0; border-radius: 8px; background: #343df0; color: white; font: inherit; cursor: pointer; }
  img, svg, video { max-width: 100%; height: auto; }
`;
const escapeScript = (source) => source.replace(/<\/script/gi, "<\\/script");
const escapeStyle = (source) => source.replace(/<\/style/gi, "");
const script = (code) => `<script>${escapeScript(code)}<\/script>`;

export function previewDocument({
  markup = "",
  css = "",
  runtime = "",
  code = "",
  token,
  modules = false,
}) {
  const interactive = Boolean(code);
  const policy = `default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; form-action 'none'; base-uri 'none'; ${interactive ? `script-src 'unsafe-inline' 'unsafe-eval'${modules ? " blob:" : ""}; worker-src blob:; connect-src data:;` : ""}`;
  const setup = `
    const send = (type, value) => parent.postMessage({ token: ${JSON.stringify(token)}, type, value }, '*');
    const format = (value) => {
      if (typeof value === 'string') return value;
      try { return JSON.stringify(value, null, 2) ?? String(value); } catch { return String(value); }
    };
    for (const method of ['log', 'info', 'warn', 'error', 'table']) {
      console[method] = (...args) => send(method, args.map(format).join(' '));
    }
    addEventListener('error', e => send('error', e.message));
    addEventListener('unhandledrejection', e => send('error', String(e.reason)));
  `;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><base href="about:srcdoc"><meta http-equiv="Content-Security-Policy" content="${policy}"><style>${style}\n${escapeStyle(css)}</style></head><body>${markup}${interactive ? script(setup) + script(runtime) + script(code) : ""}</body></html>`;
}

export function consoleCode(source) {
  return `
    const workerCode = \`
      const format = value => {
        if (typeof value === 'string') return value;
        try { return JSON.stringify(value, null, 2) ?? String(value); } catch { return String(value); }
      };
      const emit = (type, value) => postMessage({ type, value });
      for (const method of ['log', 'info', 'warn', 'error', 'table']) {
        console[method] = (...args) => emit(method, args.map(format).join(' '));
      }
      const exports = {};
      const module = { exports };
      (async () => {\\n\` + ${JSON.stringify(source)} + \`\\n})()
        .then(() => setTimeout(() => emit('done', ''), 80), error => emit('error', error.message));
    \`;
    const url = URL.createObjectURL(new Blob([workerCode], { type: 'text/javascript' }));
    const worker = new Worker(url);
    let count = 0;
    const stop = () => {
      clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(url);
    };
    const timeout = setTimeout(() => {
      stop();
      send('error', 'La ejecución superó los 2,5 segundos.');
    }, 2500);
    worker.onmessage = ({ data }) => {
      if (++count > 200) {
        stop();
        send('error', 'Se alcanzó el límite de mensajes.');
      } else {
        if (data.type === 'done' || data.type === 'error') stop();
        send(data.type, String(data.value).slice(0, 5000));
      }
    };
    worker.onerror = error => { stop(); send('error', error.message); };
  `;
}

export function domCode(source) {
  return `(async () => {\n${source}\n})().then(
    () => send("done", ""),
    (error) => send("error", error.message)
  );`;
}

function renderReactDefault(exports) {
  return `
    const App = ${exports}.default;
    if (typeof App === 'function' || (App && typeof App === 'object')) {
      ReactClient.createRoot(document.getElementById('root')).render(React.createElement(App));
    }`;
}

export function moduleCode(source, mode) {
  const load = `
    const url = URL.createObjectURL(new Blob([${JSON.stringify(source)}], { type: 'text/javascript' }));
    const entry = await import(url).finally(() => URL.revokeObjectURL(url));
  `;
  if (mode === "console") return consoleCode(load);
  return domCode(load + (mode === "react" ? renderReactDefault("entry") : ""));
}

export function reactCode(source) {
  return `
    const exports = {};
    const module = { exports };
    const require = (name) => {
      if (name === 'react') return React;
      if (name === 'react-dom') return ReactDOM;
      if (name === 'react-dom/client') return ReactClient;
      throw new Error('Módulo no disponible en el laboratorio: ' + name);
    };
    const run = new Function('exports', 'module', 'require', ${JSON.stringify(source)});
    run(exports, module, require);
    ${renderReactDefault("module.exports")}
    send('done', '');
  `;
}

export function javaCode(runtime, bytes) {
  const source = `
    const from64 = encoded => Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
    const streams = { log: '', error: '' };
    const emit = (type, value) => postMessage({ type, value });
    const flush = type => {
      if (streams[type]) emit(type, streams[type]);
      streams[type] = '';
    };
    const write = (type, code) => {
      if (code === 10) {
        emit(type, streams[type]);
        streams[type] = '';
      } else if (streams[type].length < 5000) {
        streams[type] += String.fromCharCode(code);
      }
    };
    async function run() {
      const app = await TeaVM.load(from64(${JSON.stringify(bytes)}), {
        noAutoImports: true,
        installImports(imports) {
          imports.teavmConsole = {
            putcharStdout: code => write('log', code),
            putcharStderr: code => write('error', code),
          };
        },
      });
      await app.exports.main([]);
      flush('log');
      flush('error');
    }
    run().then(() => emit('done', ''), error => emit('failed', error.message));
  `;
  return `
    const workerUrl = URL.createObjectURL(new Blob(
      [${JSON.stringify(runtime)}, ${JSON.stringify(source)}],
      { type: 'text/javascript' }
    ));
    const worker = new Worker(workerUrl);
    let count = 0;
    const stop = () => {
      clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };
    const timeout = setTimeout(() => {
      stop();
      send('error', 'El programa de Java superó el tiempo disponible.');
    }, 5000);
    worker.onmessage = ({ data }) => {
      if (++count > 200) {
        stop();
        send('error', 'Se alcanzó el límite de mensajes.');
      } else if (data.type === 'failed') {
        stop();
        send('error', data.value);
      } else {
        if (data.type === 'done') stop();
        send(data.type === 'error' ? 'stderr' : data.type, data.value);
      }
    };
    worker.onerror = error => { stop(); send('error', error.message); };
  `;
}
