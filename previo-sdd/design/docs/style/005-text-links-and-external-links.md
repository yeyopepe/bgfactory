# 005 — Text links and external links

**Area**: Layout & components

First user-facing hyperlink (`<a>`) in `/src`: change 00243, the repository link in the version footer (`#app-version`, see `002-componentes-layout.md`, "Version footer"). No `<a>` existed anywhere in `/src` before it.

## Visual

| Property | Value | Note |
|---|---|---|
| `color` | `inherit` | Link takes the surrounding text color — no dedicated link token, no `--accent-blue` |
| `text-decoration` | `underline` | The only thing distinguishing a link from adjacent text |
| `:visited` / `:hover` / `:active` | not styled | No state variants; browser default pointer cursor from `<a href>` |

- [gotcha] a text link is NOT `--accent-blue`. Accent blue means "interactive control / selected" across the app (buttons, active tab, selection outline); a text link is distinguished by the underline alone, in the color of its context.
- Reference rule: `#app-version a` in `src/styles/main.css`.

## Markup

- Built with `document.createElement('a')` + property assignment (`href`, `textContent`, `target`, `rel`), never interpolated `innerHTML` — same DOM convention as the rest of the app (`004-naming-and-patterns.md`, Component patterns).
- Visible text is a readable label (`Ver en Github`), never the raw URL.

## External links

`external` — opens a destination outside the app:

- `target="_blank"` always paired with `rel="noopener"`.
- Opens in a new browser tab; the app tab keeps its state.
- Reference: the repository link in `#app-version` → `https://github.com/yeyopepe/bgfactory`.
