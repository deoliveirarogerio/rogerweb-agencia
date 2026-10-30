import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
    excerpt: z.string(),
    image: z.string().url(),
  }),
});

const nichos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/nichos' }),
  schema: ({ image }) => z.object({
    slug: z.string(),
    nome: z.string(),
    nomeSingular: z.string(),
    ordem: z.number().default(99),
    menu: z.boolean().default(true),
    publicado: z.boolean().default(false),
    icone: z.string(),

    seo: z.object({
      title: z.string().max(60),
      description: z.string().max(160),
      ogImage: z.string().optional(),
    }),

    hero: z.object({
      h1: z.string(),
      subtitulo: z.string(),
      ctaTexto: z.string().default('Pedir orçamento grátis no WhatsApp'),
    }),

    whatsappMsg: z.string(),
    palavrasChave: z.array(z.string()),

    dores: z.array(z.object({ titulo: z.string(), texto: z.string() })).min(3),
    funcionalidades: z.array(z.object({
      titulo: z.string(),
      texto: z.string(),
      icone: z.string().optional(),
    })).min(4),
    paginasDoSite: z.array(z.string()),
    case: z.object({
      nome: z.string(),
      descricao: z.string(),
      resultado: z.string().optional(),
      imagem: image().optional(),
      link: z.string().optional(),
    }).optional(),
    avisoSetor: z.string().optional(),
    faq: z.array(z.object({ pergunta: z.string(), resposta: z.string() })).min(4),
  }),
});

export const collections = { blog, nichos };
