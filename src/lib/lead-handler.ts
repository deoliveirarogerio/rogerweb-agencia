type Env = {
  TURNSTILE_SECRET_KEY: string;
  BREVO_API_KEY: string;
  LEAD_TO_EMAIL: string;
  LEAD_FROM_EMAIL: string;
};

type Kind = 'contato' | 'orcamento';

const ALLOWED_ORIGINS = ['https://rogerweb.com.br', 'https://www.rogerweb.com.br'];
const MIN_FILL_MS = 3000;
const MAX_FILL_MS = 2 * 60 * 60 * 1000;
const DISPOSABLE = ['mailinator.com', 'yopmail.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com', 'trashmail.com'];

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });

const clean = (v: unknown, max: number) =>
  String(v ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

const cleanMultiline = (v: unknown, max: number) =>
  String(v ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);

function looksLikeSpam(text: string): boolean {
  const links = (text.match(/https?:\/\/|www\./gi) || []).length;
  if (links > 1) return true;
  if (/[\u0400-\u04FF\u4E00-\u9FFF\u0600-\u06FF]/.test(text)) return true;
  if (/\b(viagra|casino|crypto|bitcoin|seo services|backlinks|loan)\b/i.test(text)) return true;
  return false;
}

export async function handleLead(request: Request, env: Env, kind: Kind): Promise<Response> {
  if (request.method !== 'POST') return json(405, { ok: false, error: 'method' });

  const origin = request.headers.get('Origin') || '';
  if (!ALLOWED_ORIGINS.includes(origin) && !origin.startsWith('http://localhost')) {
    return json(403, { ok: false, error: 'origin' });
  }

  const ct = request.headers.get('content-type') || '';
  const data: Record<string, unknown> = ct.includes('application/json')
    ? await request.json().catch(() => ({}))
    : Object.fromEntries(await request.formData());

  // 1. Honeypot
  if (clean(data.website, 200)) return json(200, { ok: true, leadId: null });

  // 2. Tempo de preenchimento
  const ts = Number(data.ts);
  const elapsed = Date.now() - ts;
  if (!ts || elapsed < MIN_FILL_MS || elapsed > MAX_FILL_MS) {
    return json(400, { ok: false, error: 'timing' });
  }

  // 3. Turnstile (temporariamente desabilitado até configurar site key)
  // const token = clean(data['cf-turnstile-response'], 2048);
  // if (!token) return json(400, { ok: false, error: 'captcha' });
  // const ip = request.headers.get('CF-Connecting-IP') || '';
  // const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
  //   method: 'POST',
  //   body: new URLSearchParams({
  //     secret: env.TURNSTILE_SECRET_KEY,
  //     response: token,
  //     remoteip: ip,
  //   }),
  // })
  //   .then((r) => r.json() as Promise<{ success: boolean; hostname?: string; action?: string }>)
  //   .catch(() => ({ success: false }));

  // if (!verify.success || (verify.hostname && !verify.hostname.endsWith('rogerweb.com.br') && verify.hostname !== 'localhost')) {
  //   return json(403, { ok: false, error: 'captcha' });
  // }

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
  if (fone && (fone.length < 10 || fone.length > 13)) {
    return json(422, { ok: false, error: 'telefone' });
  }

  if (kind === 'contato') {
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
      return json(422, { ok: false, error: 'email' });
    }
    if (DISPOSABLE.includes(email.split('@')[1])) {
      return json(422, { ok: false, error: 'email' });
    }
  } else if (!fone) {
    return json(422, { ok: false, error: 'telefone' });
  }

  // 5. Filtro de conteúdo
  if (looksLikeSpam(`${nome} ${mensagem}`)) {
    return json(200, { ok: true, leadId: null });
  }

  // 6. Atribuição
  const attr = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'landing']
    .map((k) => [k, clean(data[k], 200)])
    .filter(([, v]) => v);

  // 7. Envio pelo Brevo
  const leadId = crypto.randomUUID();
  const lines = [
    `Lead: ${leadId}`,
    `Origem: ${kind}${nicho ? ' / ' + nicho : ''}`,
    `Nome: ${nome}`,
    email ? `E-mail: ${email}` : null,
    fone ? `Telefone/WhatsApp: ${fone}` : null,
    servico ? `Serviço: ${servico}` : null,
    '',
    'Mensagem:',
    mensagem || '(vazia)',
    '',
    `Consentimento LGPD: sim, em ${new Date().toISOString()}`,
    ...attr.map(([k, v]) => `${k}: ${v}`),
  ].filter((l): l is string => l !== null);

  const sent = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
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
