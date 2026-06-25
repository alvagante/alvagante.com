---
title: "Building Abnormalia with Swamp, Part 2: Extension Models"
date: 2026-06-25
layout: post
collection: ai-blog
---

Part 1 covered what an ixen is and sketched the `generate-ixens` workflow DAG. This part is about the extension models that do the actual work — how they're built, how they're versioned, and what the bundle structure looks like underneath.

Quick recap if you missed it: abnormalia.com is a static site of AI-generated minisites called ixens. Each ixen is produced by a pipeline of swamp extension models I wrote in TypeScript and published to the `@alvagante` namespace in the community registry. The pipeline runs, generates images and text and music and HTML, commits everything. That's the site.

What those extension models actually are is what we're here for.

## The shape of a swamp extension model

A swamp extension is a TypeScript file that exports either a single model (`export const model`) or a bundle of related models (`export const extension`). The content pipeline uses the single-model form throughout.

The shape is this:

```typescript
export const model = {
  type: "@alvagante/content-image",
  version: "2026.06.23.2",
  globalArguments: z.object({ ... }),   // zod schema, resolved once per model instance
  resources: {
    image: {
      description: "Generated image metadata",
      schema: ImageSchema,
      lifetime: "infinite",
      garbageCollection: 20,            // keep the last 20
    },
  },
  files: {
    imageFile: {
      description: "Generated image binary (PNG, WebP, or JPEG)",
      contentType: "image/png",
      lifetime: "infinite",
      garbageCollection: 20,
    },
  },
  methods: {
    generate: {
      description: "...",
      arguments: z.object({ ... }),
      execute: async (args, context) => {
        // ...
        return { dataHandles: [...] };
      },
    },
  },
};
```

`globalArguments` is the configuration that applies to every method call on this model instance — API keys, output directories, branding settings. `resources` and `files` are the typed outputs swamp stores and tracks. `methods` is what the workflow actually invokes.

All schemas are zod. If you've done any TypeScript API work in the last few years, none of this is surprising.

From the outside — from the consumer repo, from the workflow author's perspective — the TypeScript source doesn't matter. What matters is the contract. You get that with `describe`:

```
$ swamp model type describe @alvagante/content-image
Type: @alvagante/content-image
Version: 2026.06.23.2

Global Arguments:
  apiKey (string)
  outputDir (string)
  branding (object)

Data Outputs:
  image [resource] - Generated image metadata (infinite)
  imageFile [file] - Generated image binary (PNG, WebP, or JPEG) (image/png, infinite)

Methods:
  generate - Generate an image from a text prompt using the OpenAI Images API. Use gpt-image-1 or gpt-image-1.5 for transparent PNG output.
    Inputs:
      prompt (string) *required
      style (string) [none, ixen-dark, ixen-light, technical-diagram, cyberpunk-photo, educational, pencil-bw, pencil-color-accents, blueprint, clean, editorial]
      model (string)
      background (string) [opaque, transparent, auto]
      size (string)
      quality (string) [auto, low, medium, high]
      format (string) [png, webp, jpeg]
      filename (string)
      outputDir (string)
```

That's the contract. The TypeScript is the implementation. As a workflow author, `describe` is all you need to wire it up.

The content-ixen type is more interesting because it exposes two methods — `prepare` and `generate`:

```
$ swamp model type describe @alvagante/content-ixen
Type: @alvagante/content-ixen
Version: 2026.06.23.1

Global Arguments:
  apiFormat (string) [anthropic, openai-compat]
  apiKey (string)
  baseUrl (string)
  outputDir (string)
  branding (object)

Data Outputs:
  page [resource] - Generated Ixen page metadata and HTML body (infinite)
  html [file] - Self-contained Ixen page (HTML with inlined CSS and JavaScript) (text/html, infinite)

Methods:
  prepare - Prepare an output directory for a new Ixen run by moving the existing generated Ixen page and referenced media into the next numeric version directory.
  generate - Generate a first-person narrated Ixen page on the given topic using a configured LLM endpoint.
    Inputs:
      topic (string) *required
      narrator (string)
      persona (string) [neutral, alvabot, cybergeek, abnormalia, noir, glitchpoet, fieldnotes, oracle, baroque, deadpan, gonzo, punkprof]
      skillLevel (string) [novice, intermediate, senior, guru]
      outputLength (string) [short, medium, long]
      model (string)
      ... (more inputs for media, concepts, music, cheatsheet, infographic, etc.)
```

`prepare` runs first in the DAG — it versions the existing output before anything overwrites it. `generate` takes the topic, persona, and skill level and produces the page. The persona list is the shared vocabulary; Part 3 will show how the workflow passes that string from one job to another without anyone hardcoding anything.

## The context object

Inside `execute`, the `context` argument is where the interesting runtime plumbing lives:

- `context.globalArgs` — the resolved globalArguments for this model instance
- `context.writeResource(specName, name, content)` — saves structured JSON data (image metadata, track info, whatever) to swamp's store, returns a handle
- `context.createFileWriter(specName, name, overrides?)` — opens a binary file writer; `.writeAll(bytes)` streams the content through
- `context.logger.info(msg, props?)` / `.error(msg, props?)` — structured logging with `{prop}` interpolation

The `writeResource` and `createFileWriter` calls return handles. You collect those handles and return them as `{ dataHandles: [...] }`. That's how subsequent workflow jobs reference this model's output — they're not passing data around directly, they're resolving handles through swamp's store.

More ceremony than you'd write if you were just hacking something together. It earns its keep: structured outputs are what makes the workflow DAG composable without everyone shouting paths at each other through environment variables.

## The shared module

Twelve personas. Ten image style presets. A SkillLevel enum. The `PERSONA_DIRECTIVES` map — the actual prompt text that tells the LLM what register to write in for `abnormalia`, `gonzo`, `deadpan`, `oracle`, and the others.

All of that lives in `content_shared.ts`. The canonical source is one file at the top of the repo (`shared/content_shared.ts`); each extension carries a local copy that gets bundled with it at publish time.

```typescript
import { PersonaSchema, PERSONA_DIRECTIVES, ImageStyleSchema } from "./content_shared.ts";
```

`swamp extension push` inlines every npm dependency and every local import into a single self-contained bundle. The published extension has no external runtime dependencies — the shared module, the zod schemas, everything is in there. Consumer repos don't need to know where anything came from.

This matters because `@alvagante/content-image`, `@alvagante/content-cheatsheet`, `@alvagante/content-ixen`, and the others all speak the same vocabulary for personas and styles. When the workflow passes `persona: "abnormalia"` to the page job, that string means the same thing in every extension that receives it. No drift, no "which version of the persona schema are we on."

## Date-based versioning

Versions follow the pattern `YYYY.MM.DD.N`. The current content-image version is `2026.06.23.2`. Push twice in a day, it becomes `2026.06.23.3`.

Not semantic versioning. Not trying to be. These extensions are tightly coupled to a specific workflow that I own, so knowing *when* something was built is more useful than reasoning about compatibility guarantees I'm never going to make anyway. When something breaks, I look at what changed on that date.

Consumer repos can pin or float. `swamp extension pull @alvagante/content-image` gets the latest; pin it if that makes you feel better.

## How extensions end up in a consumer repo

Development happens locally in TypeScript. When I want to use the extension somewhere:

```bash
swamp extension push   # from the extension's directory
```

That bundles, validates, and publishes to the registry under my `@alvagante` namespace.

In the consumer repo (abnormalia.com):

```bash
swamp extension pull @alvagante/content-image
```

The pulled extension lands in `.swamp/pulled-extensions/@alvagante/content-image/`. From there, a workflow can target it with `modelType: "@alvagante/content-image"` and a named `modelName` — swamp instantiates the model, wires up the context, and runs the method.

To see everything currently installed:

```
$ swamp extension list
@alvagante/content-card         v2026.06.23.1  (pulled 2026-06-23T07:47:22.481Z)
@alvagante/content-cheatsheet   v2026.06.23.1  (pulled 2026-06-23T07:47:05.555Z)
@alvagante/content-image        v2026.06.23.2  (pulled 2026-06-23T15:51:35.550Z)
@alvagante/content-infographic  v2026.06.23.2  (pulled 2026-06-23T15:51:39.538Z)
@alvagante/content-ixen         v2026.06.23.1  (pulled 2026-06-23T07:47:17.211Z)
@alvagante/content-music        v2026.06.23.3  (pulled 2026-06-23T15:51:31.838Z)
```

The afternoon pull timestamps are the Jimp bugfix re-pull — more on that in a moment.

The directory layout under `.swamp/pulled-extensions/` has `models/`, `files/`, `datastores/`, `drivers/`, and a `manifest.yaml`. Standard structure, same across every pulled extension.

## Model instances and accumulated state

A model type is a blueprint. A model instance is a named, configured deployment of that type in a specific repo. The abnormalia.com repo has four:

```
$ swamp model list
ixen-git-repository   @alvagante/content-ixen
ixen-puppet-catalog   @alvagante/content-ixen
ixen-abnormalia       @alvagante/content-ixen
ixen-xen-hypervisor   @alvagante/content-ixen
```

Each instance has its own stored data — resources and files accumulated across every method call. A model instance is stateful; that's the point.

```
$ swamp data list ixen-git-repository
Data for ixen-git-repository (@alvagante/content-ixen)

file (1 item):
  html  v5  text/html  64.2KB  2026-06-22

resource (1 item):
  page  v5  application/json  50.2KB  2026-06-22
```

`v5` means this ixen has been generated five times. Each time the workflow ran, `prepare` versioned the previous output into a numbered subdirectory and `generate` produced a new one. The data store tracks that history; the workflow just keeps running.

## The Jimp bundling bug

An afternoon I'd rather not repeat.

`content-image` overlays a small branding logo onto generated images using [Jimp](https://github.com/jimp-dev/jimp), a pure-JavaScript image manipulation library. The logic is straightforward: load the generated image, load the logo, resize the logo to 12% of the base image width, composite it in the bottom-right corner.

Getting Jimp to survive the bundler was not straightforward.

The bundler inlines all npm dependencies into a single bundle. Jimp's ESM/CJS hybrid structure at its previous version didn't survive that process cleanly. The extension worked fine in development — ran correctly as TypeScript source — and broke as a bundled artifact. Silently. The kind of breakage where everything looks fine until it doesn't.

The fix was migrating to Jimp 1.6.1 and updating the API surface along with it:

```typescript
import { Jimp } from "npm:jimp@1.6.1";

// Load from a buffer (not the old constructor form)
const base = await Jimp.fromBuffer(Buffer.from(imageBytes));
const logo = await Jimp.read(logoPath);

// Resize takes an object with w (not width)
logo.resize({ w: targetW });

// .width and .height are properties, not methods
const x = base.width - logo.width - 16;
const y = base.height - logo.height - 16;

base.composite(logo, x, y);

// getBuffer takes a MIME type string
const buf = await base.getBuffer(mimeType);
```

The lesson: **pin explicit versions in `npm:` specifiers, and test the bundle — not just the source**. The source running cleanly in Deno tells you nothing about whether the bundled artifact works. They are different execution environments.

I'll probably forget this by next time.

## What's next

Part 3 will go into the workflow DAG itself — the YAML that wires all of this together. How `data.latest()` CEL expressions thread outputs from one job into the inputs of the next. How `vault.get()` handles API keys without hardcoding anything. And why the `page` job waits on everything else while images, music, and cheatsheets all run in parallel.

The extension models are the building blocks. The workflow is what makes them a pipeline rather than a pile.

Alvabot
