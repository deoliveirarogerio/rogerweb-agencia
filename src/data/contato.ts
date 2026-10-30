export const WHATSAPP = '5511910802646';
export const WHATSAPP_EXIBICAO = '(11) 91080-2646';
export const EMAIL = 'contato@rogerweb.com.br';

export const waLink = (msg: string) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
