# 🎲 BG Factory — A 100% portable board game editor

[Versión en español](README.es.md)

**BG Factory** is a visual editor for creating and playing your own digital board games, shipped as **a single self-contained HTML file**. No install, no accounts, no server, no online dependencies: download the file, double-click it in any modern browser, and your game table is ready — editor and data bundled in the same `.html`.


> 🖼️ *Screenshot: infinite game table with several components (cards, board, die) — `docs/screenshots/mesa-general.png`*

## 🚀 Why BG Factory?

- **📦 100% portable**: the whole editor (HTML + CSS + JS) lives in a single file. Copy it to a USB stick, email it, or drop it in the cloud — wherever you open it, it works the same.
- **⚡ No install, no accounts**: nothing to install, no sign-up, no reliance on a cloud service. Open the file and start playing or editing. A single HTML file is all you need.
- **🎒 Your game travels with you**: hit "Export" and you download a complete copy of all content and settings as JSON that you can share with anyone, who can then open it and keep playing or editing with nothing else.
- **✈️ Works offline**: once downloaded, it needs no internet connection at all.
- **💾 Local autosave**: while you work, your game is saved automatically in the browser, so you never have to worry about losing changes.

## 🧩 What you can do with it

### 🖌️ A full visual editor

- Infinite game table, with free pan and zoom navigation.
- Floating components panel (draggable, collapsible and resizable) with a table listing: sort, filter and text-search on any column in a couple of clicks.
- Multi-selection with Ctrl/Cmd+click, block dragging that preserves relative distances, and bulk deletion with confirmation.
- **Grouping**: combine several components into one unit with its own properties (lock, visibility, tooltip, tags), move and edit them as one, and ungroup whenever you want without losing anything.
- **"Copy" elements**: create linked, synced copies of an original component — change the original and all its copies update on their own (with the option to unsync lock/visibility copy by copy).
- **Tags**: organize and locate components by name; select with one click every element carrying a tag, even if it is stored inside a deck.
- Context menus (right-click) specific to each mode and component type.
- Keyboard shortcuts and a style clipboard to copy/paste appearance between components.
- Fine control over the **stacking order** (z-index) on the table, individually or in bulk for whole groups.
- Configurable **depth/extrusion** effect (thickness and color) to give any piece 3D volume.
- **Per-component title and tooltip**, with dynamic text variables (e.g. `{cards_current}` to show how many cards are left in a deck, always up to date).

> 🖼️ *Screenshot: components panel with filters, an expanded group and a context menu — `docs/screenshots/panel-componentes.png`*

### 🎯 Ready-to-use game components

- **🃏 Cards**: visual editor with image layers, geometric shapes (circle, square, rounded) and text boxes with their own styling (font, color, borders, alignment, free rotation); two independent faces (front/back) with animated flip; preset aspect ratios (poker, tarot, square, circular, hexagonal, triangular) or free.
- **🂠 Decks**: an ordered, shufflable stack of cards, with a configurable reveal area (position, text, face shown when drawing), its own back image, and a "Shuffle" / "View contents" / "Add card to deck" menu by dragging or from the context menu.
- **🎲 Dice**: configurable number of faces or a list of custom values (numeric or text), its own typography for the result, a roll animation, and an enlarged result modal on double-click.
- **🗺️ Simple boards**: square or hexagonal grid (vertical/horizontal) with a background color or image, beveled or flat border, with or without shadow.
- **🖼️ Custom boards**: the same advanced visual editor as cards (image layers, shapes and text) for bespoke boards and maps, at real pixel size.
- **📝 Text boxes** with rich formatting (Markdown or HTML).
- **📄 Document viewers**: pasted text/Markdown or an embedded external web page, as a rulebook or reference help always at hand.
- **Scripted interactions** per component and per action type (click, double-click, drag, right-click): decide what the player can do with each piece.
- Configurable movement lock per component or group (never / only in play mode / always) and an option to hide pieces from the audience in play mode.

> 🖼️ *Screenshot: visual editor of a card with image layers, shapes and text — `docs/screenshots/editor-carta.png`*
> 🖼️ *Screenshot: deck with a reveal area and the "View contents" modal — `docs/screenshots/mazo-cartas.png`*

### 🖼️ Asset and image management

- A separate assets panel, with upload of a single file, several at once, or a whole folder.
- Automatic conversion to WebP when uploading images, to keep the final file lightweight.
- Duplicate-name detection with a replace option, and a final upload summary (added, replaced, skipped by format).
- Enlarged preview with zoom and pan to get the image just right before using it.
- Sample assets included from the first launch, so you can start tinkering without uploading anything.
- Warning and block when trying to delete an asset still in use by a component.

### 🕹️ Edit mode and play mode, kept apart

- **Edit mode**: configure components, properties, assets, tags and table layout, with all the design panels and controls in view.
- **Play mode**: interact with the game as a player — roll dice, draw and flip cards, move pieces, check tooltips — without risking a change to the design or seeing the editing panels.
- Instant switch between the two modes, always on the same game (there are no two separate versions of the state).

> 🖼️ *Screenshot: edit mode vs. play mode of the same table, side by side — `docs/screenshots/modo-edicion-vs-juego.png`*

### 🔄 Flexible import/export

- **Save**: download a complete copy of the editor with your game embedded inside it (the portable file itself).
- **Selective export/import**: move individual components, assets and tags between games as JSON, choosing exactly what to take with you.
- On import, decide whether to add to what exists or overwrite, and how to resolve duplicate ids (overwrite or keep both).
- A detailed report on id or reference conflicts, and automatic migration of saves from earlier editor versions.
- Editable game title, used as the default file name when saving or exporting.

## ▶️ Start playing

Just download the latest release from this repository and open the HTML file directly in your browser.


## 🛠️ Development

This project is developed using [Previo](https://github.com/yeyopepe/previo-sdd), an AI-based rapid development framework.

The source code lives in `/src`, organized into layers (`core`, `modes`, `ui`, `data`). To develop and test, open `src/index.html` with a local static server (e.g. the VSCode "Live Server" extension) — do not open it by double-click, since it uses ES modules that don't load properly over `file://`.
