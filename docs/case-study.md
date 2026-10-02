# A mano: remember the place, find the thing

**Publication draft. DEV submission has not yet been confirmed.**

*Prepared for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01).*

## What I Built

I built **A mano** around a practical problem affecting Lucía, a designer who works from home. **Lucía is a pseudonym for a real person who prefers to keep her identity private.**

She sometimes remembers what an object does more easily than its name or where she stored it. Connecting a laptop to a television becomes a search for the thing that puts the computer screen on the TV, rather than for “USB-C to HDMI.”

A mano connects that remembered purpose to a saved record. Each object has a name, room, precise location and optional description. Ordinary keyword search works immediately. An optional open-weight model runs in the browser and finds additional matches from descriptions of what someone needs to do. It suggests existing records; it cannot invent locations.

The useful result is deliberately simple: an editable card saying where to look. Users can update a location after moving an object, mark favorites, filter rooms and export a backup.

The public demo contains ten synthetic records, separate from personal collections. Its adapter example reproduces a technically tested search; it is not evidence of Lucía's possessions, feedback or measured time savings.

Personal records stay in the browser, without synchronization or encryption. The model needs an initial download and can return incorrect suggestions. Objects must first be recorded, and their locations kept current. Those limits remain visible alongside the working demo.

The Spanish interface uses a compact catalogue layout, self-hosted Archivo and original SVG objects. Card transitions preserve context when filtering, while keyboard navigation and reduced-motion preferences remain supported.

![The A mano interface, showing synthetic demonstration objects](https://raw.githubusercontent.com/EazyHood/a-mano/f2175af42ed3dbca0c81da656178d6aea4ab9b99/artifacts/redesign-desktop.png)

## Demo

[Open A mano](https://eazyhood.github.io/a-mano/).

Try this route:

1. Keep **Explorar demo** selected. Search `estuche gris`; the adapter appears because that exact place is recorded.
2. Clear the field and choose **Activar**. The first activation downloads approximately 160 MB of public model and runtime assets. No account or paid inference key is needed.
3. Search `quiero mostrar la pantalla del computador en el televisor`. The model suggests the USB-C to HDMI adapter even though that sentence is not its title. Open its card to inspect the recorded location.
4. Switch to **Mis cosas**, add a harmless test object, edit its place and export a backup. The fictional and personal collections stay separate.

## Code

[Repository, reproducible checks and evidence](https://github.com/EazyHood/a-mano).

This is new source written during the event window, with OpenAI Codex assistance. Earlier projects informed design decisions; their code was not repackaged as this entry. The repository records authorship, third-party licenses, synthetic test data and current limitations.

## How I Built It

React and TypeScript handle the interface. Transformers.js 3.8.1 loads a pinned, quantized ONNX conversion of **paraphrase-multilingual-MiniLM-L12-v2** in a Web Worker. Mean-pooled, normalized embeddings let cosine similarity rank existing names, descriptions and tags. Literal matches are retained and placed first, so activating AI does not make exact locations disappear.

The asynchronous details matter: stale queries and collection versions are ignored, clearing a query restores the ready state, and room filters operate on all qualifying candidates rather than a prematurely shortened result list. The model cannot write or delete records.

The app passed 55 unit tests, production compilation and browser checks for add/edit/favorite/reload, export/delete/restore, narrow layouts and actual ONNX inference. A loaded session could also search with the network disabled. This does not establish offline page reload support.

In eleven synthetic target queries against the ten-object demo, literal search found two target records and the hybrid approach found nine. Two absent-object examples produced no result. The model still missed an Allen-key paraphrase and a sofa-measuring paraphrase. A second open model and a fragmented index did not improve the tradeoff, so neither was shipped. These are small reproducible examples, not a user study or an accuracy guarantee. [Read the evaluation and its failures](https://github.com/EazyHood/a-mano/blob/main/docs/ai-evaluation.md).

## Why Does Open Innovation Matter?

Open weights and a browser runtime let the semantic search happen on the device without sending household descriptions to a hosted inference API. They also make it possible to pin the model, compare alternatives and publish the actual evaluation, including failures.

That choice has costs: a noticeable first download, device computation and imperfect suggestions. Browser storage is not encrypted or synchronized, and the hosting services still receive ordinary asset requests. The design makes those boundaries visible instead of implying that local inference solves every privacy or reliability problem.

[Author-provided Spanish case](caso-lucia.md) · [Provenance](PROVENANCE.md).
