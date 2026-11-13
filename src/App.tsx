import { mount, type CanvasInstance, type CanvasTheme } from '@ilkal/sdk';
import { useEffect, useRef, useState } from 'react';

/**
 * Where the board's font files come from. Leave `fontsUrl` out and the SDK loads them from
 * jsDelivr's copy of `@ilkal/fonts` at its own version, which is what this example does. To serve
 * them yourself, copy the package into `public/fonts/` and set `VITE_FONTS_URL=/fonts/`
 * (see the README).
 */
const FONTS_URL: string | undefined = import.meta.env.VITE_FONTS_URL || undefined;

export function App() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<CanvasInstance | null>(null);
  const [theme, setTheme] = useState<CanvasTheme>('light');
  const [log, setLog] = useState<string[]>([]);
  const shapeCount = useRef(0);

  const note = (line: string) => setLog((lines) => [line, ...lines].slice(0, 50));

  // 1. Mount the board into the element, and destroy it when the component unmounts.
  useEffect(() => {
    const host = hostRef.current;
    if (host === null) return;

    let instance: CanvasInstance | null = null;
    let isCancelled = false;
    const stops: Array<() => void> = [];

    void mount(host, {
      boardId: 'example',
      persistence: 'memory', // v0 is local only: 'memory' or 'device' (IndexedDB)
      theme,
      fontsUrl: FONTS_URL,
      onError: ({ source, error }) => note(`error (${source}): ${String(error)}`),
    }).then((mounted) => {
      // Unmounted while the board was starting: drop it.
      if (isCancelled) {
        mounted.destroy();
        return;
      }
      instance = mounted;

      // 3. Listen to changes, from the person, an agent, or undo.
      stops.push(
        mounted.on('change', ({ created, updated, deleted, origin }) => {
          note(`change by ${origin}: +${created.length} ~${updated.length} -${deleted.length}`);
        }),
        mounted.on('selection', ({ ids }) => note(`selected ${ids.length}`)),
      );
      setCanvas(mounted);
    });

    return () => {
      isCancelled = true;
      for (const stop of stops) stop();
      instance?.destroy();
      setCanvas(null);
    };
    // `theme` is only the starting theme; later changes go through setTheme below.
  }, []);

  // 2. Change the board through the document API: every change is a command.
  const addShape = () => {
    if (canvas === null) return;
    const n = shapeCount.current++;
    const text = `Shape ${n + 1}`;
    const outcome = canvas.document.run(
      'createObject',
      {
        object: {
          type: 'shape',
          kind: n % 2 === 0 ? 'rectangle' : 'ellipse',
          x: 80 + (n % 5) * 200,
          y: 80 + Math.floor(n / 5) * 160,
          width: 160,
          height: 112,
          cornerRadius: 16,
          sides: 4,
          fill: [0.42, 0.55, 0.98, 1], // [r, g, b, a], each in [0, 1]
          stroke: { color: 'ink', width: 2 },
          // The label is drawn in Inter, which loads from fontsUrl.
          label: {
            text,
            runs: [
              {
                length: text.length,
                style: {
                  fontFamily: 'Inter',
                  fontSize: 20,
                  color: 'ink',
                  weight: 500,
                  italic: false,
                },
              },
            ],
          },
        },
      },
      { origin: 'agent' }, // undo takes an agent's change back like the person's own
    );
    if (outcome.status === 'rejected') {
      note(`rejected: ${outcome.errors.map((e) => e.message).join('; ')}`);
    } else {
      note(`created ${outcome.result.id}`);
    }
  };

  // 4. Theming: start in one theme, switch while the board runs.
  const toggleTheme = () => {
    const next: CanvasTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    canvas?.setTheme(next);
  };

  return (
    <div className="app">
      <header className="bar">
        <h1>Ilkal SDK example</h1>
        <button type="button" onClick={addShape} disabled={canvas === null}>
          Add a shape
        </button>
        <button type="button" onClick={toggleTheme} disabled={canvas === null}>
          {theme === 'light' ? 'Dark' : 'Light'} theme
        </button>
        <button
          type="button"
          onClick={() => note(`${canvas?.document.objects().length ?? 0} objects`)}
          disabled={canvas === null}
        >
          Count objects
        </button>
      </header>
      <div ref={hostRef} className="board" />
      <ul className="log" aria-label="Events">
        {log.map((line, i) => (
          <li key={log.length - i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
