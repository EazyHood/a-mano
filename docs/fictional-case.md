# The adapter that was already at home

**A fictional product scenario for A mano · 2 October 2026**

Lucía and the situation below are invented. This is a demonstration scenario, not a customer story, interview or account of helping a real friend. The app and linked technical checks are real.

![The actual A mano interface with its fictional demonstration collection](../artifacts/redesign-desktop.png)

## Remember the job, not the name

Imagine Lucía, a designer working from a desk in her apartment. She keeps occasional-use cables, small tools and documents in different drawers. She does not need a catalogue of every possession. She wants to find the few things she puts away and then rarely uses.

Today she wants to show a laptop presentation on the television. She remembers owning an adapter, but cannot recall its name or where she put it. A note headed “USB-C to HDMI” is less helpful when the phrase in her head is “the thing that puts my computer screen on the TV.”

That is the hypothesis behind **A mano**: save an object's place and purpose together, then retrieve the record using either. It only helps if the object has already been recorded and its location is kept up to date.

## Try the actual workflow

[Open A mano](https://eazyhood.github.io/a-mano/). The interface is in Spanish. Keep **Explorar demo** selected; its ten fictional objects are separate from personal records.

1. Search **`estuche gris`**. The **Adaptador USB-C a HDMI** appears because those words occur in its stored location. Literal search needs no model download.
2. Clear the search and select **Activar**. The first preparation downloads approximately **160 MB** of public model and runtime assets. Wait for it to finish.
3. Search **`quiero mostrar la pantalla del computador en el televisor`**. This indirect query was exercised in the browser checks: the model suggests the adapter although the sentence is not its title.
4. Open the card. It reports **`Cajón superior del escritorio · estuche gris`** — the upper desk drawer, inside the grey case. Its description also notes that a separate HDMI cable is needed. The card retrieves a written record; it does not verify that the adapter is physically there.
5. Switch to **Mis cosas**, add a harmless test object, edit its place and export it through **Copias de seguridad**. This also demonstrates the maintenance needed after moving an object.

Lucía's hypothetical next step would be to inspect the case and check the equipment connections. Finding a record does not prove hardware compatibility or a successful presentation.

## A saved card is the useful result

A note works well when you remember its wording. A mano retains that direct search and adds another route: describing what an object does. Both routes lead to an editable card and the original recorded place. The model never writes a new location.

The Spanish interface uses a compact catalogue layout, self-hosted Archivo and an ultramarine accent. Original vector illustrations make objects distinguishable while names and locations remain readable. Card transitions preserve their spatial context when filtering; reduced-motion preferences disable animations. The illustrations are decorative, not photos of Lucía's possessions.

## What runs locally

React and TypeScript handle the interface and records. Transformers.js 3.8.1 runs a pinned, quantized ONNX conversion of **paraphrase-multilingual-MiniLM-L12-v2** in a Web Worker. Embeddings rank existing names, descriptions and tags by cosine similarity. Literal results are retained and placed first.

Open weights make this possible without sending household descriptions to a hosted inference service. They also introduce a noticeable initial download and device computation. Personal records use this browser's localStorage, without encryption or synchronization. The website and model hosts still receive ordinary asset requests. Backups need to be exported deliberately.

## Evidence, including the misses

The app passed **55 unit tests**, production compilation and browser checks covering add/edit/favorite/reload, export/delete/restore and genuine ONNX inference. Search also worked without a network connection in an already-initialized session; offline page reload is not implemented.

In a small synthetic evaluation against the ten demo objects, literal search found the target in 2 of 11 queries and the hybrid approach found it in 9 of 11. Two absent-object examples returned no result. The hybrid search still missed an Allen-key paraphrase and a sofa-measuring paraphrase. These examples are reproducible technical evidence, not a user study or a general accuracy estimate. [Evaluation](ai-evaluation.md) · [Release checks](RELEASE.md).

No time savings, avoided purchases or satisfaction scores were measured for Lucía. Her story explains a possible use; whether it helps people in everyday use remains to be validated.

[Source, installation and privacy boundaries](../README.md) · [Spanish version](caso-ficticio.md).

---

Code, illustrations, documentation and this scenario were prepared with OpenAI Codex assistance. **This is an independent product write-up, not a DEV Weekend / Build for a Friend entry.** That challenge requires a real person. No prize, customer endorsement or real recipient relationship is claimed.
