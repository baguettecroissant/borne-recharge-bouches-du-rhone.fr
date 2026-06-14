import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const guides = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.string().transform((val) => new Date(val)),
    image: z.string(),
    category: z.string().default('Conseils Borne'),
    readTime: z.string().default('5 min'),
    author: z.string().default('Expert Borne Provence')
  }),
});

export const collections = { guides };
