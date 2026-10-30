# ROTEIRO — Páginas de sites por nicho (RogerWeb)

> Documento de contexto para a IDE (Cursor/Windsurf). Complementa o `ROTEIRO-criacao-sites.md`.
> Objetivo: criar um menu **"Soluções"** no site principal e uma página por segmento em **`/sites-para/<nicho>/`**, gerada a partir de uma *content collection* do Astro com um único template.

---

## 1. Objetivos

- **Captar buscas específicas e menos concorridas** ("site para barbearia", "site para clínica médica", "site para imobiliária").
- **Aumentar a conversão**: o dono do negócio vê os problemas do segmento dele e funcionalidades que fazem sentido para ele.
- **Baratear o Google Ads**: um grupo de anúncios por nicho, cada um apontando para a sua página, o que melhora o Índice de Qualidade e reduz o CPC.
- **Reaproveitar os cases do portfólio** (Barber Club, Clinic Saúde, iBusca ABC…).

### Regra principal: nada de páginas "clonadas"
O Google considera *doorway pages* as páginas que só trocam o nome do nicho, e isso pode prejudicar o site inteiro. **Cada nicho precisa de conteúdo próprio**: dores, funcionalidades, FAQ, case e exemplos. Meta: **no mínimo 60% do texto exclusivo por página** e **mais de 600 palavras úteis**.

---

## 2. Arquitetura de URLs e menu

```
/criacao-sites/                       → página geral (já planejada)
/sites-para/                          → hub "Sites por segmento" (lista todos os nichos)
/sites-para/barbearias/
/sites-para/saloes-de-beleza/
/sites-para/clinicas-medicas/
/sites-para/laboratorios/
/sites-para/imobiliarias/
/sites-para/contabilidade/
/sites-para/comercio-local/
```

### Menu principal (header)
```
Serviços | Soluções ▾ | Portfólio | Sobre | Blog | Contato | [Orçamento Grátis]
            ├─ Barbearias
            ├─ Salões de beleza
            ├─ Clínicas médicas
            ├─ Laboratórios
            ├─ Imobiliárias
            ├─ Contabilidade
            ├─ Comércio local
            └─ Ver todos os segmentos → /sites-para/
```
- Desktop: dropdown ao passar o mouse **e** ao clicar (acessível por teclado, `aria-expanded`).
- Mobile: acordeão dentro do menu hambúrguer.
- **O menu é gerado a partir da collection**: novo nicho publicado entra no menu automaticamente (campo `menu: true`).
- Rodapé: coluna "Sites para" com os mesmos links (ajuda SEO interno).

---

## 3. Implementação no Astro

### 3.1 Content collection — `src/content.config.ts`
```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const nichos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/nichos' }),
  schema: ({ image }) => z.object({
    slug: z.string(),                       // 'barbearias'
    nome: z.string(),                       // 'Barbearias'
    nomeSingular: z.string(),               // 'barbearia'
    ordem: z.number().default(99),
    menu: z.boolean().default(true),
    publicado: z.boolean().default(false),  // só gera página se true
    icone: z.string(),                      // nome do ícone (lucide/heroicons)

    seo: z.object({
      title: z.string().max(60),
      description: z.string().max(160),
      ogImage: z.string().optional(),
    }),

    hero: z.object({
      h1: z.string(),
      subtitulo: z.string(),
      imagem: image().optional(),
      ctaTexto: z.string().default('Pedir orçamento grátis no WhatsApp'),
    }),

    whatsappMsg: z.string(),                // mensagem pré-preenchida
    palavrasChave: z.array(z.string()),     // referência para SEO/Ads (não renderiza)

    dores: z.array(z.object({ titulo: z.string(), texto: z.string() })).min(3),
    funcionalidades: z.array(z.object({
      titulo: z.string(), texto: z.string(), icone: z.string().optional(),
    })).min(4),
    paginasDoSite: z.array(z.string()),     // "O que seu site vai ter"
    case: z.object({
      nome: z.string(), descricao: z.string(), resultado: z.string().optional(),
      imagem: image().optional(), link: z.string().optional(),
    }).optional(),
    avisoSetor: z.string().optional(),      // ex.: regras CFM, CRECI
    faq: z.array(z.object({ pergunta: z.string(), resposta: z.string() })).min(4),
    precoAPartirDe: z.string().optional(),  // 'R$ 1.500' (definir)
  }),
});

export const collections = { nichos };
```

> O corpo do `.md` (abaixo do frontmatter) vira a seção **"Por que sua [barbearia] precisa de um site"**: texto livre e exclusivo de cada nicho (300–500 palavras).

### 3.2 Template dinâmico — `src/pages/sites-para/[nicho].astro`
```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
// componentes em src/components/nichos/*

export async function getStaticPaths() {
  const nichos = await getCollection('nichos', ({ data }) => data.publicado);
  return nichos.map((n) => ({ params: { nicho: n.data.slug }, props: { n } }));
}

const { n } = Astro.props;
const { Content } = await render(n);
const d = n.data;
const wa = `https://wa.me/5511910802646?text=${encodeURIComponent(d.whatsappMsg)}`;
---
<Layout title={d.seo.title} description={d.seo.description} canonical={`https://rogerweb.com.br/sites-para/${d.slug}/`}>
  <!-- Hero / Dores / Content (texto único) / Funcionalidades / Páginas do site /
       Case / Como funciona / Investimento / Aviso do setor / FAQ / CTA + Form -->
</Layout>
```

### 3.3 Hub — `src/pages/sites-para/index.astro`
- H1: **Sites para cada tipo de negócio**
- Grid de cards (ícone, nome, 1 linha, link) gerado da collection, ordenado por `ordem`.
- Texto curto explicando que cada segmento tem necessidades diferentes, mais um CTA para `/criacao-sites/`.

### 3.4 Menu — `src/components/Header.astro`
```astro
---
import { getCollection } from 'astro:content';
const nichosMenu = (await getCollection('nichos', ({ data }) => data.publicado && data.menu))
  .sort((a, b) => a.data.ordem - b.data.ordem);
---
```

### 3.5 Estrutura de arquivos
```
src/
  content.config.ts
  content/nichos/
    barbearias.md
    saloes-de-beleza.md
    clinicas-medicas.md
    laboratorios.md
    imobiliarias.md
    contabilidade.md
    comercio-local.md
  pages/sites-para/
    index.astro
    [nicho].astro
  components/nichos/
    NichoHero.astro
    NichoDores.astro
    NichoFuncionalidades.astro
    NichoPaginas.astro
    NichoCase.astro
    NichoFaq.astro          (+ JSON-LD FAQPage)
    NichoCta.astro
    MenuSolucoes.astro      (dropdown desktop + acordeão mobile)
```

---

## 4. Estrutura padrão de cada página de nicho

1. **Hero**: H1 com o nicho e a região, subtítulo, CTA WhatsApp com mensagem do nicho, imagem/mockup do segmento.
2. **Dores** (3 cards): problemas reais do segmento.
3. **Por que sua [nicho] precisa de um site**: corpo do `.md`, texto exclusivo.
4. **Funcionalidades** (4–6 cards): o que o site faz para esse negócio.
5. **O que seu site vai ter**: lista de páginas/seções típicas.
6. **Case real** (se existir): print, descrição e resultado **verificável**.
7. **Como funciona**: os mesmos 5 passos da `/criacao-sites/` (componente compartilhado).
8. **Investimento**: "a partir de R$ ___" (opcional, por nicho).
9. **Aviso do setor** (quando houver): regras de publicidade do segmento.
10. **FAQ** (4–6 perguntas do nicho) + JSON-LD `FAQPage`.
11. **CTA final + formulário**: campo "Segmento" já preenchido (hidden) com o slug.
12. **Links internos**: "Veja também: sites para [2 nichos relacionados]" + link para `/criacao-sites/`.

### Schema JSON-LD por página
- `Service` (serviceType: "Criação de site para [nicho]", provider: RogerWeb, areaServed: Santo André/ABC/SP)
- `FAQPage` (perguntas da página)
- `BreadcrumbList` (Início › Sites por segmento › [Nicho])

---

## 5. Conteúdo base por nicho

> Rascunhos para preencher os `.md`. **Revisar, completar e trocar os placeholders `TODO` por informações reais.** Não inventar números, clientes ou depoimentos.

### 5.1 Barbearias — `barbearias.md` · ordem 1 · ✅ tem case (Barber Club)
- **SEO title:** Site para Barbearia com Agendamento Online | RogerWeb
- **Description:** Site profissional para barbearia com agendamento online, integração com WhatsApp e Instagram. Atendemos Santo André, ABC e SP. Orçamento grátis.
- **H1:** Site para Barbearia com Agendamento Online
- **Subtítulo:** Seus clientes marcam horário sozinhos, 24h por dia, e você para de perder tempo respondendo WhatsApp.
- **WhatsApp:** "Olá! Tenho uma barbearia e quero um orçamento de site."
- **Palavras-chave:** site para barbearia, sistema de agendamento barbearia, site barbearia santo andré, agendamento online barbearia
- **Dores:**
  - Agenda bagunçada no WhatsApp e no caderno
  - Clientes que faltam sem avisar
  - A barbearia não aparece quando procuram "barbearia perto de mim"
- **Funcionalidades:** agendamento online por barbeiro e serviço · lembrete automático no WhatsApp · tabela de serviços e preços · galeria de cortes integrada ao Instagram · planos/assinaturas mensais · botão "Como chegar" + Google Meu Negócio
- **Páginas do site:** Início, Serviços e preços, Equipe, Galeria, Agendar, Contato/localização
- **Case:** Barber Club: app web de auto-agendamento com integração ao WhatsApp. Resultado: "redução de 45% nas faltas" (**TODO: confirmar com o cliente antes de publicar**)
- **FAQ:** Dá para cada barbeiro ter sua agenda? · O cliente recebe lembrete? · Consigo cobrar sinal no agendamento? · Funciona no celular? · Preciso pagar mensalidade do sistema?

### 5.2 Salões de beleza — `saloes-de-beleza.md` · ordem 2
- **SEO title:** Site para Salão de Beleza com Agendamento | RogerWeb
- **Description:** Crie o site do seu salão de beleza com agendamento online, vitrine de serviços e integração com Instagram e WhatsApp. Orçamento grátis.
- **H1:** Site para Salão de Beleza que Enche a Agenda
- **Subtítulo:** Mostre seus trabalhos, receba agendamentos online e seja encontrada no Google.
- **WhatsApp:** "Olá! Tenho um salão de beleza e quero um orçamento de site."
- **Palavras-chave:** site para salão de beleza, agendamento online salão, site para esteticista, site para manicure
- **Dores:** depender só do Instagram (alcance caiu) · agendamentos perdidos fora do horário · clientes que não sabem os preços e desistem
- **Funcionalidades:** agendamento por profissional e serviço · catálogo de serviços com duração e preço · galeria antes/depois de **cabelo/unhas/maquiagem** · pacotes e vale-presente · avaliações do Google na página · link na bio do Instagram
- **Páginas:** Início, Serviços, Profissionais, Galeria, Agendar, Contato
- **Case:** TODO (usar projeto demo até ter cliente)
- **FAQ:** Integra com meu Instagram? · Posso vender pacotes/vale-presente? · Cada profissional vê sua agenda? · Quanto tempo para ficar pronto?

### 5.3 Clínicas médicas — `clinicas-medicas.md` · ordem 3 · ✅ tem case (Clinic Saúde)
- **SEO title:** Site para Clínica Médica dentro das Normas do CFM | RogerWeb
- **Description:** Site para clínicas e consultórios com agendamento online, páginas por especialidade e conformidade com LGPD e normas de publicidade médica.
- **H1:** Site para Clínica Médica e Consultório
- **Subtítulo:** Mais pacientes agendando pela internet, com um site seguro, ético e dentro das regras do CFM.
- **WhatsApp:** "Olá! Tenho uma clínica e quero um orçamento de site."
- **Palavras-chave:** site para clínica médica, site para consultório médico, site para médico, agendamento online clínica
- **Dores:** recepção sobrecarregada com ligações · pacientes não encontram a clínica no Google · medo de errar nas regras de publicidade médica
- **Funcionalidades:** páginas por especialidade e por médico (com CRM/RQE) · agendamento online ou pré-agendamento · convênios aceitos · formulários com consentimento LGPD · blog educativo para SEO · integração com sistema/prontuário (sob consulta)
- **Páginas:** Início, Especialidades, Corpo clínico, Convênios, Agendar, Blog, Contato
- **Case:** Clinic Saúde: software com prontuário eletrônico, controle de consultas e faturamento (**TODO: confirmar resultado divulgável**)
- **Aviso do setor:** "Seguimos as regras de publicidade médica do CFM: identificação do responsável técnico com CRM/RQE, sem promessa de resultado e com uso cuidadoso de imagens de pacientes." (**TODO: revisar com a resolução vigente do CFM antes de publicar**)
- **FAQ:** O site segue as regras do CFM? · Dá para o paciente agendar sozinho? · Os dados dos pacientes ficam seguros (LGPD)? · Integra com meu sistema atual?

### 5.4 Laboratórios — `laboratorios.md` · ordem 4
- **SEO title:** Site para Laboratório com Resultados Online | RogerWeb
- **Description:** Site para laboratórios de análises clínicas com consulta de resultados online, unidades, convênios e preparo de exames. Seguro e conforme a LGPD.
- **H1:** Site para Laboratório de Análises Clínicas
- **Subtítulo:** Resultados online, orientações de preparo e unidades fáceis de encontrar, tudo em um site rápido e seguro.
- **WhatsApp:** "Olá! Tenho um laboratório e quero um orçamento de site."
- **Palavras-chave:** site para laboratório, site laboratório de análises clínicas, resultado de exames online, portal de resultados
- **Dores:** telefone lotado com "meu exame já saiu?" · pacientes chegam sem o preparo correto · informações de unidades e horários desatualizadas
- **Funcionalidades:** portal de resultados (link para o sistema do laboratório ou área própria com login) · guia de preparo por exame · unidades com mapa e horários · convênios · coleta domiciliar com agendamento · LGPD (consentimento, política de privacidade, HTTPS)
- **Páginas:** Início, Exames e preparo, Resultados, Unidades, Convênios, Coleta domiciliar, Contato
- **Case:** TODO
- **Aviso do setor:** seguir normas sanitárias e de publicidade em saúde; identificar o responsável técnico. (**TODO: validar com o cliente**)
- **FAQ:** Integra com o sistema de laudos que já usamos? · O paciente acessa o resultado com segurança? · Dá para agendar coleta domiciliar? · Vocês fazem a hospedagem?

### 5.5 Imobiliárias — `imobiliarias.md` · ordem 5
- **SEO title:** Site para Imobiliária com Busca de Imóveis | RogerWeb
- **Description:** Site para imobiliárias e corretores com catálogo de imóveis, filtros de busca, integração com portais e captação de leads pelo WhatsApp.
- **H1:** Site para Imobiliária e Corretor de Imóveis
- **Subtítulo:** Seus imóveis com busca por bairro, preço e tipo, e cada interessado chegando direto no seu WhatsApp.
- **WhatsApp:** "Olá! Tenho uma imobiliária e quero um orçamento de site."
- **Palavras-chave:** site para imobiliária, site para corretor de imóveis, site imobiliária santo andré, sistema imobiliário
- **Dores:** depender só dos portais (e pagar caro por lead) · catálogo desatualizado · leads que se perdem sem resposta
- **Funcionalidades:** cadastro de imóveis com fotos, mapa e filtros · página de cada imóvel otimizada para Google e compartilhamento · botão WhatsApp por imóvel/corretor · captação de imóveis ("anuncie seu imóvel") · integração XML com portais (sob consulta) · painel para a equipe atualizar sozinha
- **Páginas:** Início, Comprar, Alugar, Imóvel (detalhe), Anuncie seu imóvel, Sobre, Contato
- **Case:** TODO
- **Aviso do setor:** exibir o número do **CRECI** da imobiliária/corretor no site, conforme exigido na publicidade imobiliária.
- **FAQ:** Eu mesmo cadastro os imóveis? · Integra com os portais? · Cada corretor recebe seus leads? · Dá para ter tour virtual/vídeo?

### 5.6 Contabilidade — `contabilidade.md` · ordem 6
- **SEO title:** Site para Escritório de Contabilidade | RogerWeb
- **Description:** Site para escritórios contábeis com área do cliente, envio de documentos, calculadoras e captação de novas empresas. Atendemos o ABC e SP.
- **H1:** Site para Escritório de Contabilidade
- **Subtítulo:** Capte novos clientes pela internet e organize o envio de documentos em uma área do cliente segura.
- **WhatsApp:** "Olá! Tenho um escritório de contabilidade e quero um orçamento de site."
- **Palavras-chave:** site para contabilidade, site para escritório contábil, site para contador, área do cliente contabilidade
- **Dores:** documentos chegando por WhatsApp e e-mail sem organização · site antigo que não traz clientes · concorrência de contabilidades online
- **Funcionalidades:** páginas por serviço (abertura de empresa, MEI, Simples, folha, IRPF) · área do cliente para upload/download de documentos · formulário "Abra sua empresa" para captar leads · calculadoras simples (ex.: pró-labore, Simples) · blog para SEO · notícias/prazos fiscais
- **Páginas:** Início, Serviços, Abra sua empresa, Área do cliente, Blog, Sobre, Contato
- **Case:** TODO (se houver sistema de gestão financeira, citar UniEasy como experiência com finanças)
- **Aviso do setor:** publicidade sóbria, conforme o código de ética do CFC. (**TODO: validar**)
- **FAQ:** A área do cliente é segura? · Dá para integrar com meu sistema contábil? · Vocês escrevem os textos do blog? · Posso captar clientes de outras cidades?

### 5.7 Comércio local — `comercio-local.md` · ordem 7 · ✅ tem case (iBusca ABC)
- **SEO title:** Site para Comércio Local no ABC | RogerWeb
- **Description:** Site para lojas e comércios locais aparecerem no Google: catálogo de produtos, pedidos pelo WhatsApp, Google Meu Negócio e mapa. Orçamento grátis.
- **H1:** Site para Comércio Local Ser Encontrado no Google
- **Subtítulo:** Catálogo, pedidos pelo WhatsApp e sua loja no mapa: clientes do bairro encontrando você primeiro.
- **WhatsApp:** "Olá! Tenho um comércio e quero um orçamento de site."
- **Palavras-chave:** site para loja, site para comércio local, catálogo online whatsapp, site para pequena empresa
- **Dores:** clientes procuram no Google e encontram o concorrente · catálogo só no Instagram · horário e endereço desatualizados
- **Funcionalidades:** catálogo com fotos e preços · pedido/orçamento pelo WhatsApp com carrinho simples · Google Meu Negócio configurado e otimizado · mapa, horários e formas de pagamento · promoções da semana · opção de loja virtual completa (Pix/MercadoPago)
- **Páginas:** Início, Produtos, Promoções, Sobre, Como chegar, Contato
- **Case:** iBusca ABC: guia comercial regional conectando empresas locais a consumidores do Grande ABC
- **FAQ:** Preciso de loja virtual ou um catálogo basta? · Vocês configuram o Google Meu Negócio? · Consigo atualizar os preços sozinho? · Aceita Pix?

---

## 6. Rastreamento (GTM `GTM-P6BHKD8`)

- Todos os CTAs com `data-nicho="<slug>"`.
- `dataLayer.push({ event: 'whatsapp_click', nicho: '<slug>', page: location.pathname })`
- Formulário envia `nicho` em campo hidden e redireciona para `/criacao-sites/obrigado/?nicho=<slug>` (página `noindex`).
- No GA4, criar a dimensão personalizada **`nicho`** para comparar leads por segmento.
- No Google Ads, usar as mesmas conversões da `/criacao-sites/` (WhatsApp, Formulário, Ligação).

---

## 7. Google Ads: um grupo de anúncios por nicho

Na campanha "Roger web" (ou numa nova campanha "Nichos"), criar grupos:

| Grupo | Palavras-chave (frase) | URL final |
|---|---|---|
| Barbearias | "site para barbearia", "agendamento online barbearia", "sistema para barbearia" | /sites-para/barbearias/ |
| Salões | "site para salão de beleza", "agendamento online salão" | /sites-para/saloes-de-beleza/ |
| Clínicas | "site para clínica", "site para consultório", "site para médico" | /sites-para/clinicas-medicas/ |
| Laboratórios | "site para laboratório" | /sites-para/laboratorios/ |
| Imobiliárias | "site para imobiliária", "site para corretor de imóveis" | /sites-para/imobiliarias/ |
| Contabilidade | "site para contabilidade", "site para escritório contábil" | /sites-para/contabilidade/ |
| Comércio | "site para loja", "catálogo online whatsapp" | /sites-para/comercio-local/ |

- Cada grupo com **anúncio responsivo próprio** (títulos com o nome do nicho: "Site para Barbearia", "Agendamento Online 24h"…).
- Negativas extras: "template", "grátis", "app", "como fazer", "curso".
- ⚠️ Saúde (clínicas/laboratórios): o Google Ads tem políticas próprias para anúncios de saúde. Manter o anúncio focado no **serviço de criação de sites**, sem prometer resultado médico.
- Com R$ 8/dia, **ativar 2 ou 3 grupos por vez** (começar por Barbearias, Clínicas e Comércio local) para não diluir o orçamento.

---

## 8. Plano de lançamento (fases)

| Fase | Entregas |
|---|---|
| **1** | Collection + template + hub + menu "Soluções" · publicar **Barbearias, Clínicas médicas, Comércio local** (têm case) |
| **2** | Grupos de anúncios desses 3 nichos · medir 2–4 semanas |
| **3** | Publicar **Salões, Imobiliárias, Contabilidade, Laboratórios** (`publicado: true` conforme o conteúdo ficar pronto) |
| **4** | Para cada nicho, 1–2 posts de blog ("Quanto custa um site para barbearia?") apontando para a página |

> Nicho sem conteúdo pronto fica com `publicado: false`: não gera página nem aparece no menu.

---

## 9. Checklist por página

- [ ] Title ≤ 60 e description ≤ 160 caracteres, únicos
- [ ] H1 único com o nome do nicho
- [ ] ≥ 600 palavras úteis, ≥ 60% exclusivas do nicho
- [ ] Imagens próprias do segmento (WebP/AVIF, alt descritivo)
- [ ] CTA WhatsApp com mensagem do nicho
- [ ] FAQ + JSON-LD (Service, FAQPage, BreadcrumbList)
- [ ] Links internos: hub, `/criacao-sites/`, 2 nichos relacionados
- [ ] Aviso do setor revisado (clínicas, laboratórios, imobiliárias, contabilidade)
- [ ] Nenhum número/depoimento sem comprovação
- [ ] PageSpeed mobile ≥ 90
- [ ] Incluída no sitemap e enviada no Search Console

---

## 10. Prompt sugerido para a IDE

> "Usando o ROTEIRO-sites-por-nicho.md como especificação, implemente no projeto Astro existente: (1) a content collection `nichos` conforme a seção 3.1; (2) o template `src/pages/sites-para/[nicho].astro` com as seções da seção 4, componentizadas em `src/components/nichos/`; (3) o hub `/sites-para/`; (4) o dropdown 'Soluções' no Header (desktop e mobile, acessível) gerado da collection; (5) os 7 arquivos `.md` com o conteúdo da seção 5, marcando `publicado: true` apenas em barbearias, clinicas-medicas e comercio-local. Reutilize Layout, Footer, WhatsAppFloat e o componente 'Como funciona' da página /criacao-sites/. Tailwind v4 com a paleta atual (fundo escuro, purple-600/purple-400). Mantenha os TODOs visíveis no código; não invente números ou depoimentos."
