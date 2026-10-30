# SEGURANCA-FORMULARIOS.md — Correção dos formulários do rogerweb.com.br

> Documento de contexto para a IA da IDE. Auditoria feita em 30/10/2026 no site em produção (https://rogerweb.com.br).
> Objetivo: fechar as brechas de spam e de segurança de **todos** os formulários **sem quebrar** o rastreamento do Google Tag Manager, GA4 e Google Ads.

---

## 1. Contexto do projeto

- **Stack:** Astro, hospedado na Cloudflare (Pages/Workers, plano Free). DNS na Cloudflare.
- **Rastreamento:** GTM `GTM-P6BHKD8` + GA4 (gtag `G-…`) + Contentsquare + Cloudflare Web Analytics.
- **E-mail:** Cloudflare Email Routing (recebimento) + Brevo (envio). O domínio já tem DKIM do Brevo.
- **Campanha Google Ads ativa:** rede de pesquisa, com destino na landing **`/criacao-sites`**. As páginas `/sites-para/*` também são landings.

### Já configurado no painel da Cloudflare (não refazer)

| Item | Estado |
|---|---|
| Widget Turnstile "RogerWeb - Formulários" (modo Gerenciado, hostname `rogerweb.com.br`) | ✅ criado. Chaves em *Segurança do aplicativo > Turnstile* |
| Bot Fight Mode | ✅ ligado |
| Rate limiting: `starts_with(http.request.uri.path, "/api/contato")`, 3 req/10 s por IP, bloqueio de 10 s | ✅ ativo |

> ⚠️ A regra de rate limiting cobre **somente** caminhos que começam com `/api/contato`. Por isso, todos os endpoints de formulário devem ficar sob esse prefixo (ver seção 4).

---

## 2. Inventário dos formulários

| Página | Campos | Envio atual | Evento de conversão |
|---|---|---|---|
| `/` (seção `#contato`) | `website` (honeypot), nome, email, telefone, servico, mensagem, lgpd_consent | `fetch` → `https://formsubmit.co/ajax/contato@rogerweb.com.br` | `generate_lead` presente |
| `/contato` | mesmos campos | FormSubmit (idem) | `generate_lead` presente |
| `/criacao-sites` (**landing do Google Ads**) | nicho (hidden), nome, whatsapp, mensagem, lgpd | `POST /api/orcamento` (nativo) | ❌ **sem `generate_lead`** |
| `/sites-para/*` (barbearias, clínicas, imobiliárias, etc.) | nicho (hidden), nome, whatsapp, mensagem, lgpd | `POST /api/orcamento` (nativo) | ❌ **sem `generate_lead`** |

Observação: `GET /api/orcamento` responde 404. **Confirme no código se o endpoint `/api/orcamento` existe e realmente envia o lead.** Se não existir, as landings da campanha estão perdendo leads.

---

## 3. Falhas encontradas (por prioridade)

### Críticas
1. **Envio direto para o FormSubmit pelo navegador.** O e-mail `contato@` fica exposto no código. Um bot pode postar direto no FormSubmit e ignorar honeypot e checagem de tempo, que só existem no front.
2. **Nenhuma validação no servidor:** sem Turnstile, sem validação de campos, sem filtro de conteúdo.
3. **Landings do Ads sem evento de conversão no envio do formulário.** O Google Ads não aprende com esses leads.
4. **Dados pessoais passam por um terceiro (FormSubmit)** sem contrato de tratamento. É um risco de LGPD.

### Altas
5. **GA4, GTM e Contentsquare carregam sem consentimento** (não há banner de cookies). É um risco de LGPD e deixa o site sem Consent Mode v2 para o Google Ads.
6. **Sem cabeçalhos de segurança:** faltam HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy e Permissions-Policy.
7. **Uso de `innerHTML`** no script da home e de `/criacao-sites`. Se algum dado digitado pelo usuário passar por ali, há risco de XSS.
8. **Uso de `alert()`** para feedback do formulário. É má experiência e não dá para rastrear.

### Médias
9. **Dois números de WhatsApp diferentes** no site: `(11) 91213-6490` e `(11) 91080-2646`. Os anúncios usam o 91080-2646. **Decisão do Rogério:** padronizar ou manter separado por origem (Ads x orgânico).
10. **Sem `maxlength`** e sem máscara ou normalização do telefone.
11. **gclid/UTMs não são capturados** junto com o lead, o que impede importar conversões offline no futuro.

---

## 4. Arquitetura alvo

```
Navegador ──(Turnstile token + campos + honeypot + ts + gclid/utm)──▶ POST /api/contato          (form geral)
                                                                    ▶ POST /api/contato/orcamento (landings)
                                                                         │
            Cloudflare (Bot Fight + Rate limit /api/contato*) ───────────┘
                                                                         ▼
                                    Validação: método, Origin, Turnstile (siteverify), honeypot, tempo,
                                    schema dos campos, filtros de conteúdo
                                                                         ▼
                                    Brevo API (e-mail para contato@) ── resposta JSON { ok, leadId }
                                                                         ▼
                        Front: só ao receber ok=true → dataLayer.push generate_lead → mensagem de sucesso
```

- **Remover totalmente o FormSubmit.**
- **Mover `/api/orcamento` para `/api/contato/orcamento`**, ou fazer as duas rotas usarem o mesmo handler sob `/api/contato*`, para a regra de rate limiting cobrir tudo. Se o caminho antigo precisar continuar existindo, crie um redirect 308 para o novo.

### Variáveis de ambiente (Cloudflare Pages > Settings > Variables, tipo *Secret*)

```
TURNSTILE_SECRET_KEY=...    # copiar do painel; NUNCA commitar
BREVO_API_KEY=...
LEAD_TO_EMAIL=contato@rogerweb.com.br
LEAD_FROM_EMAIL=site@rogerweb.com.br   # remetente verificado no Brevo
PUBLIC_TURNSTILE_SITE_KEY=...          # pública, pode ir no front
```

Para desenvolvimento local, use as chaves de teste da Cloudflare:
- Site key (sempre passa): `1x00000000000000000000AA`
- Secret (sempre passa): `1x0000000000000000000000000000000AA`
- Site key (sempre falha): `2x00000000000000000000AB`

---

## 5. Backend — handler único

Se o projeto usa o adapter `@astrojs/cloudflare` com rotas server, crie `src/pages/api/contato/index.ts` e `src/pages/api/contato/orcamento.ts`. Se o site é estático, use Pages Functions: `functions/api/contato/index.ts` e `functions/api/contato/orcamento.ts`. Nos dois casos, a lógica fica num módulo compartilhado:

```ts
// src/lib/lead-handler.ts
type Env = { TURNSTILE_SECRET_KEY: string; BREVO_API_KEY: string; LEAD_TO_EMAIL: string; LEAD_FROM_EMAIL: string };
type Kind = 'contato' | 'orcamento';

const ALLOWED_ORIGINS = ['https://rogerweb.com.br', 'https://www.rogerweb.com.br'];
const MIN_FILL_MS = 3000;            // envio em menos de 3 s = bot
const MAX_FILL_MS = 2 * 60 * 60e3;   // formulário aberto há mais de 2 h = token velho
const DISPOSABLE = ['mailinator.com', 'yopmail.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com', 'trashmail.com'];

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

const clean = (v: unknown, max: number) =>
  String(v ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanMultiline = (v: unknown, max: number) =>
  String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);

function looksLikeSpam(text: string): boolean {
  const links = (text.match(/https?:\/\/|www\./gi) || []).length;
  if (links > 1) return true;
  if (/[Ѐ-ӿ一-鿿؀-ۿ]/.test(text)) return true;   // cirílico, CJK, árabe
  if (/\b(viagra|casino|crypto|bitcoin|seo services|backlinks|loan)\b/i.test(text)) return true;
  return false;
}

export async function handleLead(request: Request, env: Env, kind: Kind): Promise<Response> {
  if (request.method !== 'POST') return json(405, { ok: false, error: 'method' });

  const origin = request.headers.get('Origin') || '';
  if (!ALLOWED_ORIGINS.includes(origin) && !origin.startsWith('http://localhost')) return json(403, { ok: false, error: 'origin' });

  const ct = request.headers.get('content-type') || '';
  const data: Record<string, unknown> = ct.includes('application/json')
    ? await request.json().catch(() => ({}))
    : Object.fromEntries(await request.formData());

  // 1. Honeypot: finge sucesso para o bot não insistir
  if (clean(data.website, 200)) return json(200, { ok: true, leadId: null });

  // 2. Tempo de preenchimento
  const ts = Number(data.ts);
  const elapsed = Date.now() - ts;
  if (!ts || elapsed < MIN_FILL_MS || elapsed > MAX_FILL_MS) return json(400, { ok: false, error: 'timing' });

  // 3. Turnstile (obrigatório)
  const token = clean(data['cf-turnstile-response'], 2048);
  if (!token) return json(400, { ok: false, error: 'captcha' });
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
  }).then(r => r.json() as Promise<{ success: boolean; hostname?: string; action?: string }>).catch(() => ({ success: false }));
  if (!verify.success || (verify.hostname && !verify.hostname.endsWith('rogerweb.com.br') && verify.hostname !== 'localhost'))
    return json(403, { ok: false, error: 'captcha' });

  // 4. Validação dos campos
  const nome = clean(data.nome, 80);
  const email = clean(data.email, 120).toLowerCase();
  const fone = clean(data.telefone ?? data.whatsapp, 20).replace(/\D/g, '');
  const servico = clean(data.servico, 60);
  const nicho = clean(data.nicho, 60);
  const mensagem = cleanMultiline(data.mensagem, 2000);
  const consent = data.lgpd_consent ?? data.lgpd;

  if (nome.length < 2) return json(422, { ok: false, error: 'nome' });
  if (!consent) return json(422, { ok: false, error: 'lgpd' });
  if (fone && (fone.length < 10 || fone.length > 13)) return json(422, { ok: false, error: 'telefone' });
  if (kind === 'contato') {
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return json(422, { ok: false, error: 'email' });
    if (DISPOSABLE.includes(email.split('@')[1])) return json(422, { ok: false, error: 'email' });
  } else if (!fone) return json(422, { ok: false, error: 'telefone' });

  // 5. Filtro de conteúdo: finge sucesso, mas não envia e não conta conversão
  if (looksLikeSpam(`${nome} ${mensagem}`)) return json(200, { ok: true, leadId: null });

  // 6. Atribuição (vem de campos hidden; ver seção 6)
  const attr = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'landing']
    .map(k => [k, clean(data[k], 200)]).filter(([, v]) => v);

  // 7. Envio pelo Brevo (texto puro: sem risco de HTML injection)
  const leadId = crypto.randomUUID();
  const lines = [
    `Lead: ${leadId}`, `Origem: ${kind}${nicho ? ' / ' + nicho : ''}`,
    `Nome: ${nome}`, email ? `E-mail: ${email}` : null, fone ? `Telefone/WhatsApp: ${fone}` : null, servico ? `Serviço: ${servico}` : null,
    '', 'Mensagem:', mensagem || '(vazia)', '',
    `Consentimento LGPD: sim, em ${new Date().toISOString()}`,
    ...attr.map(([k, v]) => `${k}: ${v}`),
  ].filter((l): l is string => l !== null);

  const sent = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: 'Site RogerWeb', email: env.LEAD_FROM_EMAIL },
      to: [{ email: env.LEAD_TO_EMAIL }],
      ...(email ? { replyTo: { email, name: nome } } : {}),
      subject: `Novo lead (${kind}${nicho ? ' - ' + nicho : ''}): ${nome}`,
      textContent: lines.join('\n'),
    }),
  });
  if (!sent.ok) return json(502, { ok: false, error: 'send' });

  return json(200, { ok: true, leadId });
}
```

Regras do backend:
- **Não registrar** nome, e-mail, telefone ou mensagem em `console.log`. Logue só o evento, por exemplo `lead_blocked: honeypot`.
- O nome e o e-mail **nunca** entram no cabeçalho `subject` sem passar por `clean()`, que remove `\r\n` e impede header injection.
- Resposta sempre em JSON e `no-store`.
- Para honeypot e spam, devolver `{ ok: true, leadId: null }`. O front **não** dispara conversão quando `leadId` é `null`.

---

## 6. Frontend — componente de formulário único

Unificar os dois formulários num componente Astro só (`src/components/LeadForm.astro`) com uma prop `kind="contato" | "orcamento"` e outra `nicho`.

```html
<form data-lead-form data-kind="orcamento" data-nicho="barbearias" novalidate>
  <!-- honeypot: fora da tela (não usar display:none, que alguns bots detectam) -->
  <div aria-hidden="true" style="position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden">
    <label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label>
  </div>
  <input type="hidden" name="ts">
  <input type="hidden" name="nicho" value="barbearias">
  <input type="hidden" name="gclid"><input type="hidden" name="gbraid"><input type="hidden" name="wbraid">
  <input type="hidden" name="utm_source"><input type="hidden" name="utm_medium"><input type="hidden" name="utm_campaign"><input type="hidden" name="utm_term">
  <input type="hidden" name="landing">

  <input name="nome" required maxlength="80" autocomplete="name">
  <input name="whatsapp" type="tel" required maxlength="20" inputmode="tel" autocomplete="tel">
  <textarea name="mensagem" maxlength="2000"></textarea>
  <label><input type="checkbox" name="lgpd" required> Li e aceito a <a href="/privacidade">Política de Privacidade</a></label>

  <div class="cf-turnstile" data-sitekey="{PUBLIC_TURNSTILE_SITE_KEY}" data-action="lead" data-language="pt-br"></div>
  <button type="submit">Enviar</button>
  <p data-status role="status" aria-live="polite"></p>
</form>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

Script (substitui o envio para o FormSubmit e os `alert()`):

```js
// Atribuição: primeiro toque da sessão
const ATTR_KEYS = ['gclid','gbraid','wbraid','utm_source','utm_medium','utm_campaign','utm_term'];
try {
  const q = new URLSearchParams(location.search);
  if (ATTR_KEYS.some(k => q.get(k))) {
    sessionStorage.setItem('rw_attr', JSON.stringify({ ...Object.fromEntries(ATTR_KEYS.map(k => [k, q.get(k) || ''])), landing: location.pathname }));
  }
} catch {}

document.querySelectorAll('form[data-lead-form]').forEach((form) => {
  const kind = form.dataset.kind;
  const endpoint = kind === 'orcamento' ? '/api/contato/orcamento' : '/api/contato';
  const status = form.querySelector('[data-status]');
  const btn = form.querySelector('button[type=submit]');
  form.ts.value = String(Date.now());
  try { const a = JSON.parse(sessionStorage.getItem('rw_attr') || '{}'); for (const [k, v] of Object.entries(a)) if (form[k]) form[k].value = v; } catch {}

  let started = false;
  form.addEventListener('input', () => {
    if (started) return; started = true;
    window.dataLayer?.push({ event: 'form_start', form_id: kind, nicho: form.dataset.nicho || '' });
  }, { once: true });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    btn.disabled = true; status.textContent = 'Enviando...';
    try {
      const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      const out = await res.json().catch(() => ({ ok: false }));
      if (res.ok && out.ok) {
        if (out.leadId) {
          // ÚNICO lugar onde a conversão é disparada: depois da confirmação do servidor
          window.dataLayer?.push({ event: 'generate_lead', form_id: kind, nicho: form.dataset.nicho || '', lead_id: out.leadId, value: 1, currency: 'BRL' });
        }
        form.reset();
        status.textContent = 'Recebemos sua mensagem! Retornamos em breve pelo WhatsApp ou e-mail.';
      } else {
        status.textContent = res.status === 429 ? 'Muitas tentativas. Aguarde alguns segundos e tente de novo.'
          : 'Não foi possível enviar. Confira os campos ou fale com a gente pelo WhatsApp.';
        window.dataLayer?.push({ event: 'form_error', form_id: kind, error: out.error || String(res.status) });
      }
    } catch {
      status.textContent = 'Falha de conexão. Tente novamente.';
    } finally {
      window.turnstile?.reset(form.querySelector('.cf-turnstile'));   // o token só vale para um uso
      form.ts.value = String(Date.now() - 3000);
      btn.disabled = false;
    }
  });
});
```

Regras do front:
- Trocar todo `innerHTML` que exibe texto por `textContent`.
- Remover o e-mail `contato@…` de qualquer JS ou `action`.
- Normalizar o telefone só no servidor. Uma máscara no front é opcional, apenas para usabilidade.

---

## 7. Rastreamento: o que melhorar sem quebrar GA4 e Google Ads

**O que encontrei:** o GTM `GTM-P6BHKD8` tem gatilhos para `generate_lead`, `form_submit`, `whatsapp_click`, `phone_click` e `cta_click`, e o site usa um helper `dataLayer.push({ event: eventName, ...parameters })`. **Não encontrei tag de conversão do Google Ads (`AW-…`) no GTM nem no site.** As conversões do Ads provavelmente vêm de eventos-chave importados do GA4. O Rogério deve confirmar em *Google Ads > Metas > Conversões*.

### Não mudar (para não quebrar nada)
- **Manter o snippet do GTM e o helper de `dataLayer`.**
- **Manter os nomes de eventos atuais:** `generate_lead`, `form_submit`, `whatsapp_click`, `phone_click`, `cta_click`, `exit_intent`. Os gatilhos do GTM dependem deles.
- A regra de rate limiting e o Turnstile valem só para `/api/contato*`. **Não criar regras de WAF que desafiem a página inteira nem caminhos de scripts**, porque GTM, GA4 e Ads usam domínios do Google e não passam pela Cloudflare.

### Corrigir e melhorar
1. **Disparar `generate_lead` só depois do `ok` do servidor e com `leadId` não nulo**, como no script acima. Se hoje o evento dispara no clique ou no submit, o spam vira conversão no Ads e o lance inteligente aprende errado.
2. **Adicionar `generate_lead` em `/criacao-sites` e `/sites-para/*`.** Hoje essas landings, que são o destino da campanha, não disparam conversão de formulário.
3. **Mandar parâmetros úteis:** `form_id`, `nicho`, `lead_id`. O `lead_id` serve como ID de transação para deduplicar no Ads.
4. **Não enviar dados pessoais ao GA4.** Nome, e-mail e telefone **nunca** entram em parâmetros de evento, porque isso viola a política do Google. Se quiser *conversões otimizadas* no Ads, envie `user_data` (e-mail e telefone em E.164) **somente** pela tag de conversão do Ads no GTM e só com consentimento `ad_user_data` concedido.
5. **Capturar gclid, gbraid, wbraid e UTMs** nos campos hidden, como já está no componente. Isso permite importar conversões offline ("lead virou cliente") no futuro.
6. **Consent Mode v2 + banner de cookies:**
   - Antes do snippet do GTM, definir os padrões como negados:
     ```html
     <script>
       window.dataLayer = window.dataLayer || [];
       function gtag(){dataLayer.push(arguments);}
       gtag('consent', 'default', { ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', analytics_storage:'denied', wait_for_update: 500 });
     </script>
     ```
   - Ao aceitar: `gtag('consent','update',{ ad_storage:'granted', ad_user_data:'granted', ad_personalization:'granted', analytics_storage:'granted' })` e salvar a escolha.
   - **Manter o GTM sempre carregado** (Consent Mode avançado). Assim o Google Ads continua modelando conversões de quem recusa. **Não** bloquear o GTM até o aceite.
   - **Contentsquare só carrega depois do aceite**, porque não respeita o Consent Mode do Google.
   - Adicionar um link "Preferências de cookies" no rodapé para o visitante mudar a escolha.
7. **WhatsApp:** manter o `whatsapp_click` e acrescentar o parâmetro `wa_number` (só os 4 últimos dígitos) para separar os dois números nos relatórios.
8. **Página `/obrigado` (opcional):** não é necessária com o evento acima. Se criar, use `noindex` e não a use como segunda conversão, para não contar o lead duas vezes.

---

## 8. Cabeçalhos de segurança (`public/_headers`)

Publique a CSP primeiro como **`Content-Security-Policy-Report-Only`**. Navegue pelo site com o GTM Preview, confira o console e só depois troque para `Content-Security-Policy`. Isso evita derrubar GA4 ou Ads por um domínio esquecido.

```
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://googleads.g.doubleclick.net https://www.googleadservices.com https://www.google.com https://challenges.cloudflare.com https://static.cloudflareinsights.com https://t.contentsquare.net https://*.contentsquare.net; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.google.com https://google.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://www.googleadservices.com https://cloudflareinsights.com https://*.contentsquare.net https://challenges.cloudflare.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; frame-src https://challenges.cloudflare.com https://www.googletagmanager.com https://td.doubleclick.net https://www.google.com; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; upgrade-insecure-requests

/api/*
  Cache-Control: no-store
  X-Robots-Tag: noindex
```

Observações:
- O `'unsafe-inline'` em `script-src` é necessário por causa do snippet do GTM e dos scripts inline do Astro. Remover exige nonces, que é uma melhoria para depois.
- `form-action 'self'` só funciona **depois** de remover o FormSubmit.
- `HSTS preload` é difícil de reverter. Confirme antes que todos os subdomínios têm HTTPS.

---

## 9. Pendências manuais (Rogério, no painel)

- [ ] **SPF:** editar o TXT `v=spf1` para `v=spf1 include:_spf.mx.cloudflare.net include:spf.brevo.com ~all`.
- [ ] **IP de origem exposto:** os registros `ftp` e `mail` estão como "Somente DNS" e revelam o IP 148.113.206.110, o que permite contornar a Cloudflare. Remova-os se não forem usados.
- [ ] **Cadastrar os secrets** da seção 4 no projeto Pages/Workers.
- [ ] **Se mudar o caminho dos endpoints**, ajustar a expressão da regra de rate limiting.
- [ ] **Decidir sobre os dois números de WhatsApp.**
- [ ] **Confirmar como as conversões do Google Ads são importadas:** GA4 ou tag AW.

---

## 10. Testes de aceitação

1. **Envio normal** em `/`, `/contato`, `/criacao-sites` e uma página de `/sites-para/*`: o e-mail chega no `contato@` com Reply-To do cliente, e o GTM Preview mostra `generate_lead` **uma vez**, com `lead_id`.
2. **POST direto sem token** (`curl -X POST https://rogerweb.com.br/api/contato -d nome=Teste`): deve retornar 400/403, sem e-mail e sem conversão.
3. **Honeypot preenchido:** retorna `{ ok: true, leadId: null }`, sem e-mail e sem `generate_lead`.
4. **Envio em menos de 3 s:** retorna 400 `timing`.
5. **Mensagem com 3 links ou texto em cirílico:** não envia e não converte.
6. **Mais de 3 envios em 10 s pelo mesmo IP:** a Cloudflare retorna 429 e o front mostra a mensagem de espera.
7. **GA4 DebugView e Google Ads (Diagnóstico de conversões):** os eventos continuam chegando depois da CSP e do Consent Mode.
8. **Recusar cookies:** o GA4 envia pings sem cookie (Consent Mode), e o Contentsquare não carrega.
9. **Busca no build final** (`grep -r "formsubmit\|contato@rogerweb" dist/`): não pode retornar nada no JS do cliente.
10. **securityheaders.com:** nota mínima A.
