# This is Gooey, a ridiculously extensible and customizable agent and harness with a delightfully beautiful GUI

Check the `docs/` folder for product vision, specs, and other project context before making major product or architecture decisions.

UI implementation guidelines:
- Be aggressive about extracting non-trivial UI into focused components instead of hard-coding large sections directly into screen/container files.
- Keep top-level screen components primarily responsible for composition, state, and wiring; move distinct visual regions, rows/items, and mock data/types into dedicated files when they start to grow.

Documentation naming convention:
- Use dated filenames under `docs/`
- Format: `YYYY-MM-DD-short-name.md`
- Examples:
  - `2026-04-14-gooey-vision.md`
  - `2026-04-15-gooey-v0-spec.md`
