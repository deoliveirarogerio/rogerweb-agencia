# AJUSTES — Página `/criacao-sites/` (pós-publicação)

> Documento de contexto para a IDE (Cursor/Windsurf). Lista os ajustes encontrados na vistoria da página publicada em **https://rogerweb.com.br/criacao-sites/**.
> Depois de publicar, voltar ao Claude para concluir a parte do Google Ads (seção 5).

---

## Situação atual (vistoria)

| Item | Status |
|---|---|
| Página `/criacao-sites/` | ✅ No ar (200). `/criacao-sites` redireciona para `/criacao-sites/` |
| Página `/criacao-de-sites/` | ❌ 404 (o endereço oficial é `/criacao-sites/`) |
| GTM `GTM-P6BHKD8` + GA4 `G-BHMV0EHP7V` | ✅ Instalados |
| Evento `whatsapp_click` | ✅ Disparando, marcado como **evento principal** no GA4 e importado no Google Ads (categoria Contato) |
| Formulário (`POST /api/orcamento`) | ⚠️ Funciona, mas **não gera conversão** |
| Página de agradecimento | ❌ Não existe (`/criacao-sites/obrigado/` → 404) |
| Números de WhatsApp | ⚠️ **Dois números diferentes** na mesma página |
| Anúncio no Google Ads | ✅ URL final já aponta para `/criacao-sites/` |

---

## 1. Padronizar o número de WhatsApp ⚠️ prioridade alta

**Problema:** a página usa dois números:
- **(11) 91080-2646** → 13 links (hero, cards, preços, CTA final…). É o número do **anúncio** e da **extensão de chamada** do Google Ads.
- **(11) 91213-6490** → botão flutuante **"Fale conosco!"** (`WhatsAppFloat`) e botão **"Falar agora no WhatsApp"** do **modal de saída** (`#exit-modal-card`).

**Tarefa:**
- [ ] Centralizar o número em um único lugar, por exemplo `src/data/contato.ts`:
  ```ts
  export const WHATSAPP = '5511910802646';
  export const WHATSAPP_EXIBICAO = '(11) 91080-2646';
  export const waLink = (msg: string) =>
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  ```
- [ ] Atualizar `WhatsAppFloat`, o modal de saída e todos os CTAs para usar `waLink()`.
- [ ] Buscar no projeto inteiro por `912136490` e `91213-6490` e substituir.
- [ ] (Se o 91213-6490 for proposital, por exemplo outro atendente, manter, mas garantir que **todos** os links `wa.me` disparem o evento `whatsapp_click`.)

---

## 2. Conversão do formulário (`generate_lead`) ⚠️ prioridade alta

**Problema:** o envio do formulário não dispara evento nem leva a uma página de confirmação, então o Google Ads não consegue contar esse lead.

**Tarefa:**
- [ ] No sucesso do `POST /api/orcamento` (resposta 2xx), antes de redirecionar:
  ```js
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'generate_lead',
    form: 'orcamento',
    tipo_projeto: form.querySelector('[name="tipo-projeto"]')?.value || '',
    page: location.pathname,
  });
  ```
- [ ] Redirecionar para **`/criacao-sites/obrigado/`** (pequeno `setTimeout` de ~300 ms ou `eventCallback` do GTM, para o evento ser enviado antes de sair da página).
- [ ] Em caso de erro: mensagem amigável + botão de WhatsApp (não disparar o evento).
- [ ] **Não** enviar dados pessoais (nome, telefone) no `dataLayer` (LGPD + políticas do Google).

**No GTM (`GTM-P6BHKD8`):**
- [ ] Conferir se existe uma tag **GA4 – Evento** para `generate_lead` (acionador: *Evento personalizado* = `generate_lead`). Se não existir, criar e **publicar** o contêiner.
- [ ] Fazer o mesmo conferindo que `whatsapp_click` já está mapeado (já chega ao GA4).

---

## 3. Página de agradecimento `/criacao-sites/obrigado/`

**Arquivo:** `src/pages/criacao-sites/obrigado.astro`

- [ ] `<meta name="robots" content="noindex, nofollow">`
- [ ] Fora do `sitemap.xml` (filtrar no `@astrojs/sitemap`: `filter: (p) => !p.includes('/obrigado')`).
- [ ] Conteúdo:
  - H1: **Recebemos seu pedido de orçamento!**
  - Texto: "Em breve entraremos em contato pelo WhatsApp informado. Atendimento: seg a sex, 8h–19h | sáb, 8h–12h."
  - Botão: **"Quer agilizar? Fale agora no WhatsApp"** → `waLink('Olá! Acabei de enviar o formulário de orçamento no site.')`
  - Links: "Ver portfólio" (`/#portfolio`) e "Voltar ao site" (`/`).
- [ ] Opcional: dispara `generate_lead` **aqui** em vez de no form (só se o acesso à página for exclusivo via redirecionamento; nesse caso, remover o push do passo 2 para não contar em dobro).

---

## 4. Rastreamento: padronização e testes

- [ ] Todos os links `wa.me` com `data-track="whatsapp"` e um único listener:
  ```js
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="wa.me"]');
    if (!a) return;
    window.dataLayer?.push({
      event: 'whatsapp_click',
      local: a.dataset.local || 'indefinido',   // hero, preco-landing, float, exit-modal, cta-final…
      page: location.pathname,
    });
  });
  ```
  → Adicionar `data-local="..."` em cada botão para saber **qual CTA converte mais**.
- [ ] Remover listeners duplicados (hoje há scripts inline com `whatsapp_click`; garantir **um disparo por clique**).
- [ ] Links `tel:` disparando `phone_click` (opcional).
- [ ] Testar no **GTM → Visualizar (Tag Assistant)**:
  - [ ] clique no WhatsApp → `whatsapp_click` aparece e a tag GA4 dispara
  - [ ] envio do form → `generate_lead` aparece e redireciona para `/obrigado/`
- [ ] Conferir no **GA4 → Relatórios → Tempo real** que os dois eventos chegam.

---

## 5. Depois de publicar: voltar ao Claude para o Google Ads

Quando os itens 1 a 4 estiverem no ar, pedir ao Claude:

- [ ] Marcar **`generate_lead`** como evento principal no GA4 e importar como conversão no Google Ads (categoria **Envio de formulário de lead**, principal).
- [ ] Revisar as ações de conversão antigas da conta (ex.: "Solicitar cotação – Consultoria Gratuita", status *Requer atenção*; "Formulário" GA4 sem dados) e deixar como **secundárias ou remover**, para a campanha otimizar só pelo que importa.
- [ ] Se a página nova tiver âncora `#orcamento`: apontar o sitelink **"Orçamento Grátis"** para `https://rogerweb.com.br/criacao-sites/#orcamento`.
- [ ] Após 2–4 semanas com conversões: avaliar a troca de **CPC manual → Maximizar conversões**.
- [ ] Revisar os termos de pesquisa e acrescentar negativas.

---

## 6. Prompt sugerido para a IDE

> "Usando o AJUSTES-criacao-sites.md como especificação, faça no projeto Astro: (1) crie `src/data/contato.ts` com o WhatsApp 5511910802646 e a função `waLink()`, e substitua em todo o projeto o número 11912136490 (WhatsAppFloat e modal de saída) por ela; (2) no sucesso do formulário de `/criacao-sites/`, dispare `dataLayer.push({event:'generate_lead', form:'orcamento', tipo_projeto})` sem dados pessoais e redirecione para `/criacao-sites/obrigado/`; (3) crie a página `src/pages/criacao-sites/obrigado.astro` com noindex, fora do sitemap, conforme a seção 3; (4) centralize o rastreamento de cliques `wa.me` em um único listener com `data-local` em cada CTA, removendo disparos duplicados. Reutilize Layout e componentes existentes, Tailwind v4 com a paleta atual."
