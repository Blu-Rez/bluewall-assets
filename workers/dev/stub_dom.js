globalThis.window = globalThis; globalThis.document = { createElement: () => ({ getContext: () => ({}) }) };
