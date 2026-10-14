// node has no window: the loader modules read window.BW_ASSETS at load time
globalThis.window = globalThis.window || { BW_ASSETS: 'assets/' }; globalThis.document = globalThis.document || { createElement: () => ({ getContext: () => null, style: {} }) };
