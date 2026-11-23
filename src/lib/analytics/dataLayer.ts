import { DataLayerEventPayload, AnalyticsEventType } from './types';

declare global {
  interface Window {
    dataLayer?: any[];
    clarity?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    __MIMOSHOW_ANALYTICS_DEBUG__?: boolean;
  }
}

// Cache em memória para deduplicação de eventos (evita envios repetidos por React 19 / render duplo)
const recentEventsCache = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 600;

// Lista de chaves sensíveis que NUNCA devem trafegar no Data Layer ou ferramentas de Analytics (LGPD / PCI-DSS)
const SENSITIVE_KEYS = [
  'cpf',
  'cnpj',
  'cpfcnpj',
  'cpf_cnpj',
  'senha',
  'password',
  'secret',
  'cartao',
  'credit_card',
  'card_number',
  'cvv',
  'cvc',
  'codigo_seguranca',
  'token',
  'access_token',
  'auth',
];

/**
 * Sanitiza recursivamente objetos removendo ou mascarando informações pessoais identificáveis (PII)
 */
export function sanitizeDataLayerPayload<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Mascarar números longos que parecem CPF/CNPJ ou Cartão
    const cleanNumbers = data.replace(/\D/g, '');
    if (cleanNumbers.length === 11 || cleanNumbers.length === 14 || cleanNumbers.length === 16) {
      return `***REDACTED-LGPD***` as unknown as T;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeDataLayerPayload(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))) {
        continue; // Descarta campos sensíveis
      }

      if (lowerKey === 'email' && typeof value === 'string') {
        // Pseudo-anonimização de e-mail (ex: j***@gmail.com)
        const parts = value.split('@');
        sanitized[key] = parts.length === 2 ? `${parts[0].slice(0, 1)}***@${parts[1]}` : '***@anon.com';
        continue;
      }

      if (lowerKey === 'telefone' || lowerKey === 'phone') {
        sanitized[key] = '***REDACTED-PHONE***';
        continue;
      }

      sanitized[key] = sanitizeDataLayerPayload(value);
    }
    return sanitized as T;
  }

  return data;
}

/**
 * Gera assinatura para identificar evento duplicado
 */
function createEventSignature(payload: DataLayerEventPayload): string {
  const event = payload.event;
  const ecommerce = payload.ecommerce;
  const eventId = payload.event_id || '';
  
  if (eventId) return `${event}:${eventId}`;

  if (ecommerce) {
    const items = ecommerce.items;
    const itemsSignature = Array.isArray(items)
      ? items.map((i: any) => `${i.item_id || i.id}:${i.quantity || 1}`).join('|')
      : '';
    const val = ecommerce.value || '';
    const transId = ecommerce.transaction_id || '';
    return `${event}:${transId}:${val}:${itemsSignature}`;
  }

  return `${event}:${JSON.stringify(payload.page_path || payload.search_term || '')}`;
}

/**
 * Envia o evento centralizado para o window.dataLayer, GTM e Clarity com deduplicação
 */
export function pushToDataLayer(rawPayload: DataLayerEventPayload): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Sanitizar dados para conformidade com a LGPD
  const payload = sanitizeDataLayerPayload(rawPayload);

  // 2. Verificar deduplicação
  const now = Date.now();
  const signature = createEventSignature(payload);
  const lastFired = recentEventsCache.get(signature);

  if (lastFired && now - lastFired < DEDUPLICATION_WINDOW_MS) {
    if (window.__MIMOSHOW_ANALYTICS_DEBUG__) {
      console.warn(`[DataLayer Deduplication] Evento descartado (duplicado recente): ${signature}`);
    }
    return false;
  }

  recentEventsCache.set(signature, now);

  // Limpeza de cache antigo
  if (recentEventsCache.size > 100) {
    for (const [key, timestamp] of recentEventsCache.entries()) {
      if (now - timestamp > 10000) {
        recentEventsCache.delete(key);
      }
    }
  }

  // 3. Garantir que o dataLayer existe
  window.dataLayer = window.dataLayer || [];

  // Padrão GA4: ao enviar um novo evento de ecommerce, limpar o ecommerce anterior para evitar poluição
  if (payload.ecommerce) {
    window.dataLayer.push({ ecommerce: null });
  }

  const finalPayload = {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  // 4. Inserir no Data Layer oficial do GTM/GA4
  window.dataLayer.push(finalPayload);

  // 5. Integração direta com Microsoft Clarity (Session Recording & Heatmaps)
  if (typeof window.clarity === 'function') {
    try {
      window.clarity('event', payload.event);
    } catch {}
  }

  // 6. Log no console se modo debug estiver ativo
  const isDebug =
    window.__MIMOSHOW_ANALYTICS_DEBUG__ ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('mimoshow_analytics_debug') === 'true') ||
    process.env.NODE_ENV === 'development';

  if (isDebug) {
    console.groupCollapsed(`%c📊 [DataLayer Event] ${payload.event}`, 'color: #0B2545; font-weight: bold; background: #FFD166; padding: 2px 6px; border-radius: 4px;');
    console.log('Payload:', finalPayload);
    console.log('Signature:', signature);
    console.groupEnd();
  }

  // 7. Notificar observadores internos (ex: Validador em Tempo Real do Painel Admin)
  try {
    window.dispatchEvent(
      new CustomEvent('mimoshow:analytics_event', {
        detail: finalPayload,
      })
    );
  } catch {}

  return true;
}
