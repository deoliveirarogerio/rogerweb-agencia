# ROTEIRO — Landing page `/criacao-sites` (RogerWeb)

> Documento de contexto para a IDE (Cursor/Windsurf). Objetivo: construir a página de destino da campanha de Google Ads **"Roger web"** e publicá-la em **https://rogerweb.com.br/criacao-sites** via Cloudflare.

---

## 1. Objetivo da página

- **Converter cliques do Google Ads em contatos** (WhatsApp e formulário) de empresas de **Santo André, ABC e São Paulo** que querem **site profissional ou landing page**.
- **Aumentar o Índice de Qualidade** dos anúncios: página rápida, relevante e com o mesmo texto das palavras-chave/anúncios (message match). Melhor índice = CPC menor e mais impressões.
- Métrica principal: **cliques no WhatsApp + envios de formulário** (conversões no Google Ads).

### Stack identificada no site atual
| Item | Valor |
|---|---|
| Framework | **Astro** (assets em `/_astro/`) |
| CSS | **Tailwind CSS v4** (cores `oklch`) |
| Hospedagem/CDN | **Cloudflare** (`server: cloudflare`, `cf-ray`) |
| Fonte | Inter, system-ui |
| Cores | fundo escuro (slate/gray-900), roxo `#9333EA` (purple-600), roxo claro `#C084FC` (purple-400), texto `#FFFFFF` / gray-400 |
| Tags | GTM `GTM-P6BHKD8`, GA4 `G-BHMV0EHP7V`, Cloudflare Web Analytics |
| Componente existente | `WhatsAppFloat` (reutilizar) |

> A página deve ser criada **dentro do mesmo projeto Astro** (`src/pages/criacao-sites.astro`), reaproveitando layout, header, footer e o botão flutuante do WhatsApp.

---

## 2. Palavras-chave que a página precisa cobrir

Usar naturalmente em H1, H2, textos e FAQ (sem exagerar):

- criação de sites / criação de site
- criação de site santo andré / criação de sites em santo andré
- criação de sites abc / são bernardo / são caetano
- site para empresa / site profissional para empresa
- landing page profissional / criação de landing page
- desenvolvedor de sites / desenvolvimento de sites
- agência digital santo andré

---

## 3. SEO técnico

```html
<title>Criação de Sites em Santo André e ABC | RogerWeb</title>
<meta name="description" content="Criação de sites e landing pages profissionais para empresas em Santo André, ABC e São Paulo. Sites rápidos, responsivos e otimizados para o Google. Orçamento grátis pelo WhatsApp." />
<link rel="canonical" href="https://rogerweb.com.br/criacao-sites/" />
<meta property="og:title" content="Criação de Sites em Santo André e ABC | RogerWeb" />
<meta property="og:description" content="Sites e landing pages sob medida para empresas. Orçamento grátis." />
<meta property="og:url" content="https://rogerweb.com.br/criacao-sites/" />
<meta property="og:image" content="https://rogerweb.com.br/og/criacao-sites.jpg" />
<meta name="robots" content="index, follow" />
```

- **Um único H1**: `Criação de Sites em Santo André e ABC`
- URL com barra final (`/criacao-sites/`): é o formato padrão do Astro (`build.format: 'directory'`). Use **a mesma URL** no canonical, no sitemap e no Google Ads.
- Adicionar a página ao `sitemap.xml` (se usar `@astrojs/sitemap`, entra automático).
- Imagens em **WebP/AVIF** com `width`/`height` definidos e `loading="lazy"` (exceto a do topo).
- **Schema JSON-LD** (colocar no `<head>`):

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": "https://rogerweb.com.br/#empresa",
      "name": "RogerWeb",
      "url": "https://rogerweb.com.br/",
      "telephone": "+55-11-91080-2646",
      "email": "contato@rogerweb.com.br",
      "areaServed": ["Santo André", "São Bernardo do Campo", "São Caetano do Sul", "São Paulo"],
      "address": { "@type": "PostalAddress", "addressLocality": "Santo André", "addressRegion": "SP", "addressCountry": "BR" }
    },
    {
      "@type": "Service",
      "serviceType": "Criação de sites e landing pages",
      "provider": { "@id": "https://rogerweb.com.br/#empresa" },
      "areaServed": "Grande ABC e São Paulo"
    },
    {
      "@type": "FAQPage",
      "mainEntity": [ "/* preencher com as perguntas da seção FAQ */" ]
    }
  ]
}
```

---

## 4. Estrutura da página (seção por seção)

> Regra de ouro: **o topo da página deve repetir a promessa do anúncio.** Quem clicou em "Criação de Sites em SP | Orçamento Grátis pelo WhatsApp" precisa ver isso em 1 segundo.

### 4.1 Hero (acima da dobra)
- **H1:** Criação de Sites em Santo André e ABC
- **Subtítulo:** Sites e landing pages sob medida, rápidos e prontos para aparecer no Google. Atendimento direto com o desenvolvedor.
- **CTA primário (WhatsApp):** `Pedir orçamento grátis no WhatsApp` → `https://wa.me/5511910802646?text=Olá! Vim pelo Google e quero um orçamento de site.` (texto com `encodeURIComponent`)
- **CTA secundário:** `Ver projetos` → âncora `#portfolio`
- **Selos curtos (bullets):** Orçamento grátis · Site responsivo · Otimizado para SEO · Suporte pós-entrega
- Visual: mockup de site em notebook/celular (imagem otimizada, `fetchpriority="high"`).

### 4.2 Barra de prova / confiança
- "Mais de 8 anos desenvolvendo para a web" · "Atendimento em Santo André, ABC e SP" · logos de clientes **(somente com autorização)**.
- ⚠️ **Não usar números que não possam ser comprovados** (ex.: "+150 empresas", "300% de vendas"). O Google Ads pode reprovar o anúncio por afirmação enganosa na página de destino.

### 4.3 O problema → a solução
- H2: **Seu site está trazendo clientes?**
- 3 dores em cards: site lento/antigo · não aparece no Google · não funciona bem no celular.
- Fechamento: "A RogerWeb cria sites pensados para gerar contatos, não só para ficar bonitos."

### 4.4 Serviços (cards)
H2: **O que fazemos**
1. **Site institucional para empresa**: páginas de serviços, quem somos, contato e mapa.
2. **Landing page profissional**: página única focada em conversão, ideal para Google Ads e Instagram.
3. **Loja virtual**: catálogo, carrinho e pagamento (MercadoPago/Pix).
4. **Sistemas web sob medida**: agendamentos, áreas de cliente, painéis (Laravel + Vue).

Cada card com ícone, 2 linhas de descrição e link "Quero esse" → WhatsApp com texto específico (`?text=Quero orçamento de landing page`).

### 4.5 Diferenciais
H2: **Por que criar seu site com a RogerWeb**
- Atendimento direto com o desenvolvedor (sem intermediários)
- Site rápido (nota alta no PageSpeed) e responsivo
- SEO básico incluso: títulos, descrições, sitemap e Google Search Console
- Integração com WhatsApp, formulário e Google Meu Negócio
- Domínio e hospedagem orientados, site no nome da sua empresa
- Suporte após a entrega

### 4.6 Como funciona (passo a passo)
H2: **Do briefing ao site no ar**
1. Conversa inicial (WhatsApp ou chamada): gratuita
2. Proposta com escopo, prazo e valor
3. Layout para aprovação
4. Desenvolvimento e revisões
5. Publicação + treinamento + suporte

### 4.7 Portfólio (`id="portfolio"`)
- 3 a 6 projetos reais (reaproveitar os da home: iBusca ABC, Barber Club, etc.), com imagem, segmento e 1 linha de resultado **verificável**.
- Botão: "Ver portfólio completo" → `/#portfolio`.

### 4.8 Depoimentos
- Reutilizar o componente `Testimonials` existente. Usar apenas depoimentos reais (de preferência os do Google Meu Negócio, com nome e empresa autorizados).

### 4.9 Investimento (opcional, recomendado)
- H2: **Quanto custa um site?**
- Faixas "a partir de R$ ___" para institucional / landing page / loja (**definir valores**). Mostrar preço filtra curiosos e melhora a qualidade dos leads.
- Nota: "O valor final depende do escopo. Orçamento grátis."

### 4.10 FAQ (accordion + JSON-LD FAQPage)
- Quanto tempo leva para criar um site?
- Quanto custa criar um site para empresa?
- O site vai aparecer no Google?
- Vocês atendem fora de Santo André?
- Eu consigo atualizar o site depois?
- Preciso pagar mensalidade?
- O site funciona no celular?

### 4.11 CTA final + formulário (`id="orcamento"`)
- H2: **Vamos tirar seu site do papel?**
- Formulário curto: **Nome, WhatsApp, Tipo de projeto (select), Mensagem (opcional)** + checkbox LGPD ("Concordo com a Política de Privacidade" → `/privacidade`).
- Botão: "Receber orçamento grátis".
- Ao lado: botão grande do WhatsApp, e-mail `contato@rogerweb.com.br`, "Atendimento seg a sex, 8h–19h | sáb, 8h–12h" (igual à programação do Ads).

### 4.12 Rodapé
- Reutilizar o footer do site + link para `/privacidade`.
- Manter o `WhatsAppFloat`.

---

## 5. Formulário: envio (sem backend próprio)

Opções, da mais simples à mais robusta:

1. **Cloudflare Pages Functions / Workers** (`functions/api/orcamento.ts`): recebe o POST, valida, envia e-mail via **Resend** ou **MailChannels**/API de e-mail, e responde JSON.
2. **Serviço externo** (Formspree, Web3Forms): só o `action` do form.
3. Proteção anti-spam: **Cloudflare Turnstile** (gratuito) + campo honeypot.

Após envio com sucesso → redirecionar para **`/criacao-sites/obrigado/`** (página de agradecimento com `noindex`). Isso facilita medir a conversão.

---

## 6. Rastreamento de conversões (essencial para o Google Ads)

Via **GTM `GTM-P6BHKD8`** (já instalado):

| Evento | Gatilho | Uso |
|---|---|---|
| `whatsapp_click` | clique em links `wa.me` | Conversão Google Ads "Contato WhatsApp" + evento GA4 |
| `generate_lead` | visualização de `/criacao-sites/obrigado/` | Conversão Google Ads "Formulário" |
| `phone_click` | clique em `tel:` | Conversão "Ligação" |

No código, adicionar `data-track="whatsapp"` nos botões e, opcionalmente:

```js
document.querySelectorAll('a[href*="wa.me"]').forEach(a =>
  a.addEventListener('click', () => window.dataLayer?.push({ event: 'whatsapp_click', page: location.pathname }))
);
```

No Google Ads: **Metas → Conversões → Nova ação → Site**, importar os eventos do GA4 ou criar tags de conversão no GTM. Assim a campanha passa a saber o que é um lead, e depois dá para migrar para "Maximizar conversões".

---

## 7. Performance e qualidade (checklist)

- [ ] PageSpeed mobile ≥ 90 (LCP < 2,5 s, CLS < 0,1)
- [ ] Imagens WebP/AVIF, `astro:assets` (`<Image />`)
- [ ] Sem JS desnecessário (Astro islands só onde precisar: FAQ/form)
- [ ] Fontes com `font-display: swap`
- [ ] Contraste AA no tema escuro
- [ ] Todos os CTAs funcionam no celular
- [ ] Texto livre de afirmações não comprováveis
- [ ] Política de Privacidade linkada (LGPD)

---

## 8. Estrutura de arquivos sugerida (Astro)

```
src/
  pages/
    criacao-sites.astro            → /criacao-sites/
    criacao-sites/obrigado.astro   → /criacao-sites/obrigado/   (noindex)
  components/criacao-sites/
    Hero.astro
    Servicos.astro
    Diferenciais.astro
    ComoFunciona.astro
    Portfolio.astro
    Investimento.astro
    Faq.astro
    FormOrcamento.astro
functions/
  api/orcamento.ts                 → POST /api/orcamento   (se usar Pages Functions)
public/
  og/criacao-sites.jpg
```

> Se o projeto já usa `src/pages/criacao-sites/index.astro` como padrão, mantenha o padrão do projeto.

---

## 9. Publicação no Cloudflare (domínio rogerweb.com.br)

O site já está no Cloudflare. Primeiro descubra **como** ele é publicado:

**Painel Cloudflare → Workers & Pages** → procure o projeto do site (ex.: `rogerweb`). Abra e veja a aba **Custom domains / Domínios personalizados**: se `rogerweb.com.br` estiver lá, é esse projeto.

### Cenário A (mais provável): projeto Astro no Cloudflare Pages/Workers ligado ao Git
1. Na IDE, crie a página no **mesmo repositório** (`src/pages/criacao-sites.astro`).
2. Teste local: `npm run dev` → `http://localhost:4321/criacao-sites/`
3. Build de verificação: `npm run build && npm run preview`
4. Crie uma branch e envie:
   ```bash
   git checkout -b feat/criacao-sites
   git add .
   git commit -m "feat: landing page criação de sites"
   git push origin feat/criacao-sites
   ```
5. O Cloudflare gera um **preview** automático (URL tipo `feat-criacao-sites.<projeto>.pages.dev`). Revise no celular.
6. Faça merge na branch de produção (`main`) → deploy automático em `https://rogerweb.com.br/criacao-sites/`.

### Cenário A2: projeto no Cloudflare mas com upload manual (sem Git)
```bash
npm run build
npx wrangler login
npx wrangler pages deploy dist --project-name=<nome-do-projeto>
```
(Se for um **Worker com static assets**: `npx wrangler deploy`, conforme o `wrangler.toml/jsonc` do projeto.)

### Cenário B: quer a landing como projeto separado
1. Crie um projeto Astro novo só da landing (com `base: '/criacao-sites'` no `astro.config.mjs`).
2. Publique em **Workers & Pages → Create → Pages** (conecte o Git ou faça upload do `dist`).
3. Crie um **Worker** com rota `rogerweb.com.br/criacao-sites*` que faça proxy para o `*.pages.dev` do novo projeto.
   ➜ Funciona, mas é mais complexo. **Recomendado: Cenário A.**

### Depois do deploy
- [ ] Abrir `https://rogerweb.com.br/criacao-sites/` e conferir status **200** (não 404/redirect em loop).
- [ ] **Caching → Configuration → Purge Cache** (ou purge só da URL) se aparecer versão antiga.
- [ ] Google Search Console → **Inspeção de URL** → "Solicitar indexação".
- [ ] Conferir tags no **GTM Preview** e no **Google Tag Assistant**.

---

## 10. Ajustes no Google Ads após publicar

1. **Anúncio → URL final:** trocar `https://rogerweb.com.br/` por `https://rogerweb.com.br/criacao-sites/` (o caminho exibido `criacao-sites/abc-sp` já está configurado).
2. **Sitelink "Orçamento Grátis":** apontar para `https://rogerweb.com.br/criacao-sites/#orcamento`.
3. **Metas de conversão:** usar as conversões novas (WhatsApp, Formulário) como principais da campanha.
4. Após 2–4 semanas com conversões registradas: testar lance **"Maximizar conversões"**.
5. Reativar aos poucos as palavras pausadas por custo ("criação de site", "site profissional para empresa"...) se o Índice de Qualidade subir e o CPC cair.

---

## 11. Prompt sugerido para a IDE

> "Usando este ROTEIRO-criacao-sites.md como especificação, crie a página `src/pages/criacao-sites.astro` no projeto Astro existente, reutilizando o Layout, Header, Footer, WhatsAppFloat e Testimonials. Siga a estrutura da seção 4, o SEO da seção 3 e o rastreamento da seção 6. Use Tailwind v4 com a paleta atual (fundo escuro, purple-600/purple-400). Componentize cada seção em `src/components/criacao-sites/`. Não invente números ou depoimentos: deixe placeholders marcados com TODO."
