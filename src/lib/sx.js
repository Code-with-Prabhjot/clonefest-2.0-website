/**
 * Convert a CSS declaration string into a React style object.
 *
 * The Admin and Judge portals were designed as inline-styled markup, and their
 * layout logic builds style strings at runtime (see each portal's `renderVals`).
 * Rather than rewrite that logic, we parse the strings here. Results are cached
 * because the same declaration strings recur on every render.
 */
const cache = new Map();

/** Split on top-level `;` only, so `url(...)` and gradients survive intact. */
function splitDeclarations(css) {
  const parts = [];
  let buf = '';
  let depth = 0;

  for (const ch of css) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;

    if (ch === ';' && depth === 0) {
      parts.push(buf);
      buf = '';
    } else {
      buf += ch;
    }
  }
  parts.push(buf);
  return parts;
}

export function sx(css) {
  if (!css) return undefined;
  if (typeof css !== 'string') return css;

  const hit = cache.get(css);
  if (hit) return hit;

  const style = {};
  for (const decl of splitDeclarations(css)) {
    const i = decl.indexOf(':');
    if (i < 0) continue;

    const prop = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (!prop || !value) continue;

    // Custom properties keep their literal name; everything else camelCases.
    const key = prop.startsWith('--')
      ? prop
      : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

    style[key] = value;
  }

  cache.set(css, style);
  return style;
}

export default sx;
