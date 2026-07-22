import { defineCollection, z } from 'astro:content';

const services = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    replaces: z.string(),
    port: z.number(),
    difficulty: z.number().min(1).max(3),
    folder: z.string(),
    mockupDescription: z.string(),
    setupSteps: z.array(z.string()),
    whatNow: z.array(z.object({
      label: z.string(),
      href: z.string(),
      description: z.string(),
    })),
  }),
});

export const collections = { services };
