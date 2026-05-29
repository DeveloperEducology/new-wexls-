import { existsSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');

function resolveLocalFile(specifier) {
  const relativePath = specifier.replace(/^@\//, '');
  const absoluteBase = path.join(root, 'src', relativePath);
  const candidates = [
    absoluteBase,
    `${absoluteBase}.js`,
    `${absoluteBase}.jsx`,
    path.join(absoluteBase, 'index.js'),
    path.join(absoluteBase, 'index.jsx'),
  ];

  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const file = resolveLocalFile(specifier);
      if (file) {
        return {
          shortCircuit: true,
          url: pathToFileURL(file).href,
        };
      }
    }

    return nextResolve(specifier, context);
  },
});
