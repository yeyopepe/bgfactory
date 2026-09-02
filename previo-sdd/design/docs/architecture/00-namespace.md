# 00 — Namespace

Single canonical name tree for this project. Every concept and every assertion (architecture and style alike) has exactly one path here. Style concepts live on the `ui.*` branch -- there is no separate namespace file for the style bible.

## Notation

Compact notation for structured data:

```
field: type                  required field
field?: type                 optional field
field: type = value          default value
field: type in {a, b, c}     enum / allowed set
field: type [min..max]       range
```

Invariants -- executable vs declarative:

- `assert <expr>` when there is a program point where the condition can be checked with the values at hand.
- declarative `inv: ...` / `pre:` / `post:` (propositional logic, `and or not -> forall`) when it quantifies over an abstract set, talks about an FSM state, or a non-observable global property.
- If both forms fit, the `assert` governs and the declarative one is a restatement.

Boundary between a leaf's two forms:

- `path = <scalar>` -- a simple value (number, enum, boolean).
- `path:` then a notation block -- an assertion with logical structure (a contract, a logic expression).

## Tree

Segment order: aggregate to part, module to detail. `<area>.<aggregate>.<entity>.<field-or-assertion>`.

- `auth.token.session.exp` -- OK (area auth -> aggregate token -> entity session -> field exp)
- `auth.session.token.exp` -- wrong (inverts aggregate and entity)

Domain terms with no standard English translation: if the concept has a code symbol, the path uses the symbol name; if it has none, the slug may stay in the project's language for that one node (e.g. `billing.recargo-equivalencia`), noted here as an explicit exception with a one-line approximate-English gloss.

<Empty. pv-do populates this over time.>
