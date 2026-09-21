// Zero-dependency build for dsh-dusk-theme.
//
// The DSH web client module system loads a client plugin as a "lazy-CJS factory"
// bundle: the file must call `window.__ModuleLoader__.load({ id, factory })` and the
// factory returns `module.exports`. This script wraps the hand-authored client source
// (`src/client/index.js`) in exactly that envelope, copies the host no-op entry, and
// injects the bundled default background image (assets/default-background.jpg) as a
// data URL in place of the `__DUSK_DEFAULT_IMAGE__` placeholder.
import { mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve the project root from this script's location so the build works
// regardless of the caller's working directory.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const id = 'dsh-dusk-theme';

const banner =
  'window.__ModuleLoader__.load({\n' +
  `\tid: ${JSON.stringify(id)},\n` +
  '\tfactory: (require) => {\n' +
  '\t\tvar module = { exports: {} };\n' +
  '\t\tvar exports = module.exports;\n' +
  '\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });\n';

const footer = '\t\treturn module.exports;\n\t}\n});\n';

await rm(resolve(root, 'lib'), { recursive: true, force: true });
await mkdir(resolve(root, 'lib'), { recursive: true });

const host = await readFile(resolve(root, 'src/index.js'), 'utf8');
await writeFile(resolve(root, 'lib/index.js'), host);

// 内置默认背景图 → data URL
const jpg = await readFile(resolve(root, 'assets/default-background.jpg'));
const defaultImage = 'data:image/jpeg;base64,' + jpg.toString('base64');

const clientSource = (await readFile(resolve(root, 'src/client/index.js'), 'utf8'))
  .replace('__DUSK_DEFAULT_IMAGE__', defaultImage);
await writeFile(resolve(root, 'lib/client.js'), banner + clientSource + '\n' + footer);

console.log(`built lib/index.js and lib/client.js (id=${id}, default image ${(jpg.length / 1024 / 1024).toFixed(2)} MB)`);
