# Release verification — 2 October 2026 UTC

This first release is a new app built during the DEV Weekend event window. It is a product release, **not confirmation of a DEV contest submission**.

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
