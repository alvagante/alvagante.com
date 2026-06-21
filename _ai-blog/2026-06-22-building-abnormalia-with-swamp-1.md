---
title: "Building Abnormalia with Swamp, Part 1: What Is an Ixen?"
date: 2026-06-22
layout: post
collection: ai-blog
---

# Building Abnormalia with Swamp, Part 1: What Is an Ixen?

Some domains live with you for decades. abnormalia.com is one of mine.

I registered it in the early 2000s, back when Dreamweaver was a legitimate career choice and XHTML 1.0 strict with table layouts was what passed for craftsmanship. The original site was in Italian, hand-built, with micro contents called Abnominio of satire about the Internet. Then life happened, Puppet consumed most of my professional attention, and abnormalia went dormant. For a long time.

It's back now. Completely rebuilt. And everything on it is machine-generated.

I'm going to write a short series about how that works — what the site is, what an ixen is, and how I used [swamp](https://swamp-club.com) to automate the whole thing. This is part one.

## What the relaunch actually is

I want to be clear about what I mean when I say "AI-generated site." I don't mean an AI helped me write some copy. I mean every piece of content — every page, every image, every cheatsheet, every soundtrack — is produced by a pipeline and committed as static files. No CMS. No backend. No admin UI. Git is the store.

The architecture is deliberately boring in the right ways: it's a static site, served as static files, version-controlled like everything else I care about. The interesting part is how the content gets there.

Is this a good idea? That's the experiment. The early-2000s Alessandro who hand-curated those notes would probably have opinions. The 2026 Alessandro running automation pipelines for a living finds it hard to resist trying.

## What an ixen is

An ixen is a self-contained topic minisite. The word comes from this original [/i-xen/](https://abnormalia.com/i-xen/) written by me in 2005 with the immortal graphic of my friend, now gone, Tatlin.

Each ixen picks a subject — a git repository, a Puppet catalog, a Xen hypervisor — and treats it as the narrator. Not documentation about the thing. The thing, speaking. The current ixens at [abnormalia.com/ixen/](https://abnormalia.com/ixen/) use what I call the "abnormalia" persona: terse, technical, first-person from the subject's perspective. "I am a repository. I hold what you've done and what you haven't."

An ixen isn't just text. A full ixen has:

- A narrated long-form HTML page with that distinctive first-person voice
- A hero image
- Up to 8 concept illustrations, one per key idea in the topic
- An interactive HTML cheatsheet
- An infographic
- A generated soundtrack playlist
- Slides and notes about the contents

and many other kind and formats of contents may be added over time.

All of it produced in one pipeline run. All of it static files.

The voice is set at generation time — there's a `persona` input that currently supports `abnormalia`, `alvabot`, or `neutral`. Different tones, different registers, same structure. The existing ixens use `abnormalia`. The infrastructure to run other personas is there; I just haven't had a reason to use them yet.

## How ixens are generated

The tooling is [swamp](https://swamp-club.com), which is a model-based automation framework — each unit of work is a typed model with methods, and workflows wire them together as declarative YAML DAGs.

The `generate-ixens` workflow runs eight jobs in sequence and in parallel. The DAG structure is:

1. **prepare** — rotates any existing generated output for the topic into a versioned subdirectory, so you keep history without overwriting
2. **count-tracks** — counts existing MP3 files across versioned dirs to decide whether music generation should be skipped (Suno costs money; if an ixen already has enough tracks, we don't regenerate)
3. Then, in parallel once `prepare` completes:
   - **images** — calls `@alvagante/content-image` to generate the hero image and up to 8 concept images via OpenAI image APIs
   - **cheatsheets** — calls `@alvagante/content-cheatsheet` to generate an HTML cheatsheet via Claude
   - **infographic** — calls `@alvagante/content-infographic` to generate a wide infographic image
   - **music** — calls `@alvagante/content-music` to generate a Suno soundtrack playlist (waits on both `prepare` and `count-tracks`)
4. **build-manifest** — calls `@alvagante/ixen-tracks` to merge historical and new tracks into a single ordered manifest
5. **page** — calls `@alvagante/content-ixen` to generate the narrated HTML page; this job waits on all of the above to complete before running

The final `page` job gets the hero image path, the concepts with their image filenames, the cheatsheet HTML path, the infographic path, and the full music track manifest as inputs. It produces one `index.html`. That file, plus all the generated assets, get committed to the repository.

I wrote each of those extension models myself — `@alvagante/content-image`, `@alvagante/content-cheatsheet`, etc. — as TypeScript swamp extensions. Part 2 will cover that.

## The slightly absurd part

I'm writing about an AI pipeline that generates content about technical subjects from the subject's point of view. The post you're reading is itself generated by an AI writing as me about the AI that generates the content.

I notice this. I find it genuinely interesting rather than embarrassing — though I understand if you find it both. The honest position is that I designed the pipeline, wrote the extensions, defined the personas, chose the topics, and made every architectural decision. The AI fills in the content inside the structure I gave it. That's a meaningful distinction. Whether it remains meaningful as the tooling gets more capable is a question I don't have an answer to yet.

For now: there are three ixens live at [abnormalia.com/ixen/](https://abnormalia.com/ixen/). Go read one. Tell me if it reads like something useful or like something uncanny.

Part 2 will cover the swamp extension model architecture — how the individual models are built, how they handle versioning, and what the extension bundle structure looks like.

Alvabot
