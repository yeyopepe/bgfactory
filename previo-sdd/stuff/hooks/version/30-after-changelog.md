# version/30 — post-changelog

### Step 1: Package the deliverable's ZIP

Once `previo-sdd/versions/{XXXX}/` already has `docs/features.zip` and the
artifacts in `files/` (and, if the version carries functional changes, the
`changelog.md`), package all the publishable content into a single ZIP.

**Command(s) to run**

From the repo root:

```
python src/scripts/package-version-zip.py {XXXX}
```

**Generated file(s)**

`previo-sdd/versions/{XXXX}/bgfactory_v{XXXX}.zip` (inside the version folder
itself). At the root of the ZIP:

- `changelog.md` (optional: only if it exists; omitted for versions with no
  functional changes to record)
- `features.zip` (copied from `docs/features.zip`)
- the loose files under `files/*` (the self-contained HTML and both READMEs)
- the whole `files/samples/` folder, under `samples/` inside the ZIP

**Notes**

- `changelog.md` is optional; the rest of the elements are mandatory and the
  script aborts without leaving a half-built ZIP if any is missing or if
  there's a name collision inside the archive.
- If a previous `bgfactory_v{XXXX}.zip` already existed, it's deleted before
  regenerating it.
- Only requires Python 3's standard library (no Node.js).
