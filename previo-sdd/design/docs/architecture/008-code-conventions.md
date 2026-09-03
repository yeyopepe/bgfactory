# 008 — Code conventions

**Area**: Conventions

- ES modules (`import`/`export`) organized by layer/responsibility, one file per functional module.
- No external dependencies by default.
- A new library is only incorporated if its bundle can be embedded whole in the final HTML (no CDN at runtime, no additional installation).
- Graphic resources go in `/src/img`, organized by component type.
- Visual conventions (color tokens, typography, spacing, BEM naming, component patterns) documented in `../style/`.
- `src/test/` contains `.json` example files in the format exported by "Exportar" (`core/persistence.js`: `buildComponentsExport` → `{ version, components, resources, tags, componentGroups, appTitle }`), to import manually (pasting into `#initial-state`, or via `localStorage`) and test already-configured component types.
- Code comments: only the necessary ones. They explain the non-obvious why (hidden constraint, invariant, one-off workaround), never the what (the code already says it). No comment if removing it would not confuse a later reader.
- Comment style, when needed: same as the technical documentation — telegraphic. No superfluous articles, no filler adverbs, verbs in present, implicit subject. References (field name, type, file) always explicit, unambiguous.
- Exception: `src/vendor/` and `src/scripts/vendor/` are third-party code as-is (see `001-overview.md`, Layered architecture) — their comments are not touched.
