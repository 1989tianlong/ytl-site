import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

const projects = defineCollection({
  loader: file('src/content/projects.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    summary: z.string(),
    stack: z.array(z.string()),
    repo: z.string().url(),
    live: z.string().url().optional(),
    original: z.literal(true),
    order: z.number(),
  }),
});

const writing = defineCollection({
  loader: file('src/content/writing.json'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    summary: z.string(),
    source: z.string(),
    href: z.string().url(),
    order: z.number(),
  }),
});

const now = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/now' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date(),
    teaser: z.array(z.string()),
  }),
});

export const collections = { projects, writing, now };
