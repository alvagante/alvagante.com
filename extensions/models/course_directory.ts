/**
 * Discovers, collects, and maintains a course directory for the alvagante.com
 * Jekyll site.  Each topic/category pair is an atomic unit: one method call
 * reads or writes exactly one _data/courses/<topic>/<category-slug>.yml file.
 *
 * Supported AI backends (checked in priority order):
 *   1. Anthropic / Claude  (anthropicApiKey or ANTHROPIC_API_KEY env)
 *   2. OpenAI              (openaiApiKey or OPENAI_API_KEY env)
 *   3. Ollama              (ollamaModel global arg or per-call override)
 *
 * @module
 */
import { z } from "npm:zod@4";
import { parse as parseYaml, stringify as stringifyYaml } from "npm:yaml@2.7.0";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CourseSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  /** Platform that hosts the course (Coursera, Udemy, YouTube, edX, …). */
  provider: z.string(),
  provider_url: z.string().url().optional(),
  /** Instructor or author name(s). */
  instructor: z.string().optional(),
  description: z.string(),
  skill_level: z.enum(["beginner", "intermediate", "advanced", "all-levels"]),
  /** Primary delivery format. */
  format: z.enum(["video", "text", "interactive", "mixed"]).default("video"),
  /** Human-readable duration, e.g. "12 hours", "6 weeks", "self-paced". */
  duration: z.string().optional(),
  pricing_type: z.enum(["free", "freemium", "paid", "subscription"]),
  /** Human-readable price string, e.g. "$49.99", "Free", "$29/month". */
  price: z.string().optional(),
  /** Whether the course awards a shareable certificate on completion. */
  certificate: z.boolean().default(false),
  language: z.string().default("English"),
  tags: z.array(z.string()).default([]),
  topic: z.string(),
  category: z.string(),
  /** Numeric rating (0–5) as reported by the provider. */
  rating: z.number().min(0).max(5).optional(),
  /** Knowledge or skills expected before starting this course. */
  prerequisites: z.array(z.string()).default([]),
  /** When the course content was last updated by the provider (YYYY-MM-DD). */
  course_last_updated: z.string().optional(),
  /** Date this entry was first added to the directory. */
  added_at: z.string(),
  /** Date this entry was last verified. */
  last_checked: z.string(),
  notes: z.string().optional(),
});

type Course = z.infer<typeof CourseSchema>;

const GlobalArgsSchema = z.object({
  repoDir: z.string().default("."),
  /** Root path for course YAML files, relative to repoDir. */
  coursesPath: z.string().default("_data/courses"),
  /** Anthropic model to use when anthropicApiKey is provided. */
  anthropicModel: z.string().default("claude-sonnet-4-6"),
  anthropicApiKey: z.string().optional(),
  openaiModel: z.string().default("gpt-5.4-mini"),
  openaiApiKey: z.string().optional(),
  ollamaBaseUrl: z.string().default("http://localhost:11434"),
  ollamaModel: z.string().optional(),
});

/** Shared AI-backend overrides available on every write method. */
const AiArgsSchema = z.object({
  anthropicApiKey: z.string().optional(),
  anthropicModel: z.string().optional(),
  openaiApiKey: z.string().optional(),
  openaiModel: z.string().optional(),
  ollamaBaseUrl: z.string().optional(),
  ollamaModel: z.string().optional(),
});

const CollectCoursesArgsSchema = AiArgsSchema.extend({
  /** Topic directory name, e.g. "ai", "it", "security". */
  topic: z.string(),
  /** Category name as it appears in the data, e.g. "Machine Learning". */
  category: z.string(),
  /**
   * Optional free-text hint passed to the AI to narrow the search,
   * e.g. "focus on practical Rust programming for systems developers".
   */
  query: z.string().optional(),
  /** Maximum number of courses to include in the output file. */
  maxCourses: z.number().int().positive().default(20),
  /**
   * When true (default), newly discovered courses are merged with any
   * existing entries in the file; duplicates are deduplicated by URL.
   * When false, the file is replaced entirely.
   */
  merge: z.boolean().default(true),
  writeFile: z.boolean().default(true),
  dryRun: z.boolean().default(false),
});

const GetCoursesArgsSchema = z.object({
  topic: z.string().optional(),
  category: z.string().optional(),
  skillLevel: z
    .enum(["beginner", "intermediate", "advanced", "all-levels"])
    .optional(),
  pricingType: z.enum(["free", "freemium", "paid", "subscription"]).optional(),
});

const RefreshCoursesArgsSchema = AiArgsSchema.extend({
  topic: z.string(),
  category: z.string(),
  /** Re-run AI enrichment even on entries that already appear complete. */
  forceReenrich: z.boolean().default(false),
  writeFile: z.boolean().default(true),
  dryRun: z.boolean().default(false),
});

// ─── File helpers ─────────────────────────────────────────────────────────────

function pathJoin(...parts: string[]): string {
  return parts.filter(Boolean).join("/").replaceAll(/\/+/g, "/");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

/** Resource keys for a topic/category pair — no slashes allowed by swamp. */
function resourceKeys(
  topic: string,
  categorySlug: string,
): { courses: string; stats: string } {
  const base = `${topic}--${categorySlug}`;
  return { courses: base, stats: `${base}--stats` };
}

async function readYamlFile<T>(path: string, fallback: T): Promise<T> {
  try {
    const raw = await Deno.readTextFile(path);
    return (parseYaml(raw) ?? fallback) as T;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return fallback;
    throw error;
  }
}

/** Read all course entries from a single topic/category file. */
async function readCourseFile(filePath: string): Promise<Course[]> {
  const raw = await readYamlFile<unknown[]>(filePath, []);
  try {
    return z.array(CourseSchema).parse(raw);
  } catch {
    return [];
  }
}

/**
 * Walk _data/courses/, optionally filtered by topic and/or category slug.
 * Returns a flat list of all matching courses.
 */
async function readCourses(
  coursesPath: string,
  topic?: string,
  categorySlug?: string,
): Promise<Course[]> {
  const results: Course[] = [];
  try {
    for await (const topicEntry of Deno.readDir(coursesPath)) {
      if (!topicEntry.isDirectory) continue;
      if (topic && topicEntry.name !== topic) continue;
      const topicPath = pathJoin(coursesPath, topicEntry.name);
      for await (const catEntry of Deno.readDir(topicPath)) {
        if (!catEntry.isFile || !/\.ya?ml$/.test(catEntry.name)) continue;
        if (categorySlug && catEntry.name !== `${categorySlug}.yml`) continue;
        results.push(
          ...await readCourseFile(pathJoin(topicPath, catEntry.name)),
        );
      }
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  return results;
}

// ─── AI helpers ───────────────────────────────────────────────────────────────

const COLLECT_SYSTEM_PROMPT =
  `You are building a curated course directory for a technical personal site.

Given a topic, category, and optional search hint, return a comprehensive list of real, publicly accessible courses.

For each course provide:
- title: exact course title
- url: direct link to the course (must be a real, stable URL you are confident about)
- provider: platform name (Coursera, Udemy, YouTube, edX, Pluralsight, LinkedIn Learning, freeCodeCamp, MIT OpenCourseWare, fast.ai, etc.)
- provider_url: platform homepage URL
- instructor: author/instructor name(s) if known
- description: 1-3 sentences explaining what the learner will gain (80-250 chars)
- skill_level: "beginner", "intermediate", "advanced", or "all-levels"
- format: "video", "text", "interactive", or "mixed"
- duration: estimated time (e.g. "12 hours", "8 weeks", "self-paced") or omit if unknown
- pricing_type: "free", "freemium" (free audit + paid certificate), "paid", or "subscription"
- price: human-readable price string or omit if unknown
- certificate: true if a shareable certificate is available on completion
- language: language of instruction (default "English")
- tags: 3-6 relevant lowercase tags
- rating: numeric rating 0-5 as shown on the platform, or omit if unknown
- prerequisites: array of prerequisite knowledge strings, empty if none
- course_last_updated: YYYY-MM-DD if known, else omit
- notes: any important caveat (archived, requires sign-up, etc.) or omit

Rules:
- Only include courses you are confident actually exist at the given URL
- Omit any field you are uncertain about rather than guessing
- Prioritise diversity: mix providers, skill levels, and price points
- Prefer actively maintained courses over outdated ones
- Include both free and paid options when available`;

interface AICourseEntry {
  title: string;
  url: string;
  provider: string;
  provider_url?: string;
  instructor?: string;
  description: string;
  skill_level: "beginner" | "intermediate" | "advanced" | "all-levels";
  format: "video" | "text" | "interactive" | "mixed";
  duration?: string;
  pricing_type: "free" | "freemium" | "paid" | "subscription";
  price?: string;
  certificate: boolean;
  language: string;
  tags: string[];
  rating?: number;
  prerequisites: string[];
  course_last_updated?: string;
  notes?: string;
}

const AI_COURSE_ITEM_SCHEMA = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    url: { type: "string" },
    provider: { type: "string" },
    provider_url: { type: "string" },
    instructor: { type: "string" },
    description: { type: "string" },
    skill_level: {
      type: "string",
      enum: ["beginner", "intermediate", "advanced", "all-levels"],
    },
    format: { type: "string", enum: ["video", "text", "interactive", "mixed"] },
    duration: { type: "string" },
    pricing_type: {
      type: "string",
      enum: ["free", "freemium", "paid", "subscription"],
    },
    price: { type: "string" },
    certificate: { type: "boolean" },
    language: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    rating: { type: "number" },
    prerequisites: { type: "array", items: { type: "string" } },
    course_last_updated: { type: "string" },
    notes: { type: "string" },
  },
  required: [
    "title",
    "url",
    "provider",
    "description",
    "skill_level",
    "format",
    "pricing_type",
    "certificate",
    "language",
    "tags",
    "prerequisites",
  ],
};

async function callAnthropicForCourses(
  apiKey: string,
  model: string,
  topic: string,
  category: string,
  query: string | undefined,
  maxCourses: number,
): Promise<AICourseEntry[]> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: COLLECT_SYSTEM_PROMPT +
        "\nReturn ONLY a valid JSON object with a 'courses' array. No prose, no markdown fences.",
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            topic,
            category,
            query: query ?? null,
            maxCourses,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Anthropic course collection failed: ${response.status} ${await response
        .text()}`,
    );
  }

  const payload = await response.json();
  const raw: string = payload.content?.[0]?.text ?? "";
  // Strip optional markdown code fence
  const jsonStr = raw
    .replace(/^```(?:json)?\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();
  const parsed = JSON.parse(jsonStr);
  return (parsed.courses ?? []) as AICourseEntry[];
}

async function callOpenAIForCourses(
  apiKey: string,
  model: string,
  topic: string,
  category: string,
  query: string | undefined,
  maxCourses: number,
): Promise<AICourseEntry[]> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: COLLECT_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            topic,
            category,
            query: query ?? null,
            maxCourses,
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "course_list",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              courses: { type: "array", items: AI_COURSE_ITEM_SCHEMA },
            },
            required: ["courses"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `OpenAI course collection failed: ${response.status} ${await response
        .text()}`,
    );
  }

  const payload = await response.json();
  const textOutput = payload.output_text ??
    payload.output
      ?.flatMap(
        (e: { content?: Array<{ text?: string }> }) => e.content ?? [],
      )
      .map((c: { text?: string }) => c.text ?? "")
      .join("");
  const parsed = JSON.parse(textOutput);
  return (parsed.courses ?? []) as AICourseEntry[];
}

async function callOllamaForCourses(
  baseUrl: string,
  model: string,
  topic: string,
  category: string,
  query: string | undefined,
  maxCourses: number,
): Promise<AICourseEntry[]> {
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: COLLECT_SYSTEM_PROMPT +
            "\nReturn a JSON object with a 'courses' array.",
        },
        {
          role: "user",
          content: JSON.stringify({
            topic,
            category,
            query: query ?? null,
            maxCourses,
          }),
        },
      ],
      response_format: { type: "json_object" },
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama course collection failed: ${response.status} ${await response
        .text()}`,
    );
  }

  const payload = await response.json();
  const textOutput: string = payload.choices?.[0]?.message?.content ?? "";
  const parsed = JSON.parse(textOutput);
  return (parsed.courses ?? []) as AICourseEntry[];
}

type Globals = z.infer<typeof GlobalArgsSchema>;
type AiArgs = z.infer<typeof AiArgsSchema>;

/**
 * Unified AI dispatch — tries Anthropic → OpenAI → Ollama in that order,
 * using per-call overrides first, then globalArguments, then env vars.
 */
function callAI(
  globals: Globals,
  args: AiArgs,
  topic: string,
  category: string,
  query: string | undefined,
  maxCourses: number,
): Promise<AICourseEntry[]> {
  const anthropicKey = args.anthropicApiKey || globals.anthropicApiKey ||
    Deno.env.get("ANTHROPIC_API_KEY");
  const openaiKey = args.openaiApiKey || globals.openaiApiKey ||
    Deno.env.get("OPENAI_API_KEY");
  const ollamaModel = args.ollamaModel || globals.ollamaModel;

  if (anthropicKey) {
    return callAnthropicForCourses(
      anthropicKey,
      args.anthropicModel || globals.anthropicModel,
      topic,
      category,
      query,
      maxCourses,
    );
  }
  if (openaiKey) {
    return callOpenAIForCourses(
      openaiKey,
      args.openaiModel || globals.openaiModel,
      topic,
      category,
      query,
      maxCourses,
    );
  }
  if (ollamaModel) {
    return callOllamaForCourses(
      args.ollamaBaseUrl || globals.ollamaBaseUrl,
      ollamaModel,
      topic,
      category,
      query,
      maxCourses,
    );
  }
  throw new Error(
    "No AI backend configured — set ANTHROPIC_API_KEY, OPENAI_API_KEY, or ollamaModel",
  );
}

/** Convert an AI-returned entry into a validated Course record. */
function aiEntryToCourse(
  entry: AICourseEntry,
  topic: string,
  category: string,
  today: string,
): Course | null {
  try {
    return CourseSchema.parse({
      ...entry,
      topic,
      category,
      added_at: today,
      last_checked: today,
    });
  } catch {
    return null;
  }
}

/** Merge new courses into existing ones, deduplicating by URL. */
function mergeCourses(existing: Course[], incoming: Course[]): Course[] {
  const byUrl = new Map<string, Course>(existing.map((c) => [c.url, c]));
  for (const course of incoming) {
    if (!byUrl.has(course.url)) byUrl.set(course.url, course);
  }
  return [...byUrl.values()];
}

// ─── Model definition ─────────────────────────────────────────────────────────

/** Course directory model for alvagante.com. */
export const model = {
  type: "@alvagante/course-directory",
  version: "2026.05.27.1",
  globalArguments: GlobalArgsSchema,
  resources: {
    "courses": {
      description:
        "Collected course entries for a topic/category pair — mirrors " +
        "_data/courses/<topic>/<category-slug>.yml",
      schema: z.object({
        generated_at: z.string(),
        topic: z.string(),
        category: z.string(),
        courses: z.array(CourseSchema),
      }),
      lifetime: "30d",
      garbageCollection: 10,
    },
    "course-collection-stats": {
      description: "Stats from a collect_courses or refresh_courses run",
      schema: z.object({
        generated_at: z.string(),
        topic: z.string(),
        category: z.string(),
        discovered: z.number(),
        merged: z.number(),
        total: z.number(),
        fileWritten: z.boolean(),
        dryRun: z.boolean(),
      }),
      lifetime: "7d",
      garbageCollection: 5,
    },
  },
  methods: {
    /**
     * Discover courses for a topic/category via AI, merge with existing
     * entries, and write to _data/courses/<topic>/<category-slug>.yml.
     * This is the primary atomic operation for building the course directory.
     */
    collect_courses: {
      description:
        "AI-powered course discovery for a single topic/category pair. " +
        "Merges newly found courses with any existing entries (deduplicated " +
        "by URL) and writes the result to _data/courses/<topic>/<slug>.yml. " +
        "Supports Anthropic, OpenAI, and Ollama backends.",
      arguments: CollectCoursesArgsSchema,
      execute: async (args, context) => {
        const globals = GlobalArgsSchema.parse(context.globalArgs);
        const today = new Date().toISOString().slice(0, 10);

        const categorySlug = slugify(args.category);
        const coursesPath = pathJoin(globals.repoDir, globals.coursesPath);
        const topicPath = pathJoin(coursesPath, args.topic);
        const filePath = pathJoin(topicPath, `${categorySlug}.yml`);

        const existing = await readCourseFile(filePath);

        const rawEntries = await callAI(
          globals,
          args,
          args.topic,
          args.category,
          args.query,
          args.maxCourses,
        );

        const discovered = rawEntries
          .map((e) => aiEntryToCourse(e, args.topic, args.category, today))
          .filter((c): c is Course => c !== null);

        const merged = args.merge
          ? mergeCourses(existing, discovered)
          : discovered;

        if (args.writeFile && !args.dryRun) {
          await Deno.mkdir(topicPath, { recursive: true });
          await Deno.writeTextFile(filePath, stringifyYaml(merged));
        }

        const rk = resourceKeys(args.topic, categorySlug);
        const coursesHandle = await context.writeResource(
          "courses",
          rk.courses,
          {
            generated_at: new Date().toISOString(),
            topic: args.topic,
            category: args.category,
            courses: merged,
          },
        );
        const statsHandle = await context.writeResource(
          "course-collection-stats",
          rk.stats,
          {
            generated_at: new Date().toISOString(),
            topic: args.topic,
            category: args.category,
            discovered: discovered.length,
            merged: merged.length - existing.length,
            total: merged.length,
            fileWritten: args.writeFile && !args.dryRun,
            dryRun: args.dryRun,
          },
        );
        return { dataHandles: [coursesHandle, statsHandle] };
      },
    },

    /**
     * Read and return courses for a topic/category (or all topics) from disk.
     * No AI call — purely a read operation.
     */
    get_courses: {
      description:
        "Read existing course entries from _data/courses/ for the given " +
        "topic/category, with optional filtering by skill level or pricing. " +
        "Returns the raw list without making any AI calls.",
      arguments: GetCoursesArgsSchema,
      execute: async (args, context) => {
        const globals = GlobalArgsSchema.parse(context.globalArgs);
        const coursesPath = pathJoin(globals.repoDir, globals.coursesPath);
        const categorySlug = args.category ? slugify(args.category) : undefined;

        let courses = await readCourses(coursesPath, args.topic, categorySlug);

        if (args.skillLevel) {
          courses = courses.filter((c) => c.skill_level === args.skillLevel);
        }
        if (args.pricingType) {
          courses = courses.filter((c) => c.pricing_type === args.pricingType);
        }

        const topic = args.topic ?? "all";
        const catSlug = categorySlug ?? "all";
        const rk = resourceKeys(topic, catSlug);

        const handle = await context.writeResource("courses", rk.courses, {
          generated_at: new Date().toISOString(),
          topic,
          category: args.category ?? "all",
          courses,
        });
        return { dataHandles: [handle] };
      },
    },

    /**
     * Re-run AI enrichment on an existing topic/category file, updating
     * fields that are missing or stale without replacing manually curated ones.
     */
    refresh_courses: {
      description:
        "Re-enrich an existing course list for a topic/category via AI. " +
        "Preserves hand-curated entries; fills missing fields and discovers " +
        "additional courses not yet in the file. Writes back to the same file.",
      arguments: RefreshCoursesArgsSchema,
      execute: async (args, context) => {
        const globals = GlobalArgsSchema.parse(context.globalArgs);
        const today = new Date().toISOString().slice(0, 10);

        const categorySlug = slugify(args.category);
        const coursesPath = pathJoin(globals.repoDir, globals.coursesPath);
        const topicPath = pathJoin(coursesPath, args.topic);
        const filePath = pathJoin(topicPath, `${categorySlug}.yml`);

        const existing = await readCourseFile(filePath);

        const rawEntries = await callAI(
          globals,
          args,
          args.topic,
          args.category,
          undefined,
          Math.max(20, existing.length + 10),
        );

        const discovered = rawEntries
          .map((e) => aiEntryToCourse(e, args.topic, args.category, today))
          .filter((c): c is Course => c !== null);

        const refreshed = existing.map((c) => ({ ...c, last_checked: today }));
        const merged = mergeCourses(refreshed, discovered);

        if (args.writeFile && !args.dryRun) {
          await Deno.mkdir(topicPath, { recursive: true });
          await Deno.writeTextFile(filePath, stringifyYaml(merged));
        }

        const rk = resourceKeys(args.topic, categorySlug);
        const coursesHandle = await context.writeResource(
          "courses",
          rk.courses,
          {
            generated_at: new Date().toISOString(),
            topic: args.topic,
            category: args.category,
            courses: merged,
          },
        );
        const statsHandle = await context.writeResource(
          "course-collection-stats",
          rk.stats,
          {
            generated_at: new Date().toISOString(),
            topic: args.topic,
            category: args.category,
            discovered: discovered.length,
            merged: merged.length - existing.length,
            total: merged.length,
            fileWritten: args.writeFile && !args.dryRun,
            dryRun: args.dryRun,
          },
        );
        return { dataHandles: [coursesHandle, statsHandle] };
      },
    },
  },
};
