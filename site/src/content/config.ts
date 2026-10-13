import { defineCollection, z } from 'astro:content';

const services = defineCollection({
  type: 'content',
  schema: z
    .object({
      title: z.string(),
      tagline: z.string(),
      replaces: z.string(),
      difficulty: z.number().min(1).max(3),
      /** Folder under stacks/ with a beginner Compose file. Omit when there is none yet. */
      folder: z.string().optional(),
      /** Official install guide. Required when there is no beginner stack. */
      installDocs: z.string().url().optional(),
      mockupDescription: z.string().optional(),
      setupSteps: z.array(z.string()),
      whatNow: z.array(z.object({
        label: z.string(),
        href: z.string(),
        description: z.string(),
      })),
    })
    .refine((d) => d.folder || d.installDocs, {
      message: 'A service needs either a stacks/ folder or an installDocs link.',
    }),
});

export const collections = { services };
