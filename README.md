# Canvas example: embedding the Ilkal SDK

A small Vite + React 19 + TypeScript app that puts an infinite canvas in a page with
[`@ilkal/sdk`](https://www.npmjs.com/package/@ilkal/sdk). It mounts a board, adds shapes through
the document API, logs the board's events and switches its theme. The board's fonts load from
jsDelivr.

Version 0 of the SDK is local only. The board lives in memory in the page, and the SDK makes no
network request except for its fonts.

## Run it

You need Node 22 or later.

```sh
npm install
npm run dev
```

Open the address Vite prints. Click **Add a shape** to create shapes through the document API, or
draw on the board with its own tools. The panel on the right lists each `change` and `selection`
event. **Dark theme** switches the theme while the board runs.

`npm run build` typechecks and builds the app into `dist/`, and `npm run preview` serves that
build.

## How it works

All the SDK code is in [`src/App.tsx`](src/App.tsx).

**Mount.** `mount(element, options)` puts the whole editor into an element and resolves with the
board once it is ready. The board fills the element, so the element needs a size (`.board` in
[`src/styles.css`](src/styles.css)). The effect destroys the board when the component unmounts.

```ts
const canvas = await mount(host, {
  boardId: 'example',
  persistence: 'memory', // or 'device', to keep the board in IndexedDB
  theme: 'light',
  onError: ({ source, error }) => console.error(source, error),
});
// later: canvas.destroy();
```

**The document API.** `canvas.document` reads the board (`objects()`, `get(id)`) and changes it
through commands. Each command runs as one undo step, or is refused whole. Command names and their
inputs are typed. This example creates a labelled shape as the SDK's agent, so undo takes it back
like the person's own changes:

```ts
const outcome = canvas.document.run(
  'createObject',
  { object: { type: 'shape', kind: 'rectangle', x: 80, y: 80, width: 160, height: 112, ... } },
  { origin: 'agent' },
);
if (outcome.status === 'rejected') console.warn(outcome.errors);
```

**Events.** `canvas.on(type, listener)` returns a function that stops listening. The example
listens to `change`, which lists the objects created, updated and deleted and who changed them, and
to `selection`.

**Theming.** `theme` sets the starting theme: `'light'`, `'dark'` or `'system'`.
`canvas.setTheme()` changes it while the board runs.

**Fonts.** The board's fonts come from the `@ilkal/fonts` package, at the same version as the SDK.
By default they load from jsDelivr, at `https://cdn.jsdelivr.net/npm/@ilkal/fonts@<version>/`. To
serve them yourself, copy the package into `public/fonts/` and point `fontsUrl` at it. This example
reads `fontsUrl` from `VITE_FONTS_URL`:

```sh
npm install @ilkal/fonts@<same version as @ilkal/sdk>
cp -R node_modules/@ilkal/fonts/. public/fonts/
VITE_FONTS_URL=/fonts/ npm run dev
```

## Vite settings

[`vite.config.ts`](vite.config.ts) has two settings for the SDK:

- `optimizeDeps.exclude` serves the SDK as published in development. Vite's dependency
  pre-bundling would move its modules away from the worker files they start.
- The `copySdkWorkers` plugin copies the SDK's worker files into the build under their published
  names. In 0.1.3 the engine worker starts its job workers by those names, and without them the
  board draws no text.

Use Vite 7. With Vite 8, a production build of 0.1.3 leaves out the SDK's stylesheet.

## Links

- The SDK's source, README and issues: [github.com/ilkal-app/canvas](https://github.com/ilkal-app/canvas)
- API reference: [ilkal.dev/api](https://ilkal.dev/api/)
- npm: [@ilkal/sdk](https://www.npmjs.com/package/@ilkal/sdk) and
  [@ilkal/fonts](https://www.npmjs.com/package/@ilkal/fonts)

## Licence and trademark

This example is licensed under the [Apache License 2.0](LICENSE).

Ilkal™ is a trademark of Rudr Studio, Inc. The licence grants no right to use the name or the
logo. See the SDK's [TRADEMARKS.md](https://github.com/ilkal-app/canvas/blob/main/TRADEMARKS.md).
