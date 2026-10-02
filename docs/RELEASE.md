# Release verification — 2 October 2026 UTC

This first release is a new app built during the DEV Weekend event window. It is a product release, **not confirmation of a DEV contest submission**.

## Catalogue redesign — 2 October, 13:30 UTC

The revised design replaces the initial green notebook treatment with self-hosted Archivo, a restrained ultramarine accent, flatter catalogue layout and newly drawn material-style objects. It adds card position transitions, responsive object hover, a one-time illustrated file reveal and asymmetric dialog entry/exit. The model and storage behavior remain the same.

The full browser workflow and real model inference passed after the interaction changes. A dedicated design check then passed with the final CSS: the first object's name and recorded location fit in a 1440 × 900 viewport; 375/390/768 layouts had no horizontal document overflow; object hover, category filtering and dialog open/Escape-close were exercised at 4× simulated CPU throttling; Ctrl+K focused search; reduced motion disabled all initial animations. This is headless desktop emulation, not a physical phone or frame-rate benchmark. See [redesign-check.json](../artifacts/redesign-check.json). The declared font license is distributed with the built website.

## Completed checks

- 55 unit tests passed, covering record and backup validation, storage errors, literal search and hybrid ranking behavior.
- TypeScript checking and Vite production compilation passed.
- An isolated headless Edge session exercised creation, editing, favorites, persistence, export, deletion cancellation and confirmation, and restoring a synthetic backup.
- Responsive checks at 375, 390 and 768 CSS pixels found no horizontal document overflow after the responsive layout had settled. Desktop and mobile screenshots were inspected.
- The actual quantized model initialized and performed inference in the browser. Indirect Spanish queries, exact recorded locations, absent-object queries, clearing an in-flight search and inference without a network connection in an already-initialized session were exercised.
- A synthetic query/location marker did not appear in captured request URLs or request bodies. Public model-download URL query parameters were removed from published reports; local originals remain outside version control.
- `npm audit --omit=dev` reported zero vulnerabilities after overriding the unused Node image dependency to sharp 0.35.4. This is a dependency advisory check, not a security certification.

The successful reports are [browser-check.json](../artifacts/browser-check.json), [browser-model-check.json](../artifacts/browser-model-check.json) and [dependency-audit.json](../artifacts/dependency-audit.json). [Retrieval evaluation](ai-evaluation.md) records observed failures as well as successes.

## Boundaries

No interviews or real-user validation have occurred. The collection and benchmark are synthetic. The app does not verify physical object locations, guarantee semantic matches, synchronize devices, encrypt localStorage, install as a PWA or guarantee offline reloads. No recipient relationship, contest entry, award or income is claimed.
