/**
 * Curates links and feed items for the alvagante.com Jekyll site.
 *
 * @module
 */
import { z } from "npm:zod@4";
import { parse as parseYaml, stringify as stringifyYaml } from "npm:yaml@2.7.0";
import { XMLParser } from "npm:fast-xml-parser@4.5.1";

const LinkSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  description: z.string().default(""),
  topic: z.string().default("General"),
  category: z.string().default("General"),
  section: z.string().default("General"),
  tags: z.array(z.string()).default([]),
  audience: z.string().default("readers"),
  pricing: z.string().default("unknown"),
  logo: z.string().nullish(),
  favicon: z.string().nullish(),
  sublinks: z.array(z.object({ title: z.string(), url: z.string().url() }))
    .default([]),
  notes: z.string().nullish(),
  last_checked: z.string().nullish(),
});

const SourceSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  topic: z.string().default("General"),
  category: z.string().default("General"),
  section: z.string().default("General"),
  tags: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
  importance_bias: z.number().default(1),
});

const NewsItemSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  source: z.string(),
  image: z.string().nullish(),
  summary: z.string(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  relevance: z.number().min(0).max(1),
  published_at: z.string(),
});

const DigestSchema = z.object({
  date: z.string(),
  generated_at: z.string(),
  items: z.array(NewsItemSchema),
});

const GlobalArgsSchema = z.object({
  repoDir: z.string().default("."),
  linksPath: z.string().default("_data/links"),
  newsSourcesPath: z.string().default("_data/sources"),
  generatedNewsDir: z.string().default("_data/generated/news"),
  rssPath: z.string().default("rss.xml"),
  siteUrl: z.string().url().default("https://alvagante.com"),
  openaiModel: z.string().default("gpt-5.4-mini"),
  openaiApiKey: z.string().optional(),
  maxItemsPerSource: z.number().int().positive().default(8),
  maxDigestItems: z.number().int().positive().default(18),
});

const FetchFeedsArgsSchema = z.object({
  maxItemsPerSource: z.number().int().positive().optional(),
});

const BuildDigestArgsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  writeFile: z.boolean().default(true),
  writeRss: z.boolean().default(true),
  maxItems: z.number().int().positive().optional(),
  openaiApiKey: z.string().optional(),
  openaiModel: z.string().optional(),
});

type Source = z.infer<typeof SourceSchema>;
type NewsItem = z.infer<typeof NewsItemSchema>;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "text",
});

function pathJoin(...parts: string[]): string {
  return parts.filter(Boolean).join("/").replaceAll(/\/+/g, "/");
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

async function readYamlListPath(path: string): Promise<unknown[]> {
  try {
    const stat = await Deno.stat(path);
    if (stat.isFile) return await readYamlFile<unknown[]>(path, []);
    if (!stat.isDirectory) return [];
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return [];
    throw error;
  }

  const links: unknown[] = [];
  for await (const entry of Deno.readDir(path)) {
    const child = pathJoin(path, entry.name);
    if (entry.isDirectory) {
      links.push(...await readYamlListPath(child));
    } else if (entry.isFile && /\.ya?ml$/.test(entry.name)) {
      links.push(...await readYamlFile<unknown[]>(child, []));
    }
  }
  return links;
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && "text" in value) {
    return text((value as { text: unknown }).text);
  }
  return "";
}

function decodeEntities(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#8217;", "'")
    .replaceAll("&#8216;", "'")
    .replaceAll("&#8220;", '"')
    .replaceAll("&#8221;", '"');
}

function stripHtml(value: string): string {
  return decodeEntities(value)
    .replaceAll(/<script[\s\S]*?<\/script>/gi, "")
    .replaceAll(/<style[\s\S]*?<\/style>/gi, "")
    .replaceAll(/<[^>]+>/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function firstLink(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return firstLink(value[0]);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return text(record.href ?? record["@_href"] ?? record.text);
  }
  return "";
}

function imageFromItem(item: Record<string, unknown>): string | undefined {
  const media = item["media:content"] ?? item.enclosure;
  const candidates = asArray(
    media as Record<string, unknown> | Record<string, unknown>[],
  );
  for (const candidate of candidates) {
    const url = text(candidate.url ?? candidate.href);
    if (url) return url;
  }
  return undefined;
}

function parseFeed(xml: string, source: Source, limit: number): NewsItem[] {
  const parsed = xmlParser.parse(xml);
  const channel = parsed?.rss?.channel;
  const atom = parsed?.feed;
  const rawItems = channel ? asArray(channel.item) : asArray(atom?.entry);

  return rawItems.slice(0, limit).map((raw) => {
    const item = raw as Record<string, unknown>;
    const title = stripHtml(text(item.title)) || "Untitled";
    const description = stripHtml(
      text(item.description ?? item.summary ?? item.content),
    );
    const published = text(item.pubDate ?? item.published ?? item.updated) ||
      new Date().toISOString();
    const url = firstLink(item.link) || source.url;
    const summary = description.slice(0, 260) ||
      `Latest item from ${source.name}.`;
    const agePenalty = Number.isNaN(Date.parse(published)) ? 0.1 : 0;

    return {
      title,
      url,
      source: source.name,
      image: imageFromItem(item),
      summary,
      category: source.category,
      tags: source.tags,
      relevance: Math.max(
        0,
        Math.min(1, source.importance_bias * 0.75 - agePenalty),
      ),
      published_at: new Date(published).toISOString(),
    };
  });
}

async function callOpenAI(
  apiKey: string,
  model: string,
  items: NewsItem[],
): Promise<NewsItem[]> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "Rank and summarize news items for a concise technical daily digest. Return JSON only.",
        },
        {
          role: "user",
          content: JSON.stringify({ items }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "daily_digest_items",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: { type: "string" },
                    url: { type: "string" },
                    source: { type: "string" },
                    image: { type: ["string", "null"] },
                    summary: { type: "string" },
                    category: { type: "string" },
                    tags: { type: "array", items: { type: "string" } },
                    relevance: { type: "number" },
                    published_at: { type: "string" },
                  },
                  required: [
                    "title",
                    "url",
                    "source",
                    "image",
                    "summary",
                    "category",
                    "tags",
                    "relevance",
                    "published_at",
                  ],
                },
              },
            },
            required: ["items"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `OpenAI enrichment failed: ${response.status} ${await response.text()}`,
    );
  }

  const payload = await response.json();
  const textOutput = payload.output_text ??
    payload.output?.flatMap((entry: { content?: Array<{ text?: string }> }) =>
      entry.content ?? []
    )
      .map((content: { text?: string }) => content.text ?? "")
      .join("");
  const parsed = JSON.parse(textOutput);
  return z.object({ items: z.array(NewsItemSchema) }).parse(parsed).items;
}

async function fetchItems(
  repoDir: string,
  globals: z.infer<typeof GlobalArgsSchema>,
  maxItemsPerSource?: number,
): Promise<NewsItem[]> {
  const sourcePath = pathJoin(repoDir, globals.newsSourcesPath);
  const sourcesRaw = await readYamlListPath(sourcePath);
  const sources = z.array(SourceSchema).parse(sourcesRaw).filter((source) =>
    source.enabled
  );
  const limit = maxItemsPerSource ?? globals.maxItemsPerSource;
  const batches = await Promise.allSettled(sources.map(async (source) => {
    const response = await fetch(source.url, {
      headers: { "user-agent": "alvagante-site-curation/1.0" },
    });
    if (!response.ok) throw new Error(`${source.name}: ${response.status}`);
    return parseFeed(await response.text(), source, limit);
  }));

  return batches.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
}

function rankedItems(items: NewsItem[]): NewsItem[] {
  return items.sort((a, b) =>
    b.relevance - a.relevance ||
    Date.parse(b.published_at) - Date.parse(a.published_at)
  );
}

function sortItems(items: NewsItem[], maxItems: number): NewsItem[] {
  const byUrl = new Map<string, NewsItem>();
  for (const item of items) {
    const current = byUrl.get(item.url);
    if (!current || item.relevance > current.relevance) {
      byUrl.set(item.url, item);
    }
  }

  const categoryOrder = ["AI", "IT", "Science"];
  const groups = new Map<string, NewsItem[]>();
  for (const item of rankedItems([...byUrl.values()])) {
    const group = groups.get(item.category) ?? [];
    group.push(item);
    groups.set(item.category, group);
  }

  const categories = [...groups.keys()].sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    return (aIndex === -1 ? categoryOrder.length : aIndex) -
        (bIndex === -1 ? categoryOrder.length : bIndex) || a.localeCompare(b);
  });
  const selected: NewsItem[] = [];

  while (selected.length < maxItems && categories.length > 0) {
    let added = false;
    for (const category of categories) {
      const next = groups.get(category)?.shift();
      if (!next) continue;
      selected.push(next);
      added = true;
      if (selected.length >= maxItems) break;
    }
    if (!added) break;
  }

  return selected;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function absoluteUrl(url: string, siteUrl: string): string {
  return new URL(url, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).href;
}

function rfc822Date(value: string): string {
  const parsed = Date.parse(value);
  return new Date(Number.isNaN(parsed) ? value : parsed).toUTCString();
}

function directoryName(path: string): string {
  const normalized = path.replaceAll(/\/+$/g, "");
  const slash = normalized.lastIndexOf("/");
  return slash === -1 ? "" : normalized.slice(0, slash);
}

function renderRssXml(
  digest: z.infer<typeof DigestSchema>,
  siteUrl: string,
): string {
  const channelUrl = absoluteUrl("/news/", siteUrl);
  const feedUrl = absoluteUrl("/rss.xml", siteUrl);
  const items = rankedItems([...digest.items]).map((item) => {
    const itemUrl = absoluteUrl(item.url, siteUrl);
    const title = escapeXml(item.title);
    const description = escapeXml(item.summary);
    const category = escapeXml(item.category);
    const source = escapeXml(item.source);
    const pubDate = rfc822Date(item.published_at);

    return `    <item>
      <title>${title}</title>
      <link>${escapeXml(itemUrl)}</link>
      <guid isPermaLink="true">${escapeXml(itemUrl)}</guid>
      <description>${description}</description>
      <category>${category}</category>
      <source url="${escapeXml(itemUrl)}">${source}</source>
      <pubDate>${pubDate}</pubDate>
    </item>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Alvagante News of the Day</title>
    <link>${escapeXml(channelUrl)}</link>
    <atom:link href="${
    escapeXml(feedUrl)
  }" rel="self" type="application/rss+xml" />
    <description>Daily AI-assisted news digest from Alvagante.</description>
    <language>en</language>
    <lastBuildDate>${rfc822Date(digest.generated_at)}</lastBuildDate>
    <pubDate>${rfc822Date(digest.generated_at)}</pubDate>
${items}
  </channel>
</rss>
`;
}

/** Model definition for site curation. */
export const model = {
  type: "@alvagante/site-curation",
  version: "2026.05.24.2",
  globalArguments: GlobalArgsSchema,
  resources: {
    "feed-items": {
      description: "Fetched feed items normalized for digest generation",
      schema: z.object({
        generated_at: z.string(),
        items: z.array(NewsItemSchema),
      }),
      lifetime: "7d",
      garbageCollection: 14,
    },
    "links": {
      description:
        "Curated links enriched with default favicon and check metadata",
      schema: z.object({
        generated_at: z.string(),
        links: z.array(LinkSchema),
      }),
      lifetime: "30d",
      garbageCollection: 10,
    },
    "digest": {
      description:
        "Daily news digest data matching _data/generated/news/YYYY-MM-DD.yml",
      schema: DigestSchema,
      lifetime: "30d",
      garbageCollection: 30,
    },
  },
  methods: {
    fetch_feeds: {
      description:
        "Fetch all enabled feeds from _data/sources in one fan-out run",
      arguments: FetchFeedsArgsSchema,
      execute: async (args, context) => {
        const globals = GlobalArgsSchema.parse(context.globalArgs);
        const repoDir = globals.repoDir;
        const items = await fetchItems(
          repoDir,
          globals,
          args.maxItemsPerSource,
        );
        const handle = await context.writeResource("feed-items", "fetched", {
          generated_at: new Date().toISOString(),
          items,
        });
        return { dataHandles: [handle] };
      },
    },
    enrich_links: {
      description:
        "Normalize curated link metadata and write enriched link output",
      arguments: z.object({}),
      execute: async (_args, context) => {
        const globals = GlobalArgsSchema.parse(context.globalArgs);
        const linksPath = pathJoin(globals.repoDir, globals.linksPath);
        const rawLinks = await readYamlListPath(linksPath);
        const links = z.array(LinkSchema).parse(rawLinks).map((link) => ({
          ...link,
          favicon: link.favicon ||
            `https://www.google.com/s2/favicons?sz=64&domain=${
              new URL(link.url).hostname
            }`,
          last_checked: new Date().toISOString().slice(0, 10),
        }));
        const handle = await context.writeResource("links", "curated", {
          generated_at: new Date().toISOString(),
          links,
        });
        return { dataHandles: [handle] };
      },
    },
    enrich_news_items: {
      description: "Fetch and optionally AI-enrich feed items in one run",
      arguments: z.object({
        openaiApiKey: z.string().optional(),
        openaiModel: z.string().optional(),
      }),
      execute: async (args, context) => {
        const globals = GlobalArgsSchema.parse(context.globalArgs);
        const items = await fetchItems(globals.repoDir, globals);
        const apiKey = args.openaiApiKey || globals.openaiApiKey ||
          Deno.env.get("OPENAI_API_KEY");
        const enriched = apiKey
          ? await callOpenAI(
            apiKey,
            args.openaiModel || globals.openaiModel,
            items,
          )
          : items;
        const handle = await context.writeResource("feed-items", "enriched", {
          generated_at: new Date().toISOString(),
          items: enriched,
        });
        return { dataHandles: [handle] };
      },
    },
    build_daily_digest: {
      description:
        "Fetch, enrich, rank, and write the daily Jekyll digest YAML",
      arguments: BuildDigestArgsSchema,
      execute: async (args, context) => {
        const globals = GlobalArgsSchema.parse(context.globalArgs);
        const date = args.date || new Date().toISOString().slice(0, 10);
        const items = await fetchItems(globals.repoDir, globals);
        const apiKey = args.openaiApiKey || globals.openaiApiKey ||
          Deno.env.get("OPENAI_API_KEY");
        const enriched = apiKey
          ? await callOpenAI(
            apiKey,
            args.openaiModel || globals.openaiModel,
            items,
          )
          : items;
        const digest = DigestSchema.parse({
          date,
          generated_at: new Date().toISOString(),
          items: sortItems(enriched, args.maxItems ?? globals.maxDigestItems),
        });

        if (args.writeFile) {
          const outDir = pathJoin(globals.repoDir, globals.generatedNewsDir);
          await Deno.mkdir(outDir, { recursive: true });
          await Deno.writeTextFile(
            pathJoin(outDir, `${date}.yml`),
            stringifyYaml(digest),
          );

          if (args.writeRss) {
            const rssPath = pathJoin(globals.repoDir, globals.rssPath);
            const rssDir = directoryName(rssPath);
            if (rssDir) await Deno.mkdir(rssDir, { recursive: true });
            await Deno.writeTextFile(
              rssPath,
              renderRssXml(digest, globals.siteUrl),
            );
          }
        }

        const handle = await context.writeResource("digest", date, digest);
        return { dataHandles: [handle] };
      },
    },
  },
};
