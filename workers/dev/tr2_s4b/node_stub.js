// TR2-S4b: the few browser globals the asset modules read at import time (node test only)
if (typeof globalThis.window === 'undefined') globalThis.window = globalThis;
if (typeof globalThis.document === 'undefined') globalThis.document = { createElement: () => ({ getContext: () => null, style: {} }), addEventListener() {}, documentElement: { style: {} } };
if (typeof globalThis.localStorage === 'undefined') globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
